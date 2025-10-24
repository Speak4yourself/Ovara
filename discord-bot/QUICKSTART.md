# Discord Bot Quick Start

Get your Discord bot running in 5 minutes!

## Prerequisites

- Discord bot token
- Node.js installed
- Supabase database set up

## Quick Setup

### 1. Install Dependencies
```bash
cd discord-bot
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add:
# - DISCORD_TOKEN (from Discord Developer Portal)
# - DISCORD_CLIENT_SECRET (from Discord Developer Portal)
```

### 3. Set Up Database
```bash
# Go to Supabase SQL Editor
# Run all SQL from database-schema.sql
```

### 4. Start Bot
```bash
npm start
```

That's it! Your bot should now be online.

## Test It

1. In Discord: `/link`
2. Copy the 8-character code
3. Go to website Settings → Discord Integration
4. Enter code and click "Link Account"
5. In Discord: `/sync`
6. Your role should be assigned!

## Need More Help?

See `DISCORD_BOT_SETUP.md` for detailed setup instructions.
