-- =====================================================
-- OVARA COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Production-ready database schema for Ovara SaaS platform
-- =====================================================

-- =====================================================
-- SECTION 1: CORE USER TABLES (Already Exists - Keep for reference)
-- =====================================================

-- user_subscriptions table (already exists)
-- discord_links table (already exists)
-- discord_link_codes table (already exists)

-- =====================================================
-- SECTION 2: ESSAYS AND CONTENT MANAGEMENT
-- =====================================================

-- Essays table for saved essays
CREATE TABLE IF NOT EXISTS public.essays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    folder_id UUID REFERENCES public.essay_folders(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    ai_score NUMERIC(5, 2),
    humanization_score NUMERIC(5, 2),
    plagiarism_score NUMERIC(5, 2),
    grade_prediction TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay folders for organization
CREATE TABLE IF NOT EXISTS public.essay_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    parent_folder_id UUID REFERENCES public.essay_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name, parent_folder_id)
);

-- Essay versions for history tracking
CREATE TABLE IF NOT EXISTS public.essay_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE(essay_id, version_number)
);

-- Essay sharing for collaboration
CREATE TABLE IF NOT EXISTS public.essay_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    permission TEXT CHECK (permission IN ('view', 'edit', 'comment')) DEFAULT 'view',
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- =====================================================
-- SECTION 3: AI SERVICES TRACKING
-- =====================================================

-- AI detections history
CREATE TABLE IF NOT EXISTS public.ai_detections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
    input_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    ai_score NUMERIC(5, 2) NOT NULL,
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    detection_model TEXT DEFAULT 'gpt-detector-v1',
    detailed_analysis JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Humanizations history
CREATE TABLE IF NOT EXISTS public.humanizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    humanized_text TEXT NOT NULL,
    original_ai_score NUMERIC(5, 2),
    humanized_ai_score NUMERIC(5, 2),
    word_count_original INTEGER NOT NULL,
    word_count_humanized INTEGER NOT NULL,
    humanization_model TEXT DEFAULT 'humanizer-v1',
    tone_settings JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations generated
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
    citation_style TEXT CHECK (citation_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver')),
    source_type TEXT CHECK (source_type IN ('book', 'journal', 'website', 'newspaper', 'video', 'other')),
    citation_text TEXT NOT NULL,
    source_data JSONB NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grammar checks history
CREATE TABLE IF NOT EXISTS public.grammar_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
    input_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    errors_found INTEGER DEFAULT 0,
    suggestions JSONB,
    grammar_score NUMERIC(5, 2),
    readability_score NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plagiarism scans
CREATE TABLE IF NOT EXISTS public.plagiarism_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
    input_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    plagiarism_score NUMERIC(5, 2) NOT NULL,
    sources_found INTEGER DEFAULT 0,
    matched_sources JSONB,
    scan_provider TEXT DEFAULT 'copyscape',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 4: USAGE TRACKING AND LIMITS
-- =====================================================

-- Usage tracking per user
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN (
        'ai_detection', 'humanization', 'essay_generation', 'citation_generation',
        'grammar_check', 'plagiarism_scan', 'tone_mapping', 'essay_analysis'
    )),
    usage_count INTEGER DEFAULT 0,
    words_processed INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_type, period_start)
);

-- API rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(ip_address, '0.0.0.0'::inet), endpoint, window_start)
);

-- =====================================================
-- SECTION 5: DISCOUNT CODES AND PROMOTIONS
-- =====================================================

-- Discount codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL,
    tier_restriction TEXT CHECK (tier_restriction IN ('basic', 'pro', 'premium')),
    max_uses INTEGER,
    uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount code redemptions
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    discount_applied NUMERIC(10, 2),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discount_code_id, user_id)
);

-- =====================================================
-- SECTION 6: SUPPORT AND COMMUNICATION
-- =====================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE DEFAULT 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0'),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('billing', 'technical', 'feature_request', 'bug_report', 'other')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')) DEFAULT 'open',
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB,
    category TEXT CHECK (category IN ('transactional', 'marketing', 'support')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_to TEXT NOT NULL,
    email_from TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES public.email_templates(id),
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')) DEFAULT 'pending',
    provider TEXT DEFAULT 'sendgrid',
    provider_message_id TEXT,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 7: AUDIT AND SECURITY
-- =====================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for enhanced security
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 1,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 8: ANALYTICS AND METRICS
-- =====================================================

-- User activity analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    page_url TEXT,
    referrer_url TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_user_analytics_user_id (user_id),
    INDEX idx_user_analytics_event_type (event_type),
    INDEX idx_user_analytics_created_at (created_at)
);

