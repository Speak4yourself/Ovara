-- Usage Tracking System for Tier-Based Rate Limiting
-- Tracks cheap vs premium model usage per user per month

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Period tracking (resets monthly)
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Free Tier Limits (monthly/weekly counters)
    citations_used INTEGER DEFAULT 0,
    citations_limit INTEGER DEFAULT 10, -- Free: 10/month

    ai_detections_used INTEGER DEFAULT 0,
    ai_detections_limit INTEGER DEFAULT 20, -- Free: 5/week = ~20/month

    outlines_used INTEGER DEFAULT 0,
    outlines_limit INTEGER DEFAULT 20, -- Free: 5/week = ~20/month

    essay_analyses_used INTEGER DEFAULT 0,
    essay_analyses_limit INTEGER DEFAULT 12, -- Free: 3/week = ~12/month

    humanizations_used INTEGER DEFAULT 0,
    humanizations_limit INTEGER DEFAULT 12, -- Free: 3/week = ~12/month

    essay_generations_used INTEGER DEFAULT 0,
    essay_generations_limit INTEGER DEFAULT 12, -- Free: 3/week = ~12/month

    -- Premium Model Tracking (for Basic/Pro tiers)
    premium_detections_used INTEGER DEFAULT 0,
    premium_detections_limit INTEGER DEFAULT 0, -- Basic: 10, Pro: 100, Premium: unlimited

    premium_analyses_used INTEGER DEFAULT 0,
    premium_analyses_limit INTEGER DEFAULT 0, -- Basic: 5, Pro: 50, Premium: unlimited

    premium_humanizations_used INTEGER DEFAULT 0,
    premium_humanizations_limit INTEGER DEFAULT 0, -- Basic: 5, Pro: 50, Premium: unlimited

    premium_essays_used INTEGER DEFAULT 0,
    premium_essays_limit INTEGER DEFAULT 0, -- Basic: 3, Pro: 30, Premium: unlimited

    -- Metadata
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one record per user per period
    UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage"
    ON public.usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own usage (for incrementing counters)
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
CREATE POLICY "Users can update own usage"
    ON public.usage_tracking FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own usage
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
CREATE POLICY "Users can insert own usage"
    ON public.usage_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all usage
DROP POLICY IF EXISTS "Service role can manage usage" ON public.usage_tracking;
CREATE POLICY "Service role can manage usage"
    ON public.usage_tracking FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.usage_tracking;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to get or create current usage period
CREATE OR REPLACE FUNCTION public.get_or_create_usage_period(p_user_id UUID, p_tier TEXT)
RETURNS public.usage_tracking AS $$
DECLARE
    v_usage public.usage_tracking;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_premium_detections_limit INTEGER := 0;
    v_premium_analyses_limit INTEGER := 0;
    v_premium_humanizations_limit INTEGER := 0;
    v_premium_essays_limit INTEGER := 0;
