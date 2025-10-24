# Automatic Role Sync - Webhook Setup

This guide will help you set up automatic Discord role synchronization when users upgrade or downgrade their subscription on your website.

## How It Works

```
User upgrades/downgrades on website
           ↓
Supabase detects subscription change
           ↓
Supabase triggers webhook
           ↓
Discord bot receives notification
           ↓
Bot automatically updates Discord roles
           ↓
User receives DM about the change
```

## Prerequisites

- Discord bot is running (see QUICKSTART.md)
- Database schema is deployed (database-schema.sql)
- Supabase HTTP extension is enabled

## Step 1: Enable Supabase HTTP Extension

The webhook system uses Supabase's `http` extension to make POST requests to your Discord bot.

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for "http" or "pg_net"
4. Enable the **pg_net** extension

## Step 2: Deploy Webhook Trigger

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `webhook-trigger.sql` from your discord-bot folder
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run** to execute the SQL

This will create:
- `notify_discord_subscription_change()` function
- `on_subscription_tier_changed` trigger on the `user_subscriptions` table

## Step 3: Verify Webhook URL

The webhook trigger is configured to call:
```
http://localhost:3000/webhook/subscription-updated
```

**For Local Development:**
- Use `http://localhost:3000/webhook/subscription-updated` (already configured)
- Make sure your Discord bot is running locally

**For Production:**
- Update the webhook URL in the SQL to your bot's public URL
- Example: `https://bot.yourdomain.com/webhook/subscription-updated`
- You'll need to expose your bot with a reverse proxy (nginx) or hosting service

## Step 4: Test the Webhook

Let's test if the automatic sync works!

### Test Steps:

1. **Ensure bot is running:**
   ```bash
   cd discord-bot
   npm start
   ```
   You should see: "API server running on port 3000"

2. **Link a test Discord account:**
   - In Discord: `/link`
   - On website: Enter the code in Settings → Discord Integration
   - In Discord: `/sync` to get your initial role

3. **Manually update subscription tier in Supabase:**
   - Go to Supabase Dashboard → **Table Editor**
   - Open the `user_subscriptions` table
   - Find your test user
   - Change their `tier` from `basic` to `pro` (or any other tier)
   - Click **Save**

4. **Check for automatic update:**
   - The bot console should show: `📢 Webhook: Subscription changed: basic → pro`
   - Check your Discord roles - they should update automatically
   - You should receive a DM from the bot about the change

### What You Should See:

**In Bot Console:**
```
📢 Webhook: Subscription changed: basic → pro
✅ Updated roles for @YourUsername: pro
💬 Sent DM notification to user
```

**In Discord DM:**
You'll receive an embedded message like:
```
🎉 Subscription Updated!
Your Discord roles have been automatically updated to match your new Pro subscription.

Your new role: Pro
Previous role: Basic

No action needed - everything is synced!
```

## Step 5: Test All Tier Changes

Test all possible tier changes to ensure everything works:

1. **Basic → Pro**: Change tier in database, verify role updates
2. **Pro → Premium**: Change tier, verify role updates
3. **Premium → Pro**: Change tier (downgrade), verify role updates
4. **Pro → Basic**: Change tier (downgrade), verify role updates

## Troubleshooting

### Bot Console Shows No Webhook Activity

**Possible causes:**
1. Supabase HTTP extension not enabled
2. Webhook trigger SQL not deployed
3. Bot not running on port 3000
4. Firewall blocking localhost connections

**Solutions:**
- Check bot is running: `netstat -an | findstr :3000`
- Verify extension: Supabase Dashboard → Extensions → Check pg_net is enabled
- Check trigger exists: Run `SELECT * FROM pg_trigger WHERE tgname = 'on_subscription_tier_changed';`

### Webhook Called But Roles Not Updated

**Possible causes:**
1. User's Discord account not linked
2. Bot doesn't have permission to manage roles
3. Bot role positioned below the subscription roles
4. User left the Discord server

**Solutions:**
- Verify user link: Check `discord_links` table in Supabase
- Verify bot permissions: Server Settings → Roles → Check bot has "Manage Roles"
- Position bot role: Drag bot role ABOVE Basic/Pro/Premium roles
- Check bot logs for detailed error messages

### Webhook Returns 500 Error

**Possible causes:**
1. Invalid Discord ID in database
2. User left the server
3. Bot can't send DMs (user has DMs disabled)

**Solutions:**
- Check bot console for detailed error
- Verify Discord ID format (should be a snowflake ID like "1234567890123456")
- The webhook still returns success even if DM fails

## Production Deployment

### Update Webhook URL for Production:

1. Edit `webhook-trigger.sql` line 31:
   ```sql
   webhook_url := 'https://your-production-domain.com/webhook/subscription-updated';
   ```

2. Re-run the SQL in Supabase SQL Editor to update the trigger

### Expose Bot with Reverse Proxy:

If using nginx:
```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;

    location /webhook/ {
        proxy_pass http://localhost:3000/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Security Considerations:

1. **Add webhook authentication** (optional but recommended):
   - Add a secret token to webhook requests
   - Verify token in bot before processing

2. **Use HTTPS in production**:
   - Encrypt webhook traffic
   - Get SSL certificate with Let's Encrypt

3. **Rate limiting**:
   - Bot already has error handling
   - Consider adding rate limits if webhook is hit frequently

## Manual Sync Still Available

Even with webhooks enabled, users can still manually sync with `/sync` command:
- Useful if webhook fails
- Good for testing
- Provides user control

## Testing Webhook Security

Test that the webhook only processes valid subscription changes:

1. Try updating a different field (not `tier`) in `user_subscriptions`
   - Webhook should NOT fire

2. Try setting tier to the same value
   - Webhook should NOT fire (optimization)

3. Try updating a user with no Discord link
   - Webhook fires but skips processing (expected behavior)

## Webhook Endpoint Details

**Endpoint:** `POST /webhook/subscription-updated`

**Expected Payload:**
```json
{
  "user_id": "uuid-of-user",
  "old_tier": "basic",
  "new_tier": "pro",
  "discord_id": "123456789012345678",
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Roles updated successfully"
}
```

## Monitoring

To monitor webhook activity:

1. **Check bot console** for webhook logs
2. **Check Supabase logs**: Database → Logs → Look for trigger execution
3. **Check Discord audit log**: Server Settings → Audit Log → Filter by bot

## Next Steps

Now that automatic role sync is set up:

1. Test with real users upgrading/downgrading
2. Monitor for any errors or issues
3. Consider adding webhook authentication
4. Set up proper production deployment
5. Document the process for your team

## Need Help?

- Check bot console for detailed error messages
- Review `discord-bot/README.md` for general bot help
- Check `DISCORD_INTEGRATION_COMPLETE.md` for full system overview
