-- Script to make a user an admin
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- First, get your user ID (you can also find this in the auth.users table)
-- SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- Method 1: Insert directly with your email
INSERT INTO public.admin_users (user_id, role, permissions, created_at)
SELECT
  id,
  'super_admin',
  '["all"]'::jsonb,
  NOW()
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE' -- REPLACE THIS WITH YOUR EMAIL
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin',
    permissions = '["all"]'::jsonb;

-- Method 2: If you know your user ID, use this instead
-- INSERT INTO public.admin_users (user_id, role, permissions, created_at)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'super_admin',
--   '["all"]'::jsonb,
--   NOW()
-- )
-- ON CONFLICT (user_id) DO UPDATE
-- SET role = 'super_admin',
--     permissions = '["all"]'::jsonb;

-- Verify it worked
SELECT
  au.id,
  au.role,
  au.permissions,
  u.email
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE'; -- REPLACE THIS WITH YOUR EMAIL