BEGIN
    -- Calculate current period (monthly, 1st to end of month)
    v_period_start := date_trunc('month', NOW());
    v_period_end := (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second');

    -- Set premium limits based on tier
    IF p_tier = 'basic' THEN
        v_premium_detections_limit := 10;
        v_premium_analyses_limit := 5;
        v_premium_humanizations_limit := 5;
        v_premium_essays_limit := 3;
    ELSIF p_tier = 'pro' THEN
        v_premium_detections_limit := 100;
        v_premium_analyses_limit := 50;
        v_premium_humanizations_limit := 50;
        v_premium_essays_limit := 30;
    ELSIF p_tier = 'premium' THEN
        -- Unlimited (we'll use 999999 as "unlimited")
        v_premium_detections_limit := 999999;
        v_premium_analyses_limit := 999999;
        v_premium_humanizations_limit := 999999;
        v_premium_essays_limit := 999999;
    END IF;

    -- Try to get existing usage for current period
    SELECT * INTO v_usage
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND period_start = v_period_start
    LIMIT 1;

    -- If not found, create new period
    IF v_usage IS NULL THEN
        INSERT INTO public.usage_tracking (
            user_id,
            period_start,
            period_end,
            tier,
            premium_detections_limit,
            premium_analyses_limit,
            premium_humanizations_limit,
            premium_essays_limit,
            -- Free tier limits (set for all tiers, ignored for paid)
            citations_limit,
            ai_detections_limit,
            outlines_limit,
            essay_analyses_limit,
            humanizations_limit,
            essay_generations_limit
        ) VALUES (
            p_user_id,
            v_period_start,
            v_period_end,
            p_tier,
            v_premium_detections_limit,
            v_premium_analyses_limit,
            v_premium_humanizations_limit,
            v_premium_essays_limit,
            10,  -- citations_limit
            20,  -- ai_detections_limit
            20,  -- outlines_limit
            12,  -- essay_analyses_limit
            12,  -- humanizations_limit
            12   -- essay_generations_limit
        )
        RETURNING * INTO v_usage;
    ELSE
        -- Update tier limits if tier changed
        UPDATE public.usage_tracking
        SET
            tier = p_tier,
            premium_detections_limit = v_premium_detections_limit,
            premium_analyses_limit = v_premium_analyses_limit,
            premium_humanizations_limit = v_premium_humanizations_limit,
            premium_essays_limit = v_premium_essays_limit
        WHERE id = v_usage.id
        RETURNING * INTO v_usage;
    END IF;

    RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION public.can_use_feature(
    p_user_id UUID,
    p_tier TEXT,
    p_feature TEXT,
    p_is_premium BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_usage public.usage_tracking;
    v_can_use BOOLEAN := FALSE;
BEGIN
    -- Get or create current usage period
    v_usage := public.get_or_create_usage_period(p_user_id, p_tier);

    -- Premium tier has unlimited everything
    IF p_tier = 'premium' THEN
        RETURN TRUE;
    END IF;

    -- Basic/Pro tiers have unlimited cheap models
    IF p_tier IN ('basic', 'pro') AND NOT p_is_premium THEN
        RETURN TRUE;
    END IF;

    -- Check premium limits for Basic/Pro
    IF p_is_premium THEN
        IF p_feature = 'ai_detection' THEN
            v_can_use := v_usage.premium_detections_used < v_usage.premium_detections_limit;
        ELSIF p_feature = 'essay_analysis' THEN
            v_can_use := v_usage.premium_analyses_used < v_usage.premium_analyses_limit;
        ELSIF p_feature = 'humanization' THEN
            v_can_use := v_usage.premium_humanizations_used < v_usage.premium_humanizations_limit;
        ELSIF p_feature = 'essay_generation' THEN
            v_can_use := v_usage.premium_essays_used < v_usage.premium_essays_limit;
        END IF;
        RETURN v_can_use;
    END IF;

    -- Check free tier limits
    IF p_tier = 'free' THEN
        IF p_feature = 'citation' THEN
            v_can_use := v_usage.citations_used < v_usage.citations_limit;
        ELSIF p_feature = 'ai_detection' THEN
            v_can_use := v_usage.ai_detections_used < v_usage.ai_detections_limit;
        ELSIF p_feature = 'outline' THEN
            v_can_use := v_usage.outlines_used < v_usage.outlines_limit;
        ELSIF p_feature = 'essay_analysis' THEN
            v_can_use := v_usage.essay_analyses_used < v_usage.essay_analyses_limit;
        ELSIF p_feature = 'humanization' THEN
            v_can_use := v_usage.humanizations_used < v_usage.humanizations_limit;
        ELSIF p_feature = 'essay_generation' THEN
            v_can_use := v_usage.essay_generations_used < v_usage.essay_generations_limit;
        END IF;
    END IF;

    RETURN v_can_use;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id UUID,
    p_tier TEXT,
    p_feature TEXT,
    p_is_premium BOOLEAN DEFAULT FALSE
)
RETURNS public.usage_tracking AS $$
DECLARE
    v_usage public.usage_tracking;
BEGIN
    -- Get or create current usage period
    v_usage := public.get_or_create_usage_period(p_user_id, p_tier);

    -- Increment the appropriate counter
    IF p_is_premium THEN
        IF p_feature = 'ai_detection' THEN
            UPDATE public.usage_tracking SET premium_detections_used = premium_detections_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'essay_analysis' THEN
            UPDATE public.usage_tracking SET premium_analyses_used = premium_analyses_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'humanization' THEN
            UPDATE public.usage_tracking SET premium_humanizations_used = premium_humanizations_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'essay_generation' THEN
            UPDATE public.usage_tracking SET premium_essays_used = premium_essays_used + 1 WHERE id = v_usage.id;
        END IF;
    ELSE
        IF p_feature = 'citation' THEN
            UPDATE public.usage_tracking SET citations_used = citations_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'ai_detection' THEN
            UPDATE public.usage_tracking SET ai_detections_used = ai_detections_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'outline' THEN
            UPDATE public.usage_tracking SET outlines_used = outlines_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'essay_analysis' THEN
            UPDATE public.usage_tracking SET essay_analyses_used = essay_analyses_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'humanization' THEN
            UPDATE public.usage_tracking SET humanizations_used = humanizations_used + 1 WHERE id = v_usage.id;
        ELSIF p_feature = 'essay_generation' THEN
            UPDATE public.usage_tracking SET essay_generations_used = essay_generations_used + 1 WHERE id = v_usage.id;
        END IF;
    END IF;

    -- Return updated usage
    SELECT * INTO v_usage FROM public.usage_tracking WHERE id = v_usage.id;
    RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
