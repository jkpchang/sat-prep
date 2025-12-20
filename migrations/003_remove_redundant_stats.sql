-- Remove redundant values from stats JSONB column
-- The normalized columns (total_xp, day_streak, etc.) are now the source of truth
-- Stats JSONB will only contain non-normalized data (achievements, answeredQuestionIds, dates, etc.)

-- Step 1: Remove redundant fields from existing stats JSONB
UPDATE profiles
SET stats = stats - 'totalXP' - 'dayStreak' - 'questionsAnswered' - 'correctAnswers' - 'answerStreak'
WHERE stats IS NOT NULL;

-- Step 2: Drop the old trigger that synced FROM stats TO columns
DROP TRIGGER IF EXISTS sync_stats_columns_trigger ON profiles;

-- Step 3: Create new function to sync FROM columns TO stats JSONB
-- This ensures stats JSONB is always in sync with normalized columns
CREATE OR REPLACE FUNCTION sync_stats_from_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Reconstruct stats JSONB from normalized columns + existing non-normalized data
  -- Preserve existing non-normalized fields (achievements, answeredQuestionIds, dates, etc.)
  NEW.stats := COALESCE(NEW.stats, '{}'::jsonb) || jsonb_build_object(
    'totalXP', NEW.total_xp,
    'dayStreak', NEW.day_streak,
    'questionsAnswered', NEW.questions_answered,
    'correctAnswers', NEW.correct_answers,
    'answerStreak', NEW.answer_streak
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to sync stats JSONB when normalized columns are updated
CREATE TRIGGER sync_stats_from_columns_trigger
  BEFORE INSERT OR UPDATE OF total_xp, day_streak, questions_answered, correct_answers, answer_streak ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_stats_from_columns();

-- Step 5: Update the public_profile_data view to reconstruct stats from columns
-- This ensures backward compatibility for code that reads from stats
DROP VIEW IF EXISTS public_profile_data;
CREATE OR REPLACE VIEW public_profile_data AS
SELECT 
  user_id,
  username,
  -- Reconstruct stats JSONB from columns + existing non-normalized data
  (COALESCE(stats, '{}'::jsonb) || jsonb_build_object(
    'totalXP', total_xp,
    'dayStreak', day_streak,
    'questionsAnswered', questions_answered,
    'correctAnswers', correct_answers,
    'answerStreak', answer_streak
  )) as stats,
  total_xp,
  day_streak,
  questions_answered,
  correct_answers,
  answer_streak
FROM profiles
WHERE username IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON public_profile_data TO authenticated;