-- Feature usage analytics
CREATE TABLE IF NOT EXISTS public.feature_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    usage_count INTEGER DEFAULT 1,
    total_processing_time_ms INTEGER,
    errors_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feature_name, user_id, usage_date)
);

-- =====================================================
-- SECTION 9: STRIPE INTEGRATION
-- =====================================================

-- Stripe webhook events
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
    description TEXT,
    metadata JSONB,
    refund_amount_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 10: ADMIN AND CONFIGURATION
-- =====================================================

-- Admin users with special permissions
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'support', 'moderator')) DEFAULT 'support',
    permissions JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 11: INDEXES FOR PERFORMANCE
-- =====================================================

-- Essays indexes
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON public.essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON public.essays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essays_folder_id ON public.essays(folder_id);
CREATE INDEX IF NOT EXISTS idx_essays_is_archived ON public.essays(is_archived);

-- AI detections indexes
CREATE INDEX IF NOT EXISTS idx_ai_detections_user_id ON public.ai_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_detections_created_at ON public.ai_detections(created_at DESC);

-- Humanizations indexes
CREATE INDEX IF NOT EXISTS idx_humanizations_user_id ON public.humanizations(user_id);
CREATE INDEX IF NOT EXISTS idx_humanizations_created_at ON public.humanizations(created_at DESC);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =====================================================
-- SECTION 12: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.humanizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Essays policies
CREATE POLICY "Users can manage own essays" ON public.essays
    FOR ALL USING (auth.uid() = user_id);

-- Essay folders policies
CREATE POLICY "Users can manage own folders" ON public.essay_folders
    FOR ALL USING (auth.uid() = user_id);

-- AI detections policies
CREATE POLICY "Users can view own detections" ON public.ai_detections
    FOR SELECT USING (auth.uid() = user_id);

-- Humanizations policies
CREATE POLICY "Users can view own humanizations" ON public.humanizations
    FOR SELECT USING (auth.uid() = user_id);

-- Citations policies
CREATE POLICY "Users can manage own citations" ON public.citations
    FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can manage own tickets" ON public.support_tickets
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SECTION 13: TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_essays_updated_at BEFORE UPDATE ON public.essays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_essay_folders_updated_at BEFORE UPDATE ON public.essay_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate word count
CREATE OR REPLACE FUNCTION calculate_word_count(text_content TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN array_length(string_to_array(trim(text_content), ' '), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_feature_type TEXT,
    p_tier TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get current month's usage
    SELECT COALESCE(SUM(usage_count), 0) INTO v_current_usage
    FROM public.usage_tracking
    WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);

    -- Set limits based on tier
    v_limit := CASE
        WHEN p_tier = 'premium' THEN 999999  -- Unlimited
        WHEN p_tier = 'pro' AND p_feature_type = 'ai_detection' THEN 100
        WHEN p_tier = 'pro' AND p_feature_type = 'humanization' THEN 50
        WHEN p_tier = 'basic' AND p_feature_type = 'ai_detection' THEN 20
        WHEN p_tier = 'basic' AND p_feature_type = 'humanization' THEN 10
        ELSE 5  -- Free tier default
    END;

    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_feature_type TEXT,
    p_words_processed INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.usage_tracking (
        user_id, feature_type, usage_count, words_processed,
        period_start, period_end
    ) VALUES (
        p_user_id, p_feature_type, 1, p_words_processed,
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
    )
    ON CONFLICT (user_id, feature_type, period_start)
    DO UPDATE SET
        usage_count = usage_tracking.usage_count + 1,
        words_processed = usage_tracking.words_processed + p_words_processed,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 14: INITIAL DATA SEED
-- =====================================================

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, category) VALUES
('welcome', 'Welcome to Ovara!', '<h1>Welcome!</h1><p>Thanks for joining Ovara.</p>', 'Welcome! Thanks for joining Ovara.', 'transactional'),
('password_reset', 'Reset your password', '<h1>Reset Password</h1><p>Click here to reset: {{reset_link}}</p>', 'Reset your password: {{reset_link}}', 'transactional'),
('subscription_created', 'Subscription Confirmed', '<h1>You''re all set!</h1><p>Your {{tier}} subscription is active.</p>', 'Your {{tier}} subscription is active.', 'transactional')
ON CONFLICT (name) DO NOTHING;

-- Insert default system configuration
INSERT INTO public.system_config (key, value, description, category) VALUES
('maintenance_mode', '"false"', 'Enable/disable maintenance mode', 'system'),
('max_file_upload_mb', '10', 'Maximum file upload size in MB', 'limits'),
('ai_api_provider', '"openai"', 'Primary AI API provider', 'integrations'),
('stripe_webhook_secret', '""', 'Stripe webhook endpoint secret', 'payment')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SECTION 15: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- END OF SCHEMA
-- =====================================================