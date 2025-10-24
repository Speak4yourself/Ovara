-- Webhook Integration for Automatic Role Sync
-- Run this SQL in your Supabase SQL Editor

-- 1. Create function to notify Discord bot when subscription changes
CREATE OR REPLACE FUNCTION notify_discord_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
  discord_user_id TEXT;
  webhook_url TEXT;
BEGIN
  -- Only proceed if tier actually changed
  IF OLD.tier = NEW.tier THEN
    RETURN NEW;
  END IF;

  -- Get the Discord ID for this user (if linked)
  SELECT discord_id INTO discord_user_id
  FROM discord_links
  WHERE user_id = NEW.user_id;

  -- If no Discord link, skip webhook
  IF discord_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Set webhook URL
  -- IMPORTANT: Update this URL based on your deployment:
  -- - Local development: http://localhost:3000/webhook/subscription-updated
  -- - Production: https://your-bot-domain.com/webhook/subscription-updated
  -- - If bot runs on same server: http://localhost:3000/webhook/subscription-updated
  webhook_url := 'http://localhost:3000/webhook/subscription-updated';

  -- Call the webhook using http extension
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'old_tier', OLD.tier,
        'new_tier', NEW.tier,
        'discord_id', discord_user_id,
        'timestamp', NOW()
      )
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the update
    RAISE NOTICE 'Failed to notify Discord bot: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on user_subscriptions table
DROP TRIGGER IF EXISTS on_subscription_tier_changed ON user_subscriptions;

CREATE TRIGGER on_subscription_tier_changed
  AFTER UPDATE OF tier ON user_subscriptions
  FOR EACH ROW
  WHEN (OLD.tier IS DISTINCT FROM NEW.tier)
  EXECUTE FUNCTION notify_discord_subscription_change();

-- 3. Grant necessary permissions
-- Note: The trigger runs as SECURITY DEFINER, so it has elevated privileges

COMMENT ON FUNCTION notify_discord_subscription_change() IS 'Notifies Discord bot when user subscription tier changes';
COMMENT ON TRIGGER on_subscription_tier_changed ON user_subscriptions IS 'Triggers webhook to Discord bot when subscription tier changes';

-- Test the webhook (optional - uncomment to test)
-- UPDATE user_subscriptions SET tier = 'pro' WHERE user_id = 'your-test-user-id';
