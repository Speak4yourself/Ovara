# Ovara Discord Bot

A Discord bot that automatically assigns roles to server members based on their Ovara subscription tier.

## Features

- **Account Linking**: Users can link their Discord account to their Ovara account
- **Automatic Role Assignment**: Roles are automatically assigned based on subscription tier (Basic, Pro, Premium)
- **Slash Commands**: Modern Discord slash commands for easy interaction
- **Secure**: Uses unique one-time codes for linking accounts
- **Auto-Sync**: Roles automatically update when subscription changes

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. A Discord application and bot token
3. Supabase project with the required database schema
4. Access to your Discord server with admin permissions

### Step 1: Get Your Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (ID: 1425988209262723274)
3. Go to "Bot" section
4. Click "Reset Token" to get your bot token
5. **Save this token securely!** You'll need it for the `.env` file

### Step 2: Get Your Discord Client Secret

1. In the same Discord application
2. Go to "OAuth2" → "General"
3. Copy your "Client Secret"
4. **Save this secret securely!**

### Step 3: Install Dependencies

```bash
cd discord-bot
npm install
```

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in the required values:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=1425988209262723274
   DISCORD_CLIENT_SECRET=your_client_secret_here
   DISCORD_PUBLIC_KEY=9b0d06731a7c0c4e333e35e6050ed9a6b7247db4aba700fe71b848d4479d7824
   DISCORD_GUILD_ID=1425954146997108770

   # Discord Role IDs
   ROLE_BASIC=1425954753296466012
   ROLE_PRO=1425954902185607248
   ROLE_PREMIUM=1425954984440234125

   # Supabase Configuration
   VITE_SUPABASE_URL=https://voluiferhsehqrlwsjaq.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OAuth2 Redirect URL
   DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/callback

   # Server Port
   PORT=3000
   ```

### Step 5: Set Up Supabase Database

1. Go to your Supabase SQL Editor
2. Run the SQL commands in `database-schema.sql`
3. This will create:
   - `discord_links` table (stores user-Discord account links)
   - `discord_link_codes` table (temporary linking codes)
   - `user_subscriptions` table (user subscription tiers)
   - Required Row Level Security (RLS) policies
   - Helper functions and triggers

### Step 6: Invite Bot to Your Server

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes:
   - `bot`
   - `applications.commands`
5. Select bot permissions:
   - `Manage Roles`
   - `Send Messages`
   - `Read Message History`
6. Copy the generated URL and open it in your browser
7. Select your server and authorize the bot

**Important:** Make sure the bot's role is positioned ABOVE the roles it needs to manage (Basic, Pro, Premium) in your Discord server settings!

### Step 7: Start the Bot

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

You should see:
```
✅ Discord bot logged in as YourBotName#1234
Started refreshing application (/) commands.
Successfully reloaded application (/) commands.
🚀 API server running on port 3000
```

## Discord Commands

Once the bot is running, users can use these slash commands in your Discord server:

### `/link`
Generates a unique 8-character code for linking Discord account to Ovara account.

**Usage:**
1. User types `/link` in Discord
2. Bot sends an ephemeral message with a code
3. User goes to Ovara website → Settings → Discord Integration
4. User enters the code and clicks "Link Account"

### `/sync`
Manually syncs Discord roles based on current subscription tier.

**Usage:**
- Type `/sync`
- Bot will check your subscription tier and update roles accordingly

### `/status`
Shows current Discord account linking and subscription status.

**Usage:**
- Type `/status`
- Bot shows whether account is linked, email, subscription tier, and link date

### `/unlink`
Unlinks Discord account from Ovara account and removes subscription roles.

**Usage:**
- Type `/unlink`
- Bot removes the link and all subscription roles

## How It Works

### Account Linking Flow

1. **User Runs `/link` in Discord**
   - Bot generates a unique 8-character code
   - Code stored in `discord_link_codes` table
   - Code expires in 10 minutes

2. **User Enters Code on Website**
   - User logs in to Ovara website
   - Goes to Settings → Discord Integration
   - Enters the 8-character code
   - Website validates code and creates link in `discord_links` table

3. **Roles Are Assigned**
   - User runs `/sync` in Discord
   - Bot checks their subscription tier from `user_subscriptions` table
   - Bot assigns appropriate role (Basic/Pro/Premium)
   - Old subscription roles are removed

### Automatic Features

- **New Member Welcome**: When someone joins the Discord server, they receive a DM with instructions to use `/link`
- **Returning Members**: If a linked user rejoins the server, their roles are automatically restored
- **Role Management**: Bot automatically removes old tier roles before assigning new ones

## Database Schema

### discord_links
Links Discord accounts to Ovara user accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| discord_id | TEXT | Discord user ID |
| discord_username | TEXT | Discord username |
| user_email | TEXT | User's email |
| created_at | TIMESTAMP | When link was created |

### discord_link_codes
Temporary codes for linking accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | TEXT | 8-character code |
| discord_id | TEXT | Discord user ID |
| discord_username | TEXT | Discord username |
| expires_at | TIMESTAMP | When code expires |
| used | BOOLEAN | Whether code was used |
| created_at | TIMESTAMP | When code was created |

### user_subscriptions
User subscription tiers and status.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| tier | TEXT | basic/pro/premium |
| status | TEXT | active/cancelled/expired |
| created_at | TIMESTAMP | When subscription created |

## Troubleshooting

### Bot Not Responding to Commands

1. Check bot is online in Discord server members list
2. Verify bot has `applications.commands` scope
3. Check console for errors
4. Try restarting the bot

### Roles Not Being Assigned

1. Verify bot's role is ABOVE the subscription roles in server settings
2. Check bot has "Manage Roles" permission
3. Verify role IDs in `.env` match actual Discord role IDs
4. Check user is properly linked (`/status` command)

### Database Errors

1. Verify all tables exist in Supabase
2. Check RLS policies are enabled
3. Verify Supabase credentials in `.env`
4. Check Supabase logs for errors

### Link Codes Not Working

1. Verify code hasn't expired (10 minute lifetime)
2. Check code hasn't been used already
3. Verify `discord_link_codes` table exists
4. Check for typos in the code

## Security Notes

- Link codes expire after 10 minutes
- Codes are one-time use only
- Each Discord account can only link to one Ovara account
- Each Ovara account can only link to one Discord account
- All database operations use Row Level Security (RLS)
- Bot uses minimal required permissions

## API Endpoints

The bot also runs a simple Express server for health checks:

- `GET /health` - Returns bot status

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

## Production Deployment

1. Set all environment variables on your hosting platform
2. Ensure database is properly set up
3. Make sure bot has required permissions in Discord server
4. Start bot with `npm start`
5. Monitor logs for any errors

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify all configuration values in `.env`
4. Check Supabase logs for database errors
5. Ensure bot has required Discord permissions

## License

This bot is part of the Ovara project.
