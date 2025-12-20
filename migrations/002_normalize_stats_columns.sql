-- Normalize stats JSONB into columns for efficient database ordering
-- This allows us to use database-level ORDER BY instead of loading all users into memory

-- Add normalized columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS day_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_answered INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS answer_streak INTEGER NOT NULL DEFAULT 0;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_day_streak ON profiles(day_streak DESC) WHERE username IS NOT NULL;

-- Migrate existing data from JSONB stats to columns
UPDATE profiles
SET 
  total_xp = COALESCE((stats->>'totalXP')::INTEGER, 0),
  day_streak = COALESCE((stats->>'dayStreak')::INTEGER, 0),
  questions_answered = COALESCE((stats->>'questionsAnswered')::INTEGER, 0),
  correct_answers = COALESCE((stats->>'correctAnswers')::INTEGER, 0),
  answer_streak = COALESCE((stats->>'answerStreak')::INTEGER, 0)
WHERE stats IS NOT NULL;

-- Create function to sync columns from JSONB stats
CREATE OR REPLACE FUNCTION sync_stats_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Update normalized columns from JSONB stats
  NEW.total_xp := COALESCE((NEW.stats->>'totalXP')::INTEGER, 0);
  NEW.day_streak := COALESCE((NEW.stats->>'dayStreak')::INTEGER, 0);
  NEW.questions_answered := COALESCE((NEW.stats->>'questionsAnswered')::INTEGER, 0);
  NEW.correct_answers := COALESCE((NEW.stats->>'correctAnswers')::INTEGER, 0);
  NEW.answer_streak := COALESCE((NEW.stats->>'answerStreak')::INTEGER, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync columns when stats JSONB is updated
DROP TRIGGER IF EXISTS sync_stats_columns_trigger ON profiles;
CREATE TRIGGER sync_stats_columns_trigger
  BEFORE INSERT OR UPDATE OF stats ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_stats_columns();

-- Update the public_profile_data view to use normalized columns
DROP VIEW IF EXISTS public_profile_data;
CREATE OR REPLACE VIEW public_profile_data AS
SELECT 
  user_id,
  username,
  stats,  -- Keep stats JSONB for full data access
  total_xp,
  day_streak,
  questions_answered,
  correct_answers,
  answer_streak
FROM profiles
WHERE username IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON public_profile_data TO authenticated;

