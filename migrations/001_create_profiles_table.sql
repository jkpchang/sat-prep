-- Create profiles table
-- This is the base table for user profiles with all stats columns
-- RLS is enabled to ensure users can only access their own profile

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  email TEXT,
  -- Stats columns (normalized from JSONB)
  total_xp INTEGER NOT NULL DEFAULT 0,
  day_streak INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  answer_streak INTEGER NOT NULL DEFAULT 0,
  last_question_date DATE,
  questions_answered_today INTEGER NOT NULL DEFAULT 0,
  last_valid_streak_date DATE,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  answered_question_ids INTEGER[] NOT NULL DEFAULT '{}'
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_day_streak ON profiles(day_streak DESC) WHERE username IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can create their own profile
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Users can manage (SELECT, UPDATE, DELETE) their own profile
CREATE POLICY "Users can manage own profile"
  ON profiles
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

