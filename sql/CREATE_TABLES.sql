-- Step 1: Create user_subscriptions table
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

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (true)
    WITH CHECK (true);

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

-- Step 2: Create discord_links table
CREATE TABLE IF NOT EXISTS public.discord_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    discord_id TEXT NOT NULL UNIQUE,
    discord_username TEXT NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;

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

-- Step 3: Create discord_link_codes table
CREATE TABLE IF NOT EXISTS public.discord_link_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discord_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.discord_link_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read valid codes" ON public.discord_link_codes;
CREATE POLICY "Anyone can read valid codes"
    ON public.discord_link_codes FOR SELECT
    USING (NOT used AND expires_at > NOW());

DROP POLICY IF EXISTS "Service role can manage codes" ON public.discord_link_codes;
CREATE POLICY "Service role can manage codes"
    ON public.discord_link_codes FOR ALL
    USING (true)
    WITH CHECK (true);
