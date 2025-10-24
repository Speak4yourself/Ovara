# Humanizer Quick Start Guide

Get your Humanizer feature up and running in 10 minutes!

## Prerequisites

- ✅ Supabase project created
- ✅ Claude AI or OpenAI API key
- ✅ Supabase CLI installed

## Step 1: Database Setup (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/CREATE_HUMANIZER_TABLES.sql`
3. Paste and click "Run"
4. Wait for success message

**Verify:**
```sql
SELECT COUNT(*) FROM saved_essays;
-- Should return 0 (empty table)
```

## Step 2: Get API Keys (3 minutes)

### Claude AI (Recommended)
1. Visit https://console.anthropic.com/
2. Sign up/Login
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

### OpenAI (Alternative)
1. Visit https://platform.openai.com/
2. Sign up/Login
3. Go to "API Keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

## Step 3: Deploy Edge Function (3 minutes)

```bash
# Open terminal in project root
cd C:\Users\hopla\OneDrive\Documents\GitHub\Ovara

# Deploy function
supabase functions deploy process-humanization

# Set secrets in Supabase Dashboard → Functions → Secrets
# Add: ANTHROPIC_API_KEY
# Add: OPENAI_API_KEY (optional)
```

Or set via CLI:
```bash
supabase secrets set ANTHROPIC_API_KEY=your_key_here
supabase secrets set OPENAI_API_KEY=your_key_here
```

## Step 4: Setup Queue Processing (2 minutes)

### Option A: Database Cron (Recommended)

In Supabase SQL Editor:

```sql
-- Enable cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Replace YOUR_PROJECT and YOUR_KEY
SELECT cron.schedule(
  'process-humanization-queue',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-humanization',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

### Option B: External Cron

1. Go to https://cron-job.org/
2. Create free account
3. Add new cron job:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/process-humanization`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - Schedule: Every 1 minute

## Step 5: Test It! (1 minute)

1. Run your app: `npm run dev`
2. Log in with a test account
3. Go to Control Panel → Humanizer
4. Paste some AI text:
   ```
   Artificial intelligence has revolutionized numerous industries.
   It is important to note that machine learning algorithms have
   significantly improved efficiency. Furthermore, the implementation
   of AI systems demonstrates considerable potential.
   ```
5. Click "Humanize Text"
6. Wait ~30 seconds
7. See the humanized result!

## Troubleshooting

### "Failed to start humanization"
- ✅ Check Supabase SQL tables exist
- ✅ Verify RLS policies are enabled
- ✅ Check user is logged in

### Queue stuck at "Humanizing..."
- ✅ Check edge function is deployed: `supabase functions list`
- ✅ Verify cron job is running
- ✅ Check edge function logs in Supabase Dashboard
- ✅ Verify API keys are set correctly

### "Humanized text will appear here"
Check the queue status:
```sql
SELECT * FROM humanization_queue
ORDER BY created_at DESC
LIMIT 5;
```

Status meanings:
- `queued` - Waiting to process
- `processing` - Currently being humanized
- `completed` - Done! Check for results
- `failed` - Check error_message column

### Check Logs

In Supabase Dashboard:
1. Go to Edge Functions
2. Click on `process-humanization`
3. View logs for errors

## Common Issues

### API Key Invalid
```
Error: Claude API error: authentication_error
```
**Fix:** Verify API key is correct and has credits

### Function Not Found
```
Error: Function not found
```
**Fix:** Redeploy function: `supabase functions deploy process-humanization`

### RLS Error
```
Error: new row violates row-level security policy
```
**Fix:** Re-run the SQL script to create RLS policies

## Tier Limits Reference

| Feature | Free | Basic | Pro | Premium |
|---------|------|-------|-----|---------|
| Humanizations/week | 3 | 20 | 100 | ∞ |
| Queue size | 3 | 10 | 50 | 1 (skip) |
| Saved essays | 1 | 10 | 50 | ∞ |
| Style samples | ❌ | ❌ | 5 | 5 |
| Double-check | ❌ | ❌ | ❌ | ✅ |

## File Structure

```
ovara/
├── src/
│   └── components/
│       └── Humanizer.jsx          # Main component
├── supabase/
│   └── functions/
│       └── process-humanization/
│           └── index.ts            # Queue processor
├── sql/
│   └── CREATE_HUMANIZER_TABLES.sql # Database setup
└── docs/
    ├── HUMANIZER_SETUP.md          # Full documentation
    └── HUMANIZER_QUICK_START.md    # This file
```

## Next Steps

After successful setup:

1. **Customize styling** - Edit Humanizer.jsx to match your brand
2. **Add AI detection API** - Integrate GPTZero or Originality.ai
3. **Enable PDF upload** - Add PDF parsing library
4. **Monitor usage** - Check costs in API dashboards
5. **Set up alerts** - Configure budget alerts

## Production Checklist

Before going live:

- [ ] API keys are set as Supabase secrets (not in code)
- [ ] Cron job is running reliably
- [ ] RLS policies are tested
- [ ] Rate limiting is implemented
- [ ] Error handling is robust
- [ ] Costs are monitored
- [ ] Backup strategy is in place

## Need Help?

1. Check full docs: `docs/HUMANIZER_SETUP.md`
2. Review logs in Supabase Dashboard
3. Test SQL queries manually
4. Check GitHub issues

## Success Indicators

✅ Tables created in Supabase
✅ Edge function deployed
✅ API keys set
✅ Cron job scheduled
✅ Test humanization completed
✅ Queue processing automatically

You're all set! 🎉
