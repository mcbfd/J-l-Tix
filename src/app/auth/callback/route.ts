import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/services/profiles.service';

/**
 * Supabase Auth OAuth Callback Route (/auth/callback)
 * Exchanges the temporary authorization code from Google OAuth for a session
 * and automatically provisions or updates the user profile in Supabase.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectPath = requestUrl.searchParams.get('redirect') || '/dashboard';

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
        const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;
        
        // Strict RBAC: Only designated emails receive SUPER_ADMIN role
        const role = isSuperAdminEmail(email) ? 'SUPER_ADMIN' : 'ORGANIZER';

        // Upsert user profile in PostgreSQL database
        await supabase
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
            { onConflict: 'email' }
          );

        // Redirect destination based on role
        let destination = redirectPath;
        if (destination === '/login' || !destination) {
          destination = '/dashboard';
        }

        const response = NextResponse.redirect(new URL(destination, requestUrl.origin));

        // Set application auth session cookie
        response.cookies.set('jeltix_auth_session', 'true', {
          path: '/',
          maxAge: 604800, // 7 days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

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
