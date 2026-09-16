import { createClient } from '@/lib/supabase/client';
import type { UserProfile, UserRole } from '@/types';

/**
 * Team Management Service
 *
 * Allows an ORGANIZER (or SUPER_ADMIN) to create and manage their team:
 *   - SELLER → can operate the POS Guichet (Caisse)
 *   - CONTROLLER → can operate the entrance QR scanner
 *
 * Business rules:
 *   - An ORGANIZER can only create SELLER / CONTROLLER roles (never ORGANIZER / SUPER_ADMIN)
 *   - A SUPER_ADMIN can create any role
 *   - Newly created team members are linked via `organization_id` to the organizer's profile id
 */

export type TeamRole = 'SELLER' | 'CONTROLLER';

export interface CreateTeamMemberParams {
  /** UUID of the organizer creating the member */
  organizerId: string;
  organizerEmail?: string;
  email: string;
  fullName: string;
  role: TeamRole;
  /** Optional phone number */
  phone?: string;
  /** Optional initial password */
  password?: string;
}

/**
 * Create a new team member (SELLER or CONTROLLER) via server API route
 * This provisions both the Supabase Auth user and the profile record.
 */
export async function createTeamMember(
  params: CreateTeamMemberParams
): Promise<{ success: boolean; profile?: UserProfile; defaultPassword?: string; error?: string }> {
  try {
    const res = await fetch('/api/users/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la création du membre d’équipe.',
      };
    }

    return {
      success: true,
      profile: data.profile,
      defaultPassword: data.defaultPassword,
    };
  } catch (err: any) {
    console.warn('createTeamMember network error:', err);
    return {
      success: false,
      error: err?.message || 'Erreur réseau lors de la communication avec le serveur.',
    };
  }
}

/**
 * Fetch all team members belonging to a given organizer
 */
export async function getTeamMembers(organizerId: string, organizerEmail?: string): Promise<UserProfile[]> {
  try {
    const query = new URLSearchParams();
    if (organizerId) query.set('organizerId', organizerId);
    if (organizerEmail) query.set('organizerEmail', organizerEmail);

    const res = await fetch(`/api/users/team?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        return data.members;
      }
    }
  } catch (err) {
    console.warn('getTeamMembers API error, trying direct fallback:', err);
  }

  // Client Supabase fallback
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizerId)
      .in('role', ['SELLER', 'CONTROLLER'])
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role as UserRole,
      phone: p.phone,
      avatarUrl: p.avatar_url,
      isActive: p.is_active !== false,
      createdAt: p.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Toggle active/inactive status of a team member
 */
export async function toggleTeamMemberStatus(
  organizerId: string,
  memberId: string,
  isSuperAdmin = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizerId, memberId, isSuperAdmin }),
    });
    const data = await res.json();
    if (res.ok && data.success) return { success: true };
  } catch (err) {
    console.warn('toggleTeamMemberStatus API error:', err);
  }

  // Fallback client
  try {
    const supabase = createClient();
    const { data: member } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', memberId)
      .single();

    if (member) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !member.is_active })
        .eq('id', memberId);

      if (!error) return { success: true };
    }
  } catch {}

  return { success: false, error: 'Impossible de modifier le statut du membre.' };
}

/**
 * Remove a team member from the organizer's team
 */
export async function removeFromTeam(
  organizerId: string,
  memberId: string,
  isSuperAdmin = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizerId, memberId, isSuperAdmin }),
    });
    const data = await res.json();
    if (res.ok && data.success) return { success: true };
  } catch (err) {
    console.warn('removeFromTeam API error:', err);
  }

  // Fallback client
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ organization_id: null })
      .eq('id', memberId);

    if (!error) return { success: true };
  } catch {}

  return { success: false, error: 'Impossible de retirer le membre.' };
}

/**
 * Change / reset password for a user
 * - SUPER_ADMIN can change password for any user
 * - ORGANIZER can change password for members of their own team
 */
export async function changeUserPassword(params: {
  targetEmail: string;
  targetUserId?: string;
  newPassword: string;
  callerEmail?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erreur lors du changement de mot de passe.' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau.' };
  }
}

