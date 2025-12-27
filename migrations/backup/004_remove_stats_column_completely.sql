-- Remove stats JSONB column completely and move all fields to individual columns
-- This eliminates redundancy and improves query performance

-- Step 1: Add new columns for remaining stats fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_question_date DATE,
ADD COLUMN IF NOT EXISTS questions_answered_today INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_valid_streak_date DATE,
ADD COLUMN IF NOT EXISTS achievements TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS answered_question_ids INTEGER[] NOT NULL DEFAULT '{}';

-- Step 2: Migrate data from stats JSONB to new columns
UPDATE profiles
SET 
  last_question_date = CASE 
    WHEN stats->>'lastQuestionDate' IS NOT NULL AND stats->>'lastQuestionDate' != 'null' 
    THEN (stats->>'lastQuestionDate')::DATE 
    ELSE NULL 
  END,
  questions_answered_today = COALESCE((stats->>'questionsAnsweredToday')::INTEGER, 0),
  last_valid_streak_date = CASE 
    WHEN stats->>'lastValidStreakDate' IS NOT NULL AND stats->>'lastValidStreakDate' != 'null' 
    THEN (stats->>'lastValidStreakDate')::DATE 
    ELSE NULL 
  END,
  achievements = COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(stats->'achievements')),
    '{}'::TEXT[]
  ),
  answered_question_ids = COALESCE(
    ARRAY(
      SELECT (value::TEXT)::INTEGER 
      FROM jsonb_array_elements_text(stats->'answeredQuestionIds')
      WHERE value ~ '^[0-9]+$'  -- Only convert valid integers
    ),
    '{}'::INTEGER[]
  )
WHERE stats IS NOT NULL;

-- Step 3: Drop the view first (it depends on stats column)
DROP VIEW IF EXISTS public_profile_data;

-- Step 4: Drop the trigger that synced stats
DROP TRIGGER IF EXISTS sync_stats_from_columns_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_stats_from_columns();

-- Step 5: Drop the stats column
ALTER TABLE profiles DROP COLUMN IF EXISTS stats;

-- Step 6: Recreate the public_profile_data view to use columns directly
CREATE OR REPLACE VIEW public_profile_data AS
SELECT 
  user_id,
  username,
  total_xp,
  day_streak,
  questions_answered,
  correct_answers,
  answer_streak,
  last_question_date,
  questions_answered_today,
  last_valid_streak_date,
  achievements,
  answered_question_ids
FROM profiles
WHERE username IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON public_profile_data TO authenticated;

