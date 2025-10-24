-- =====================================================
-- AI DETECTOR FEATURE DATABASE TABLES
-- =====================================================
-- This file creates tables for tracking AI detection usage
-- Run this in your Supabase SQL Editor
-- Note: saved_essays table is shared with Humanizer feature

-- =====================================================
-- 1. AI DETECTION USAGE TRACKING TABLE
-- =====================================================
-- Tracks weekly AI detection usage per user for tier limits
CREATE TABLE IF NOT EXISTS ai_detection_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    detections_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_detection_usage_user_id ON ai_detection_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_detection_usage_week_start ON ai_detection_usage(week_start DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_detection_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own usage
CREATE POLICY "Users can view their own detection usage"
    ON ai_detection_usage FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. DETECTION HISTORY TABLE (Optional - for analytics)
-- =====================================================
-- Stores history of AI detections for analytics
CREATE TABLE IF NOT EXISTS ai_detection_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text_sample TEXT, -- First 500 chars for reference
    overall_score INTEGER NOT NULL, -- 0-100
    detailed_analysis JSONB, -- Stores detailed analysis if available
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_detection_history_user_id ON ai_detection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_detection_history_created_at ON ai_detection_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_detection_history_score ON ai_detection_history(overall_score);

-- Enable RLS
ALTER TABLE ai_detection_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own detection history"
    ON ai_detection_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detection history"
    ON ai_detection_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to get current week's detection count for a user
CREATE OR REPLACE FUNCTION get_weekly_detection_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_week_start DATE;
BEGIN
    -- Calculate start of current week (Monday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE);

    -- Get count for current week
    SELECT COALESCE(detections_count, 0)
    INTO v_count
    FROM ai_detection_usage
    WHERE user_id = p_user_id
    AND week_start = v_week_start;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment weekly detection count
CREATE OR REPLACE FUNCTION increment_detection_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_week_start DATE;
BEGIN
    -- Calculate start of current week (Monday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE);

    -- Insert or update usage count
    INSERT INTO ai_detection_usage (user_id, week_start, detections_count)
    VALUES (p_user_id, v_week_start, 1)
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET
        detections_count = ai_detection_usage.detections_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_detection()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_detection_usage
DROP TRIGGER IF EXISTS update_ai_detection_usage_updated_at ON ai_detection_usage;
CREATE TRIGGER update_ai_detection_usage_updated_at
    BEFORE UPDATE ON ai_detection_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_detection();

-- =====================================================
-- 4. UPDATE SAVED_ESSAYS TABLE (if needed)
-- =====================================================
-- Ensure saved_essays has the necessary columns
-- These may already exist from Humanizer setup

DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saved_essays' AND column_name = 'status'
    ) THEN
        ALTER TABLE saved_essays ADD COLUMN status TEXT DEFAULT 'generated';
    END IF;

    -- Add ai_detection_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saved_essays' AND column_name = 'ai_detection_score'
    ) THEN
        ALTER TABLE saved_essays ADD COLUMN ai_detection_score INTEGER;
    END IF;
END $$;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions for authenticated users

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ai_detection_usage TO authenticated;
GRANT ALL ON ai_detection_history TO authenticated;

-- =====================================================
-- 6. ANALYTICS VIEWS (Optional)
-- =====================================================
-- Create view for admin analytics

CREATE OR REPLACE VIEW ai_detection_stats AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_detections,
    AVG(overall_score) as avg_score,
    COUNT(CASE WHEN overall_score < 30 THEN 1 END) as human_count,
    COUNT(CASE WHEN overall_score >= 30 AND overall_score < 70 THEN 1 END) as mixed_count,
    COUNT(CASE WHEN overall_score >= 70 THEN 1 END) as ai_count,
    COUNT(DISTINCT user_id) as unique_users
FROM ai_detection_history
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- All tables, indexes, policies, and functions have been created.
-- You can now use the AI Detector feature in your application.

-- Test queries:
-- SELECT * FROM ai_detection_usage WHERE user_id = 'your-user-id';
-- SELECT get_weekly_detection_count('your-user-id');
-- SELECT * FROM ai_detection_stats LIMIT 10;
