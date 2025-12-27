-- Cleanup function for old anonymous users
-- This function deletes anonymous users that have no meaningful activity
-- Run this periodically (weekly/monthly) via cron job or Edge Function

CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous users that:
  -- 1. Have no email (anonymous)
  -- 2. Have no profile OR profile has no meaningful activity
  -- 3. Have no leaderboard ownership
  -- 4. Have no leaderboard memberships
  -- 5. Have no recent question reports (allow deletion if reports are > 90 days old)
  -- 6. Haven't signed in for 30+ days
  -- 7. Are at least 7 days old (don't delete very new users)
  WITH users_to_delete AS (
    SELECT au.id
    FROM auth.users au
    WHERE au.email IS NULL
      AND au.created_at < NOW() - INTERVAL '7 days'
      AND (au.last_sign_in_at IS NULL OR au.last_sign_in_at < NOW() - INTERVAL '30 days')
      -- No profile OR profile with no activity
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = au.id
          AND (
            p.total_xp > 0 
            OR p.questions_answered > 0
            OR p.username IS NOT NULL
          )
      )
      -- No leaderboard ownership
      AND NOT EXISTS (
        SELECT 1 FROM public.private_leaderboards pl
        WHERE pl.owner_id = au.id
      )
      -- No leaderboard memberships
      AND NOT EXISTS (
        SELECT 1 FROM public.leaderboard_members lm
        WHERE lm.user_id = au.id
      )
      -- No recent question reports (allow deletion if reports are > 90 days old)
      AND NOT EXISTS (
        SELECT 1 FROM public.question_reports qr
        WHERE qr.user_id = au.id
          AND qr.created_at > NOW() - INTERVAL '90 days'
      )
  )
  DELETE FROM auth.users
  WHERE id IN (SELECT id FROM users_to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role (for cron jobs/Edge Functions)
-- Note: This function uses SECURITY DEFINER, so it runs with creator's privileges
-- Regular users should not call this directly - it should be run by admin/service role

COMMENT ON FUNCTION public.cleanup_old_anonymous_users() IS 
  'Deletes old anonymous users with no meaningful activity. Returns count of deleted users. Should be run periodically (weekly/monthly).';

