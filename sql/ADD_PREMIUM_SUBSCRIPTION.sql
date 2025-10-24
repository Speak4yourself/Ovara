-- ADD PREMIUM SUBSCRIPTION MANUALLY
-- Use this if Stripe webhook hasn't synced your subscription yet

-- Step 1: Find your user ID
-- Run this first and copy your user ID:
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Step 2: Insert or update your premium subscription
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Step 1
-- Change 'monthly' to 'yearly' if you purchased yearly

INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    billing_period,
    current_period_end
)
VALUES (
    'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with your user ID
    'premium',
    'active',
    'monthly',  -- Change to 'yearly' if you bought yearly
    NOW() + INTERVAL '30 days'  -- Expires in 30 days (adjust as needed)
)
ON CONFLICT (user_id) DO UPDATE SET
    tier = 'premium',
    status = 'active',
    billing_period = EXCLUDED.billing_period,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = NOW();

-- Verify it worked:
SELECT
    u.email,
    s.tier,
    s.status,
    s.billing_period,
    s.current_period_end
FROM auth.users u
JOIN public.user_subscriptions s ON s.user_id = u.id
WHERE u.id = 'YOUR_USER_ID_HERE';  -- ⚠️ REPLACE THIS with your user ID
