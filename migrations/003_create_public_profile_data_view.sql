-- Create public_profile_data view
-- This view exposes only public profile data (no email) for leaderboard queries
-- Filters out users without usernames (anonymous users who haven't set up their profile)

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

