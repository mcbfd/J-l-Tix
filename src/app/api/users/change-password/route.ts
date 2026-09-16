import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/lib/services/profiles.service';

/**
 * POST /api/users/change-password
 * 
 * Permet :
 * 1. Au SUPER_ADMIN de changer le mot de passe de TOUS les utilisateurs (organisateurs, contrôleurs, caissiers, etc.)
 * 2. À un ORGANISATEUR de changer le mot de passe des membres de SON équipe uniquement (Vendeurs guichet, Contrôleurs)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetEmail, newPassword, callerEmail: providedCallerEmail } = body;

    if (!targetEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Email cible et nouveau mot de passe requis.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    const cleanTargetEmail = targetEmail.trim().toLowerCase();

    // 1. Authentifier l'appelant
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    const activeCallerEmail = (user?.email || providedCallerEmail || '').trim().toLowerCase();

    if (!activeCallerEmail) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // 2. Déterminer le rôle de l'appelant
    const isSuperAdmin = isSuperAdminEmail(activeCallerEmail);

    // Récupérer le profil Supabase de l'appelant
    const { data: callerProfile } = await supabaseServer
      .from('profiles')
      .select('id, email, role, organization_id')
      .eq('email', activeCallerEmail)
      .single();

    const isOrganizer = callerProfile?.role === 'ORGANIZER';

    if (!isSuperAdmin && !isOrganizer) {
      return NextResponse.json(
        { error: 'Action non autorisée. Seuls les Super Administrateurs et les Organisateurs peuvent modifier des mots de passe.' },
        { status: 403 }
      );
    }

    // 3. Si l'appelant est un ORGANISATEUR (et non SUPER_ADMIN) :
    // Vérification stricte qu'il ne modifie QUE les membres de son équipe
    if (!isSuperAdmin && isOrganizer) {
      const { data: targetProfile, error: targetError } = await supabaseServer
        .from('profiles')
        .select('id, email, role, organization_id')
        .eq('email', cleanTargetEmail)
        .single();

      if (targetError || !targetProfile) {
        return NextResponse.json(
          { error: 'Utilisateur cible introuvable.' },
          { status: 404 }
        );
      }

      // Un organisateur ne peut JAMAIS changer le mot de passe d'un admin ou d'un autre organisateur
      if (['SUPER_ADMIN', 'ORGANIZER'].includes(targetProfile.role) || isSuperAdminEmail(cleanTargetEmail)) {
        return NextResponse.json(
          { error: 'Action refusée. Un organisateur ne peut pas modifier le mot de passe d’un autre organisateur ou d’un administrateur.' },
          { status: 403 }
        );
      }

      // Le membre doit appartenir à l'organisation de l'organisateur
      if (targetProfile.organization_id !== callerProfile?.id) {
        return NextResponse.json(
          { error: 'Action refusée. Cet utilisateur ne fait pas partie de votre équipe.' },
          { status: 403 }
        );
      }
    }

    // 4. Modification via le client Admin Supabase (service_role)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Configuration serveur Supabase (service_role) manquante.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Rechercher l'utilisateur dans auth.users
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('listUsers error:', listError);
    }

    const existingAuthUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanTargetEmail
    );

    if (existingAuthUser) {
      // L'utilisateur existe dans auth.users -> mise à jour du mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('updateUserById error:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Erreur lors de la mise à jour du mot de passe.' },
          { status: 500 }
        );
      }
    } else {
      // L'utilisateur n'existe pas encore dans auth.users (pré-enregistré dans profiles) -> création directe
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, role')
        .eq('email', cleanTargetEmail)
        .single();

      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanTargetEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: targetProfile?.full_name || cleanTargetEmail.split('@')[0],
          role: targetProfile?.role || 'CONTROLLER',
        },
      });

      if (createError) {
        console.error('createUser error:', createError);
        return NextResponse.json(
          { error: createError.message || 'Erreur lors de la configuration du compte auth.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Le mot de passe de ${cleanTargetEmail} a été modifié avec succès.`,
    });
  } catch (error: any) {
    console.error('change-password API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
