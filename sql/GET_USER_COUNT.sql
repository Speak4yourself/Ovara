-- Create a function to get user count that can be called publicly
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_count() TO authenticated;
