import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/services/profiles.service';

/**
 * Supabase Auth OAuth Callback Route (/auth/callback)
 * Exchanges the temporary authorization code from Google OAuth for a session
 * and automatically provisions or updates the user profile in Supabase.
 *
 * Role attribution rules (strict RBAC):
 *   - mamadoucheikhba9@gmail.com / mcbfd9@gmail.com → SUPER_ADMIN
 *   - All other Google accounts → ORGANIZER (by default)
 *   - SELLER and CONTROLLER are NEVER self-assigned; they are created by ORGANIZER/SUPER_ADMIN
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectParam = requestUrl.searchParams.get('redirect');

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const email = (data.user.email || '').trim().toLowerCase();
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Utilisateur');
        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          null;

        // Strict RBAC: SUPER_ADMIN only for the two MCB accounts
        const isSuperAdmin = isSuperAdminEmail(email);

        // Check if profile already exists in DB to respect existing role (SELLER / CONTROLLER)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', data.user.id)
          .single();

        // Never downgrade an existing role; only upgrade anon → ORGANIZER or enforce SUPER_ADMIN
        let role: string;
        if (isSuperAdmin) {
          role = 'SUPER_ADMIN';
        } else if (existingProfile?.role) {
          // Preserve the role assigned by an admin (e.g. SELLER, CONTROLLER)
          role = existingProfile.role;
        } else {
          // First time login → ORGANIZER by default
          role = 'ORGANIZER';
        }

        // Upsert profile in PostgreSQL — update only non-sensitive fields
        const { data: upsertedProfile } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email,
              full_name: fullName,
              role,
              avatar_url: avatarUrl,
              is_active: true,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        // Determine redirect destination based on role
        let destination = redirectParam;
        if (!destination || destination === '/login') {
          switch (role) {
            case 'SELLER':
              destination = '/sales/pos';
              break;
            case 'CONTROLLER':
              destination = '/scan';
              break;
            default:
              destination = '/dashboard';
          }
        }

        const response = NextResponse.redirect(new URL(destination, requestUrl.origin));

        // Session cookie for middleware
        response.cookies.set('jeltix_auth_session', 'true', {
          path: '/',
          maxAge: 604800, // 7 days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

        // Store the user profile in a cookie so the client-side store can sync it on mount
        if (upsertedProfile) {
          const profilePayload = {
            id: upsertedProfile.id,
            email: upsertedProfile.email,
            fullName: upsertedProfile.full_name,
            role: upsertedProfile.role,
            avatarUrl: upsertedProfile.avatar_url,
            organizationId: upsertedProfile.organization_id ?? null,
            isActive: upsertedProfile.is_active !== false,
            createdAt: upsertedProfile.created_at,
          };
          response.cookies.set(
            'jeltix_user_profile',
            JSON.stringify(profilePayload),
            {
              path: '/',
              maxAge: 604800,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }
          );
        }

        return response;
      } else if (error) {
        console.error('Supabase code exchange error:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
    }
  }

  // If code exchange failed or was rejected, return to login with error query
  return NextResponse.redirect(new URL('/login?error=google-auth-failed', requestUrl.origin));
}
