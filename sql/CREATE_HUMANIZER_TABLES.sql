-- =====================================================
-- HUMANIZER FEATURE DATABASE TABLES
-- =====================================================
-- This file creates all necessary tables for the Humanizer feature
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. SAVED ESSAYS TABLE
-- =====================================================
-- Stores user essays with their status and AI detection scores
CREATE TABLE IF NOT EXISTS saved_essays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated', -- 'generated', 'humanized', 'ai_detected'
    ai_detection_score INTEGER, -- 0-100 percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_essays_user_id ON saved_essays(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_essays_status ON saved_essays(status);
CREATE INDEX IF NOT EXISTS idx_saved_essays_created_at ON saved_essays(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_essays ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own essays
CREATE POLICY "Users can view their own essays"
    ON saved_essays FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own essays"
    ON saved_essays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essays"
    ON saved_essays FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essays"
    ON saved_essays FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. HUMANIZATION QUEUE TABLE
-- =====================================================
-- Manages the queue for humanization requests
CREATE TABLE IF NOT EXISTS humanization_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    humanized_text TEXT,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'premium'
    skip_queue BOOLEAN DEFAULT FALSE,
    ai_model TEXT DEFAULT 'claude', -- 'claude', 'chatgpt'
    ai_detection_score_before INTEGER, -- Score before humanization
    ai_detection_score_after INTEGER, -- Score after humanization (Premium double-check)
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_humanization_queue_user_id ON humanization_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_humanization_queue_status ON humanization_queue(status);
CREATE INDEX IF NOT EXISTS idx_humanization_queue_created_at ON humanization_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_humanization_queue_skip_queue ON humanization_queue(skip_queue);

-- Enable Row Level Security (RLS)
ALTER TABLE humanization_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own queue entries
CREATE POLICY "Users can view their own queue entries"
    ON humanization_queue FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue entries"
    ON humanization_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries"
    ON humanization_queue FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. WRITING STYLE SAMPLES TABLE
-- =====================================================
-- Stores user writing samples for Pro/Premium users
CREATE TABLE IF NOT EXISTS writing_style_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES saved_essays(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_writing_style_samples_user_id ON writing_style_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_style_samples_created_at ON writing_style_samples(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE writing_style_samples ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own style samples
CREATE POLICY "Users can view their own style samples"
    ON writing_style_samples FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own style samples"
    ON writing_style_samples FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style samples"
    ON writing_style_samples FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. HUMANIZATION USAGE TRACKING TABLE
-- =====================================================
-- Tracks weekly humanization usage per user for tier limits
CREATE TABLE IF NOT EXISTS humanization_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    humanizations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_humanization_usage_user_id ON humanization_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_humanization_usage_week_start ON humanization_usage(week_start DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE humanization_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own usage
CREATE POLICY "Users can view their own usage"
    ON humanization_usage FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get current week's humanization count for a user
CREATE OR REPLACE FUNCTION get_weekly_humanization_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_week_start DATE;
BEGIN
    -- Calculate start of current week (Monday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE);

    -- Get count for current week
    SELECT COALESCE(humanizations_count, 0)
    INTO v_count
    FROM humanization_usage
    WHERE user_id = p_user_id
    AND week_start = v_week_start;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment weekly humanization count
CREATE OR REPLACE FUNCTION increment_humanization_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_week_start DATE;
BEGIN
    -- Calculate start of current week (Monday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE);

    -- Insert or update usage count
    INSERT INTO humanization_usage (user_id, week_start, humanizations_count)
    VALUES (p_user_id, v_week_start, 1)
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET
        humanizations_count = humanization_usage.humanizations_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update essay updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for saved_essays
DROP TRIGGER IF EXISTS update_saved_essays_updated_at ON saved_essays;
CREATE TRIGGER update_saved_essays_updated_at
    BEFORE UPDATE ON saved_essays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for humanization_usage
DROP TRIGGER IF EXISTS update_humanization_usage_updated_at ON humanization_usage;
CREATE TRIGGER update_humanization_usage_updated_at
    BEFORE UPDATE ON humanization_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions for authenticated users

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON saved_essays TO authenticated;
GRANT ALL ON humanization_queue TO authenticated;
GRANT ALL ON writing_style_samples TO authenticated;
GRANT ALL ON humanization_usage TO authenticated;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- All tables, indexes, policies, and functions have been created.
-- You can now use the Humanizer feature in your application.
