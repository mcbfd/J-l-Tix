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
  email: string;
  fullName: string;
  role: TeamRole;
  /** Optional phone number */
  phone?: string;
}

/**
 * Create a new team member (SELLER or CONTROLLER) in the profiles table.
 * This does NOT create a Supabase Auth user — the member can still sign in via
 * the email+password registration flow, and their profile will be pre-provisioned
 * with the correct role upon first login.
 */
export async function createTeamMember(
  params: CreateTeamMemberParams
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const supabase = createClient();
  const cleanEmail = params.email.trim().toLowerCase();

  // Guard: only SELLER and CONTROLLER can be created via this service
  if (!['SELLER', 'CONTROLLER'].includes(params.role)) {
    return { success: false, error: 'Rôle non autorisé. Seuls SELLER et CONTROLLER peuvent être créés.' };
  }

  // Check if a profile already exists for this email
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', cleanEmail)
    .single();

  if (existing) {
    return {
      success: false,
      error: `Un compte existe déjà pour l'adresse ${cleanEmail}. Contactez l'administrateur pour modifier le rôle.`,
    };
  }

  // Pre-provision the profile so that when the member logs in for the first time,
  // they'll be matched by email and receive the correct role
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      email: cleanEmail,
      full_name: params.fullName,
      role: params.role,
      phone: params.phone ?? null,
      organization_id: params.organizerId,
      is_active: true,
    })
    .select()
    .single();

  if (error || !newProfile) {
    console.error('createTeamMember error:', error?.message);
    return {
      success: false,
      error: error?.message ?? 'Erreur lors de la création du membre.',
    };
  }

  return {
    success: true,
    profile: {
      id: newProfile.id,
      email: newProfile.email,
      fullName: newProfile.full_name,
      role: newProfile.role as UserRole,
      phone: newProfile.phone,
      isActive: newProfile.is_active !== false,
      createdAt: newProfile.created_at,
    },
  };
}

/**
 * Fetch all team members belonging to a given organizer (by organization_id)
 */
export async function getTeamMembers(organizerId: string): Promise<UserProfile[]> {
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
}

/**
 * Toggle active/inactive status of a team member
 * An ORGANIZER can only toggle members of their own team.
 */
export async function toggleTeamMemberStatus(
  organizerId: string,
  memberId: string,
  isSuperAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Fetch current status and organization_id
  const { data: member, error: fetchError } = await supabase
    .from('profiles')
    .select('is_active, organization_id, role')
    .eq('id', memberId)
    .single();

  if (fetchError || !member) {
    return { success: false, error: 'Membre introuvable.' };
  }

  // Guard: ORGANIZER can only toggle their own team members
  if (!isSuperAdmin && member.organization_id !== organizerId) {
    return { success: false, error: 'Accès refusé. Ce membre ne fait pas partie de votre équipe.' };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_active: !member.is_active })
    .eq('id', memberId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Remove a team member from the organizer's team
 * (sets organization_id to null, does not delete the profile)
 */
export async function removeFromTeam(
  organizerId: string,
  memberId: string,
  isSuperAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: member } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', memberId)
    .single();

  if (!isSuperAdmin && member?.organization_id !== organizerId) {
    return { success: false, error: 'Accès refusé. Ce membre ne fait pas partie de votre équipe.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: null })
    .eq('id', memberId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
