# Discord Bot Setup Guide

Complete guide to set up the Ovara Discord bot for automatic role management based on subscription tiers.

## 🎯 What This Does

- Automatically assigns Discord roles (Basic, Pro, Premium) based on user subscription tiers
- Users link their Discord account to their Ovara website account
- Roles stay in sync with subscription changes
- Simple `/link` command for easy setup

## 📋 Prerequisites

- [ ] Discord Bot created in Discord Developer Portal
- [ ] Supabase project set up
- [ ] Node.js 18+ installed
- [ ] Admin access to your Discord server

## 🚀 Step-by-Step Setup

### 1. Get Discord Bot Credentials

#### A. Get Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications/1425988209262723274)
2. Click on "Bot" in the left sidebar
3. Click "Reset Token" button
4. Copy the token (you'll only see it once!)
5. **SAVE THIS TOKEN** - you'll need it for `.env` file

#### B. Get Client Secret

1. In the same application, click "OAuth2" → "General"
2. Copy the "Client Secret"
3. **SAVE THIS SECRET** - you'll need it for `.env` file

### 2. Install Bot in Your Discord Server

1. Go to [Discord Developer Portal OAuth2 URL Generator](https://discord.com/developers/applications/1425988209262723274/oauth2/url-generator)
2. Select these **scopes**:
   - [x] `bot`
   - [x] `applications.commands`

3. Select these **bot permissions**:
   - [x] `Manage Roles`
   - [x] `Send Messages`
   - [x] `Read Message History`
   - [x] `View Channels`

4. Copy the generated URL at the bottom
5. Open URL in browser and select your server: **Ovara (ID: 1425954146997108770)**
6. Authorize the bot

**⚠️ IMPORTANT:** After the bot joins, go to Discord Server Settings → Roles and **drag the bot's role ABOVE** these roles:
- Basic (ID: 1425954753296466012)
- Pro (ID: 1425954902185607248)
- Premium (ID: 1425954984440234125)

The bot can only manage roles that are below it in the hierarchy!

### 3. Set Up Database

1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/sql)
2. Copy all the SQL from `discord-bot/database-schema.sql`
3. Paste and run it in the SQL editor
4. Verify tables were created:
   - `discord_links`
   - `discord_link_codes`
   - `user_subscriptions`

### 4. Configure Bot Environment

1. Open terminal in the `discord-bot` folder:
   ```bash
   cd discord-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your actual values:
   ```env
   # Replace YOUR_BOT_TOKEN_HERE with the token from Step 1A
   DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE

   # Replace YOUR_CLIENT_SECRET_HERE with the secret from Step 1B
   DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

   # These are already correct - don't change them!
   DISCORD_CLIENT_ID=1425988209262723274
   DISCORD_PUBLIC_KEY=9b0d06731a7c0c4e333e35e6050ed9a6b7247db4aba700fe71b848d4479d7824
   DISCORD_GUILD_ID=1425954146997108770
   ROLE_BASIC=1425954753296466012
   ROLE_PRO=1425954902185607248
   ROLE_PREMIUM=1425954984440234125
   VITE_SUPABASE_URL=https://voluiferhsehqrlwsjaq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbHVpZmVyaHNlaHFybHdzamFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY4NTIsImV4cCI6MjA3NTk1Mjg1Mn0.NH_4iG_aDQjd70iB-NjOumP1p8pfwDwqbRojmhmV2TQ
   ```

### 5. Start the Bot

```bash
npm start
```

You should see:
```
✅ Discord bot logged in as YourBotName#1234
Started refreshing application (/) commands.
Successfully reloaded application (/) commands.
🚀 API server running on port 3000
```

If you see these messages, **the bot is working!** 🎉

## 👥 User Flow - How Users Link Their Accounts

### For Users in Discord:

1. **User joins your Discord server**
2. **User types `/link` in any channel**
3. **Bot sends them a private message** with an 8-character code (e.g., `ABC123XY`)
4. **User goes to Ovara website** and logs in
5. **User clicks Settings** (their profile dropdown → Settings)
6. **User scrolls to "Discord Integration" section**
7. **User enters the 8-character code** and clicks "Link Account"
8. **✅ Account linked!**
9. **User types `/sync` in Discord** to get their role assigned

### What Roles Do Users Get?

- **Basic Subscription** → Basic role (green)
- **Pro Subscription** → Pro role (blue)
- **Premium Subscription** → Premium role (purple)

Roles are **automatically updated** when subscription changes!

## 🔧 Available Discord Commands

Once bot is running, users can use:

| Command | What It Does |
|---------|--------------|
| `/link` | Get a code to link Discord account to Ovara account |
| `/sync` | Manually sync roles based on current subscription |
| `/status` | Check if account is linked and show subscription tier |
| `/unlink` | Unlink Discord account and remove roles |

## 🧪 Testing the Bot

### Test Account Linking:

1. In Discord, type `/link`
2. Bot should send you a code in a private message
3. Go to http://localhost:5174 (make sure website is running!)
4. Log in to your Ovara account
5. Go to Settings → Discord Integration
6. Enter the code and click "Link Account"
7. Should see success message!

### Test Role Assignment:

1. After linking, type `/sync` in Discord
2. Bot should assign you the "Basic" role (since new accounts default to Basic)
3. Check your role in the server member list!

### Test Role Changes:

1. In Supabase, update your subscription:
   ```sql
   UPDATE user_subscriptions
   SET tier = 'pro'
   WHERE user_id = 'your-user-id-here';
   ```
2. In Discord, type `/sync`
3. Bot should remove "Basic" role and add "Pro" role!

## ❗ Troubleshooting

### Bot doesn't respond to `/link` command

**Problem:** Slash commands not showing up

**Solutions:**
- Wait 5-10 minutes for Discord to register commands globally
- Kick and re-invite the bot
- Check bot has `applications.commands` scope
- Restart the bot

### "Failed to assign roles" error

**Problem:** Bot can't manage roles

**Solutions:**
- Check bot's role is ABOVE subscription roles in Server Settings → Roles
- Verify bot has "Manage Roles" permission
- Make sure role IDs in `.env` are correct

### "Invalid or expired code" when linking

**Problem:** Code doesn't work on website

**Solutions:**
- Codes expire in 10 minutes - get a new one with `/link`
- Make sure you copied the code exactly (case-sensitive)
- Check database table `discord_link_codes` exists
- Verify you're entering code in the correct field

### Database connection errors

**Problem:** Bot can't connect to Supabase

**Solutions:**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Verify database tables exist (run `database-schema.sql` again)
- Check Supabase project is not paused
- Review Supabase logs for errors

### Bot crashes on startup

**Problem:** Bot exits immediately

**Solutions:**
- Check `DISCORD_TOKEN` is correct in `.env`
- Verify all required environment variables are set
- Look at error message in console
- Try `npm install` again

## 🔒 Security Best Practices

- **Never commit `.env` file** to git (it's in `.gitignore`)
- **Keep bot token secret** - never share it publicly
- **Codes expire in 10 minutes** - this is intentional for security
- **One account per link** - Discord accounts can only link to one Ovara account
- **Row Level Security** - Database policies prevent users from seeing others' data

## 📊 Monitoring

### Check Bot Status

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","bot":"YourBotName#1234"}
```

### Check Database

View linked accounts:
```sql
SELECT * FROM discord_links;
```

View active link codes:
```sql
SELECT * FROM discord_link_codes WHERE used = FALSE AND expires_at > NOW();
```

View subscriptions:
```sql
SELECT * FROM user_subscriptions;
```

## 🚀 Production Deployment

When deploying to production:

1. **Update redirect URIs**:
   - Change `DISCORD_REDIRECT_URI` in `.env`
   - Update to your production domain

2. **Secure environment variables**:
   - Use your hosting platform's secrets management
   - Never expose `.env` file

3. **Monitor logs**:
   - Set up logging service
   - Monitor for errors

4. **Keep bot running**:
   - Use PM2, systemd, or your platform's process manager
   - Set up auto-restart on failure

## 📚 Additional Resources

- [Discord Bot Documentation](https://discord.js.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Discord Developer Portal](https://discord.com/developers/applications)

## ✅ Checklist

Before going live, verify:

- [ ] Bot is online in Discord server
- [ ] Bot's role is positioned correctly (above subscription roles)
- [ ] Database tables are created with correct schema
- [ ] All environment variables are set in `.env`
- [ ] Website Discord integration page works
- [ ] Tested `/link` command and account linking
- [ ] Tested `/sync` command and role assignment
- [ ] Tested role changes when subscription tier changes
- [ ] Codes expire after 10 minutes
- [ ] Unlink functionality works

## 🎉 You're Done!

Your Discord bot is now set up and ready to automatically manage subscription roles!

Users can now:
1. Use `/link` to get a code
2. Enter code on website
3. Use `/sync` to get their role
4. Enjoy subscription tier benefits in Discord!
