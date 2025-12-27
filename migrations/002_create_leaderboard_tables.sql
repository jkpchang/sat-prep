-- Create leaderboard system tables
-- Includes private_leaderboards, leaderboard_members, and user_preferences

-- Create private_leaderboards table
CREATE TABLE IF NOT EXISTS private_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  max_members INTEGER NOT NULL DEFAULT 50,
  CONSTRAINT max_members_check CHECK (max_members > 0 AND max_members <= 50)
);

-- Create leaderboard_members table
CREATE TABLE IF NOT EXISTS leaderboard_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES private_leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  block_leaderboard_invites BOOLEAN NOT NULL DEFAULT FALSE,
  hide_from_global_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_private_leaderboards_owner ON private_leaderboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_leaderboard ON leaderboard_members(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_user ON leaderboard_members(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_private_leaderboards_updated_at
  BEFORE UPDATE ON private_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE private_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_leaderboards
CREATE POLICY "Users can create own leaderboards"
  ON private_leaderboards
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view leaderboards they're members of"
  ON private_leaderboards
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM leaderboard_members
      WHERE leaderboard_members.leaderboard_id = private_leaderboards.id
      AND leaderboard_members.user_id = auth.uid()
    )
  );

-- Policy allows ownership transfer: new owner must be a member
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

CREATE POLICY "Only owner can delete leaderboard"
  ON private_leaderboards
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for leaderboard_members
CREATE POLICY "Members can view all members of their leaderboards"
  ON leaderboard_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leaderboard_members lm2
      WHERE lm2.leaderboard_id = leaderboard_members.leaderboard_id
      AND lm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add new members"
  ON leaderboard_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboard_members lm
      WHERE lm.leaderboard_id = leaderboard_members.leaderboard_id
      AND lm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM private_leaderboards pl
      WHERE pl.id = leaderboard_members.leaderboard_id
      AND pl.owner_id = auth.uid()
    )
  );

CREATE POLICY "Only owner can remove members"
  ON leaderboard_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM private_leaderboards
      WHERE private_leaderboards.id = leaderboard_members.leaderboard_id
      AND private_leaderboards.owner_id = auth.uid()
    )
  );

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to check if someone blocks invites (needed for addMemberToLeaderboard)
CREATE POLICY "Users can view others' block status for invite checks"
  ON user_preferences
  FOR SELECT
  USING (true);

