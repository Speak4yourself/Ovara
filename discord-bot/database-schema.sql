-- Discord Integration Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create discord_links table (links Discord accounts to Ovara user accounts)
CREATE TABLE IF NOT EXISTS discord_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on discord_links
ALTER TABLE discord_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own Discord link
CREATE POLICY "Users can view their own Discord link" ON discord_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own Discord link
CREATE POLICY "Users can insert their own Discord link" ON discord_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Discord link
CREATE POLICY "Users can update their own Discord link" ON discord_links
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own Discord link
CREATE POLICY "Users can delete their own Discord link" ON discord_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS discord_links_user_id_idx ON discord_links(user_id);
CREATE INDEX IF NOT EXISTS discord_links_discord_id_idx ON discord_links(discord_id);

-- 2. Create discord_link_codes table (temporary codes for linking)
CREATE TABLE IF NOT EXISTS discord_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discord_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on discord_link_codes
ALTER TABLE discord_link_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read unexpired codes (needed for linking)
CREATE POLICY "Anyone can view unexpired unused codes" ON discord_link_codes
  FOR SELECT
  USING (expires_at > NOW() AND used = FALSE);

-- Policy: Service role can manage all codes
CREATE POLICY "Service role can manage codes" ON discord_link_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for code lookups
CREATE INDEX IF NOT EXISTS discord_link_codes_code_idx ON discord_link_codes(code);
CREATE INDEX IF NOT EXISTS discord_link_codes_expires_at_idx ON discord_link_codes(expires_at);

-- 3. Create user_subscriptions table (stores user subscription tiers)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own subscription (for self-service changes)
CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_tier_idx ON user_subscriptions(tier);

-- 4. Function to clean up expired link codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_link_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM discord_link_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_discord_links_updated_at
  BEFORE UPDATE ON discord_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert default subscriptions for existing users (run once)
INSERT INTO user_subscriptions (user_id, tier)
SELECT id, 'basic' FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions WHERE user_subscriptions.user_id = auth.users.id
);

-- 7. Create function to automatically create subscription record for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'basic');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create subscription for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 8. Grant necessary permissions
-- Note: These might need to be adjusted based on your Supabase setup
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON discord_links TO authenticated;
-- GRANT SELECT ON user_subscriptions TO authenticated;

COMMENT ON TABLE discord_links IS 'Links Discord accounts to Ovara user accounts';
COMMENT ON TABLE discord_link_codes IS 'Temporary codes used for linking Discord accounts';
COMMENT ON TABLE user_subscriptions IS 'User subscription tiers and payment information';
