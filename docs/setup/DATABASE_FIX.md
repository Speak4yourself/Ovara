# Database Fix for Account Creation Error

The account creation error is likely due to missing database tables or incorrect constraints. Follow these steps to fix it.

## Fix the Database Schema

Run these SQL commands in your Supabase SQL Editor:

### 1. Ensure user_subscriptions table exists with correct structure

```sql
-- Drop existing table if needed (WARNING: This will delete existing data)
-- DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_subscriptions;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
```

### 2. Check discord_links table

```sql
CREATE TABLE IF NOT EXISTS public.discord_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    discord_id TEXT NOT NULL UNIQUE,
    discord_username TEXT NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own discord link" ON public.discord_links;
CREATE POLICY "Users can view own discord link"
    ON public.discord_links FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own discord link" ON public.discord_links;
CREATE POLICY "Users can insert own discord link"
    ON public.discord_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own discord link" ON public.discord_links;
CREATE POLICY "Users can delete own discord link"
    ON public.discord_links FOR DELETE
    USING (auth.uid() = user_id);
```

### 3. Check discord_link_codes table

```sql
CREATE TABLE IF NOT EXISTS public.discord_link_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discord_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.discord_link_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can read valid codes" ON public.discord_link_codes;
CREATE POLICY "Anyone can read valid codes"
    ON public.discord_link_codes FOR SELECT
    USING (NOT used AND expires_at > NOW());

DROP POLICY IF EXISTS "Service role can manage codes" ON public.discord_link_codes;
CREATE POLICY "Service role can manage codes"
    ON public.discord_link_codes FOR ALL
    USING (true)
    WITH CHECK (true);
```

### 4. Fix Auth Settings (Important!)

The account creation error might also be due to email confirmation settings:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Check the following settings:
   - **Enable email provider**: ON
   - **Confirm email**: You can toggle this based on your preference
     - If ON: Users must verify their email before logging in
     - If OFF: Users can log in immediately after signup
4. Check **Authentication** → **URL Configuration**:
   - Make sure **Site URL** is set to `http://localhost:5173` for development
5. Check **Authentication** → **Email Templates**:
   - Ensure "Confirm signup" template is properly configured

### 5. Check if RLS is blocking inserts

If users still can't sign up, temporarily disable RLS to test:

```sql
-- TEMPORARILY disable RLS to test (ONLY FOR TESTING!)
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
```

## Common Issues and Solutions

### Issue: "Failed to create user to the database"

**Solution 1:** Email confirmation is enabled but email isn't being sent
- Check Supabase → Authentication → Email Templates
- Check your email spam folder
- Temporarily disable email confirmation for testing

**Solution 2:** RLS policy is blocking the auth system
- The auth.users table is managed by Supabase and shouldn't have custom RLS
- Make sure you didn't add custom policies to auth.users

**Solution 3:** Network/API issues
- Check browser console for errors
- Check Supabase project status
- Verify API keys are correct in .env

### Issue: User can sign up but subscription data isn't created

This is expected! The user_subscriptions table is only populated after a successful Stripe payment. New users won't have a subscription until they purchase one.

## Test the Fix

1. Try creating a new account with a different email
2. Check the browser console for errors
3. Check Supabase → Authentication → Users to see if the user was created
4. If email confirmation is enabled, check the email

## Additional Debugging

If the issue persists, check the browser console (F12) and look for:
- Network errors (failed API calls)
- Supabase errors (auth errors, database errors)
- CORS errors

You can also check Supabase logs:
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Look for failed signup attempts
