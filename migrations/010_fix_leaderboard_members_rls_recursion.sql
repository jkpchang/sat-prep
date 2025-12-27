-- Fix infinite recursion in leaderboard_members RLS policies
-- The issue: Policies query leaderboard_members to check membership, causing recursion
-- Solution: Create SECURITY DEFINER function to check membership without triggering RLS

-- Create function to check if user is a member of a leaderboard
-- SECURITY DEFINER allows it to bypass RLS when checking membership
CREATE OR REPLACE FUNCTION is_leaderboard_member(
  p_leaderboard_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM leaderboard_members
    WHERE leaderboard_id = p_leaderboard_id
    AND user_id = p_user_id
  );
END;
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Members can view all members of their leaderboards" ON leaderboard_members;
DROP POLICY IF EXISTS "Members can add new members" ON leaderboard_members;

-- Recreate SELECT policy using the function to avoid recursion
-- Owners can view all members, members can view all members of their leaderboards
CREATE POLICY "Members can view all members of their leaderboards"
  ON leaderboard_members
  FOR SELECT
  USING (
    -- Owner can view all members
    EXISTS (
      SELECT 1 FROM private_leaderboards
      WHERE private_leaderboards.id = leaderboard_members.leaderboard_id
      AND private_leaderboards.owner_id = auth.uid()
    )
    OR
    -- Member can view all members (using function to avoid recursion)
    is_leaderboard_member(leaderboard_members.leaderboard_id, auth.uid())
  );

-- Recreate INSERT policy using the function to avoid recursion
-- Owners can add members, existing members can add new members
CREATE POLICY "Members can add new members"
  ON leaderboard_members
  FOR INSERT
  WITH CHECK (
    -- Owner can add members
    EXISTS (
      SELECT 1 FROM private_leaderboards
      WHERE private_leaderboards.id = leaderboard_members.leaderboard_id
      AND private_leaderboards.owner_id = auth.uid()
    )
    OR
    -- Existing members can add new members (using function to avoid recursion)
    is_leaderboard_member(leaderboard_members.leaderboard_id, auth.uid())
  );

-- Also fix private_leaderboards SELECT policy to use the function
-- This prevents recursion when checking membership
DROP POLICY IF EXISTS "Users can view leaderboards they're members of" ON private_leaderboards;

CREATE POLICY "Users can view leaderboards they're members of"
  ON private_leaderboards
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    -- Use function to check membership to avoid recursion
    is_leaderboard_member(private_leaderboards.id, auth.uid())
  );

-- Also fix private_leaderboards UPDATE policy to use the function
-- This prevents recursion when checking membership for ownership transfer
DROP POLICY IF EXISTS "Only owner can update leaderboard" ON private_leaderboards;

CREATE POLICY "Only owner can update leaderboard"
  ON private_leaderboards
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (
    -- Allow updates where owner_id stays the same (normal updates)
    auth.uid() = owner_id
    OR
    -- Allow ownership transfer: new owner_id must be a member of this leaderboard
    -- Use function to avoid recursion
    is_leaderboard_member(private_leaderboards.id, private_leaderboards.owner_id)
  );

