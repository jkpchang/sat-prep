-- Fix RLS policy to allow ownership transfer
-- The current policy prevents transferring ownership because WITH CHECK requires auth.uid() = owner_id
-- But when transferring, owner_id changes to a different user

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only owner can update leaderboard" ON private_leaderboards;

-- Create a new policy that allows ownership transfer
-- USING: Current user must be the owner (can only update if you're the owner)
-- WITH CHECK: Either you remain the owner, OR the new owner is a member of the leaderboard
CREATE POLICY "Only owner can update leaderboard"
  ON private_leaderboards
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (
    -- Allow updates where owner_id stays the same (normal updates)
    auth.uid() = owner_id
    OR
    -- Allow ownership transfer: new owner_id must be a member of this leaderboard
    EXISTS (
      SELECT 1 FROM leaderboard_members
      WHERE leaderboard_members.leaderboard_id = private_leaderboards.id
      AND leaderboard_members.user_id = private_leaderboards.owner_id
    )
  );

