import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/lib/services/profiles.service';
import type { UserProfile, UserRole } from '@/types';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Variables Supabase manquantes pour les opérations d’administration.');
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/users
 * Récupère l'ensemble exhaustif des comptes créés sur la plateforme
 * (Auth Supabase + table Profiles synchronisés) pour le Super Administrateur.
 */
export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();

    // 1. Récupérer tous les comptes d'authentification Supabase
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
      console.error('Erreur listUsers:', authErr.message);
      return NextResponse.json({ success: false, error: authErr.message }, { status: 500 });
    }

    const authUsers = authData?.users || [];

    // 2. Récupérer tous les profils existants en base
    const { data: profilesData, error: profilesErr } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesErr) {
      console.warn('Erreur lecture profiles:', profilesErr.message);
    }

    const profilesMap = new Map<string, any>();
    (profilesData || []).forEach((p) => {
      if (p.email) profilesMap.set(p.email.toLowerCase(), p);
      if (p.id) profilesMap.set(p.id, p);
    });

    const unifiedUsers: UserProfile[] = [];
    const missingProfilesToInsert: any[] = [];

    // 3. Fusionner et auto-provisionner les profils manquants
    for (const authUser of authUsers) {
      const email = (authUser.email || '').trim().toLowerCase();
      if (!email) continue;

      let profile = profilesMap.get(email) || profilesMap.get(authUser.id);

      const isSuperAdmin = isSuperAdminEmail(email);
      const computedRole: UserRole = isSuperAdmin
        ? 'SUPER_ADMIN'
        : (profile?.role || authUser.user_metadata?.role || 'ORGANIZER') as UserRole;

      const computedName =
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        email.split('@')[0];

      const computedPhone = profile?.phone || authUser.phone || authUser.user_metadata?.phone || undefined;
      const computedAvatar = profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined;
      const computedOrg = profile?.organization || authUser.user_metadata?.organization || (isSuperAdmin ? 'Jël Tix SAS' : undefined);

      if (!profile) {
        missingProfilesToInsert.push({
          id: authUser.id,
          email,
          full_name: computedName,
          role: computedRole,
          phone: computedPhone || null,
          avatar_url: computedAvatar || null,
          organization: computedOrg || null,
          is_active: true,
          created_at: authUser.created_at,
        });
      }

      unifiedUsers.push({
        id: profile?.id || authUser.id,
        email,
        fullName: computedName,
        role: computedRole,
        phone: computedPhone,
        avatarUrl: computedAvatar,
        organization: computedOrg,
        organizationId: profile?.organization_id || null,
        isActive: profile ? profile.is_active !== false : true,
        createdAt: profile?.created_at || authUser.created_at,
      });
    }

    // 4. Ajouter les profils pré-créés qui n'auraient pas encore de authUser
    for (const p of (profilesData || [])) {
      if (p.email && !unifiedUsers.some((u) => u.email.toLowerCase() === p.email.toLowerCase())) {
        unifiedUsers.push({
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          role: p.role as UserRole,
          phone: p.phone || undefined,
          avatarUrl: p.avatar_url || undefined,
          organization: p.organization || undefined,
          organizationId: p.organization_id || null,
          isActive: p.is_active !== false,
          createdAt: p.created_at,
        });
      }
    }

    // Auto-insérer les profils manquants
    if (missingProfilesToInsert.length > 0) {
      try {
        await supabaseAdmin.from('profiles').upsert(missingProfilesToInsert);
      } catch (e) {
        console.warn('Avertissement auto-synchro profils:', e);
      }
    }

    // Trier du plus récent au plus ancien
    unifiedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      users: unifiedUsers,
      totalCount: unifiedUsers.length,
    });
  } catch (err: any) {
    console.error('GET /api/users exception:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erreur lors de la récupération des utilisateurs.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Permet au Super Admin d'inviter ou créer un utilisateur avec rôle sur la plateforme
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, role, organization, password } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Nom, email et rôle sont obligatoires.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const initialPassword = password && password.trim().length >= 6 ? password.trim() : 'Jeltix2026!';
    const supabaseAdmin = getAdminClient();

    // 1. Créer ou récupérer dans auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!authUser) {
      const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

      if (createErr || !createdAuth.user) {
        return NextResponse.json(
          { success: false, error: createErr?.message || 'Erreur création du compte d’accès.' },
          { status: 500 }
        );
      }
      authUser = createdAuth.user;
    }

    // 2. Upsert dans profiles
    const { data: savedProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: cleanEmail,
        full_name: fullName,
        role: isSuperAdminEmail(cleanEmail) ? 'SUPER_ADMIN' : role,
        phone: phone || null,
        organization: organization || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileErr || !savedProfile) {
      return NextResponse.json(
        { success: false, error: profileErr?.message || 'Erreur enregistrement profil.' },
        { status: 500 }
      );
    }

    const newUser: UserProfile = {
      id: savedProfile.id,
      email: savedProfile.email,
      fullName: savedProfile.full_name,
      role: savedProfile.role as UserRole,
      phone: savedProfile.phone || undefined,
      organization: savedProfile.organization || undefined,
      isActive: savedProfile.is_active !== false,
      createdAt: savedProfile.created_at,
    };

    return NextResponse.json({
      success: true,
      user: newUser,
      defaultPassword: initialPassword,
      message: `Compte ${fullName} créé avec succès !`,
    });
  } catch (err: any) {
    console.error('POST /api/users exception:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erreur serveur.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users
 * Modifie le statut actif / inactif d'un compte
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID requis.' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: Boolean(isActive) })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Statut mis à jour avec succès.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erreur serveur.' }, { status: 500 });
  }
}

/**
 * DELETE /api/users
 * Supprime un compte (Auth Supabase + table Profiles)
 * Protection stricte : impossible de supprimer un Super Administrateur
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('email');

    if (!userId && !userEmail) {
      return NextResponse.json({ success: false, error: 'Identifiant ou email requis.' }, { status: 400 });
    }

    if (userEmail && isSuperAdminEmail(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Action interdite : impossible de supprimer un compte Super Administrateur.' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getAdminClient();

    // Vérifier si l'utilisateur à supprimer est un Super Admin par son id
    if (userId) {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, role')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile?.email && isSuperAdminEmail(userProfile.email)) {
        return NextResponse.json(
          { success: false, error: 'Action interdite : impossible de supprimer un compte Super Administrateur.' },
          { status: 403 }
        );
      }

      // Supprimer le profil
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      // Supprimer de Supabase Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (authDelErr) {
        console.warn('Erreur suppression auth.user:', authDelErr);
      }
    } else if (userEmail) {
      await supabaseAdmin.from('profiles').delete().eq('email', userEmail.toLowerCase().trim());
    }

    return NextResponse.json({ success: true, message: 'Compte supprimé avec succès.' });
  } catch (err: any) {
    console.error('DELETE /api/users exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
