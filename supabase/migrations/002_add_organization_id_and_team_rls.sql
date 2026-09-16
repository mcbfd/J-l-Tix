-- ==============================================================================
-- Migration 002 — Team Management: Add organization_id to profiles
-- Idempotent (safe to run multiple times)
-- ==============================================================================

-- Add organization_id column to profiles table
-- This links SELLER/CONTROLLER team members to their Organizer's profile id
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for fast team member lookups by organizer
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- ==============================================================================
-- RLS Policy: Organizers can read their own team members
-- ==============================================================================

DROP POLICY IF EXISTS "Organizers can read their team members" ON profiles;
CREATE POLICY "Organizers can read their team members"
ON profiles FOR SELECT
USING (
  -- User can see their own profile
  auth.uid() = id
  OR
  -- Organizer can see members of their team (where organization_id = organizer's id)
  organization_id = auth.uid()
  OR
  -- Super Admin sees everyone
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'SUPER_ADMIN'
  )
);

-- ==============================================================================
-- RLS Policy: Only SUPER_ADMIN and ORGANIZER can insert team members
-- ==============================================================================

DROP POLICY IF EXISTS "Organizers can create team members" ON profiles;
CREATE POLICY "Organizers can create team members"
ON profiles FOR INSERT
WITH CHECK (
  -- The inserting user is SUPER_ADMIN
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'SUPER_ADMIN'
  )
  OR
  -- The inserting user is an ORGANIZER and is linking the new member to themselves
  (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'ORGANIZER'
    )
    AND organization_id = auth.uid()
    AND role IN ('SELLER', 'CONTROLLER')
  )
);

-- ==============================================================================
-- RLS Policy: Organizers can update their own team members status
-- ==============================================================================

DROP POLICY IF EXISTS "Organizers can update their team members" ON profiles;
CREATE POLICY "Organizers can update their team members"
ON profiles FOR UPDATE
USING (
  -- Own profile
  auth.uid() = id
  OR
  -- Organizer managing their team
  (
    organization_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('ORGANIZER', 'SUPER_ADMIN')
    )
  )
  OR
  -- Super Admin can update everything
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'SUPER_ADMIN'
  )
);
