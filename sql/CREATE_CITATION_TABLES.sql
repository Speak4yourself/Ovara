-- =====================================================
-- CITATION GENERATOR DATABASE TABLES
-- =====================================================

-- 1. Citations Table
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style TEXT NOT NULL, -- APA, MLA, Chicago, Harvard, IEEE
    source_type TEXT NOT NULL, -- website, book, journal, video
    formatted_citation TEXT NOT NULL,
    source_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_user_id ON citations(user_id);
CREATE INDEX IF NOT EXISTS idx_citations_style ON citations(style);
CREATE INDEX IF NOT EXISTS idx_citations_created_at ON citations(created_at DESC);

ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own citations"
    ON citations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own citations"
    ON citations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own citations"
    ON citations FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Citation Usage Tracking
CREATE TABLE IF NOT EXISTS citation_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    citations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_citation_usage_user_id ON citation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_citation_usage_month_start ON citation_usage(month_start DESC);

ALTER TABLE citation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own citation usage"
    ON citation_usage FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Helper Functions
CREATE OR REPLACE FUNCTION get_monthly_citation_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_month_start DATE;
BEGIN
    v_month_start := DATE_TRUNC('month', CURRENT_DATE);

    SELECT COALESCE(citations_count, 0)
    INTO v_count
    FROM citation_usage
    WHERE user_id = p_user_id
    AND month_start = v_month_start;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_citation_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_month_start DATE;
BEGIN
    v_month_start := DATE_TRUNC('month', CURRENT_DATE);

    INSERT INTO citation_usage (user_id, month_start, citations_count)
    VALUES (p_user_id, v_month_start, 1)
    ON CONFLICT (user_id, month_start)
    DO UPDATE SET
        citations_count = citation_usage.citations_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_citation_usage_updated_at
    BEFORE UPDATE ON citation_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_detection();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON citations TO authenticated;
GRANT ALL ON citation_usage TO authenticated;
