-- Create secure function for username to email lookup
-- This function is used for login when user provides username instead of email
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_to_lookup TEXT)
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.email::TEXT
  FROM public.profiles p
  WHERE p.username = username_to_lookup
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon;

