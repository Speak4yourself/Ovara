# Humanizer Feature Setup Guide

## Overview

The Humanizer feature transforms AI-generated text into natural, human-like writing. It includes:

- **Saved Essays Management**: Organize essays by status (generated/humanized/AI detected)
- **AI Humanization**: Use Claude AI or ChatGPT to humanize text
- **Tier-Based Queue System**: Fair queue management with tier-based priority
- **Writing Style Analysis**: Pro/Premium users can train the AI with their own writing samples
- **Premium Double-Check**: Automatic AI detection before delivery for Premium users
- **PDF Upload**: Upload PDF documents to extract and humanize text

## Features by Tier

### Free Tier
- ✅ 3 humanizations per week
- ✅ Queue of 3 users max
- ✅ 1 saved essay
- ❌ No writing style samples
- ❌ No queue skip
- ❌ No double-check

### Basic Tier ($5/mo)
- ✅ 20 humanizations per week
- ✅ Queue of 10 users max
- ✅ 10 saved essays
- ❌ No writing style samples
- ❌ No queue skip
- ❌ No double-check

### Pro Tier ($15/mo)
- ✅ 100 humanizations per week
- ✅ Queue of 50 users max
- ✅ 50 saved essays
- ✅ 5 writing style samples
- ❌ No queue skip
- ❌ No double-check

### Premium Tier ($29/mo)
- ✅ Unlimited humanizations
- ✅ Skip queue (instant processing)
- ✅ Unlimited saved essays
- ✅ 5 writing style samples
- ✅ Premium double-check with AI detection
- ✅ Highest quality AI model

## Database Setup

### 1. Run the SQL Script

Navigate to your Supabase Dashboard → SQL Editor and run:

```bash
sql/CREATE_HUMANIZER_TABLES.sql
```

This creates:
- `saved_essays` - Stores user essays
- `humanization_queue` - Manages humanization requests
- `writing_style_samples` - Stores user writing samples
- `humanization_usage` - Tracks weekly usage
- Helper functions for usage tracking

### 2. Verify Tables

Check that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'saved_essays',
  'humanization_queue',
  'writing_style_samples',
  'humanization_usage'
);
```

## Supabase Edge Function Setup

### 1. Deploy the Humanization Processor

```bash
# Navigate to your project root
cd C:\Users\hopla\OneDrive\Documents\GitHub\Ovara

# Deploy the edge function
supabase functions deploy process-humanization
```

### 2. Set Environment Variables

In your Supabase Dashboard → Edge Functions → process-humanization → Secrets:

```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Get API Keys

**Anthropic (Claude AI):**
1. Go to https://console.anthropic.com/
2. Create an account or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and save it to Supabase secrets

**OpenAI (ChatGPT):**
1. Go to https://platform.openai.com/
2. Create an account or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and save it to Supabase secrets

### 4. Test the Function

```bash
# Test with curl
curl -X POST https://your-project.supabase.co/functions/v1/process-humanization \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Queue Processing Setup

The humanization queue needs to be processed regularly. You have two options:

### Option 1: Supabase Cron Job (Recommended)

Create a database cron job to call the edge function every minute:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to process queue every minute
SELECT cron.schedule(
  'process-humanization-queue',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/process-humanization',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (free for public repos)

Configure it to POST to your edge function every minute.

## Component Integration

The Humanizer component is already integrated into App.jsx:

```javascript
// In src/App.jsx
import Humanizer from './components/Humanizer'

// Add page state
const [page, setPage] = useState('home')

// Render when page === 'humanizer'
{page === 'humanizer' && (
  <Humanizer
    user={user}
    userSubscription={userSubscription}
    showToast={showToast}
    onBack={() => setPage('control')}
  />
)}
```

## Testing the Feature

### 1. Create a Test Essay

```javascript
// In your browser console or via Supabase Dashboard
const { data, error } = await supabase
  .from('saved_essays')
  .insert({
    user_id: 'your-user-id',
    name: 'Test Essay',
    content: 'This is a test essay with AI-generated content that needs humanization.',
    status: 'generated'
  })
```

### 2. Test Humanization

1. Log in to your app
2. Navigate to Control Panel
3. Click "Humanizer"
4. Select "New Essay" or "Saved Essays"
5. Paste some text
6. Click "Humanize Text"
7. Wait for queue to process

### 3. Monitor Queue

```sql
-- Check queue status
SELECT * FROM humanization_queue
ORDER BY created_at DESC
LIMIT 10;

-- Check usage
SELECT * FROM humanization_usage;
```

## Troubleshooting

### Queue Not Processing

1. Check edge function logs in Supabase Dashboard
2. Verify environment variables are set
3. Ensure cron job is running
4. Check API key validity

### API Errors

```sql
-- Check for failed requests
SELECT * FROM humanization_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### RLS Issues

If users can't access their data:

```sql
-- Verify RLS policies
SELECT * FROM pg_policies
WHERE tablename IN ('saved_essays', 'humanization_queue', 'writing_style_samples');
```

## PDF Upload (Future Enhancement)

The PDF upload feature is currently a placeholder. To implement:

1. Install a PDF parsing library
2. Create an edge function to extract text
3. Update the upload handler in Humanizer.jsx

Recommended libraries:
- **pdf-parse** (Node.js)
- **pdfjs-dist** (Browser/Deno)

## AI Detection API Integration

The current AI detection is a mock. To integrate a real service:

1. Choose a service:
   - GPTZero API
   - Originality.ai API
   - Copyleaks API

2. Update `detectAI()` function in `process-humanization/index.ts`

3. Add API key to Supabase secrets

## Performance Optimization

### Database Indexes

Already created, but verify:

```sql
-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('saved_essays', 'humanization_queue');
```

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```sql
-- Create rate limit table
CREATE TABLE humanization_rate_limits (
  user_id UUID PRIMARY KEY,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

1. **API Keys**: Never expose API keys in frontend code
2. **RLS Policies**: All tables have RLS enabled
3. **Service Role**: Only use service role key in edge functions
4. **Input Validation**: Validate text length and content
5. **Rate Limiting**: Implement per-user rate limits

## Cost Estimation

### API Costs

**Claude AI (Anthropic):**
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens
- Average essay (500 words): ~$0.01-0.02

**ChatGPT (OpenAI):**
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Average essay: ~$0.03-0.05

### Recommendations

- Start with Claude (cheaper, better results)
- Monitor costs in API dashboards
- Set budget alerts
- Consider caching common requests

## Next Steps

1. ✅ Run SQL script in Supabase
2. ✅ Deploy edge function
3. ✅ Set up environment variables
4. ✅ Configure cron job for queue processing
5. ✅ Test with a sample essay
6. 🔲 Integrate real AI detection API
7. 🔲 Implement PDF text extraction
8. 🔲 Add rate limiting
9. 🔲 Monitor costs and usage

## Support

For issues or questions:
- Check Supabase logs
- Review Edge Function logs
- Check the GitHub issues
- Contact the development team

## Feature Roadmap

### Phase 1 (Completed)
- ✅ Basic humanization
- ✅ Saved essays management
- ✅ Queue system
- ✅ Tier-based limits

### Phase 2 (In Progress)
- 🔲 Real AI detection integration
- 🔲 PDF text extraction
- 🔲 Enhanced writing style analysis

### Phase 3 (Planned)
- 🔲 Batch processing
- 🔲 Export to multiple formats
- 🔲 Collaboration features
- 🔲 Advanced analytics

## Changelog

### v1.0 (2025-10-14)
- Initial release
- Full humanizer feature implementation
- Tier-based queue system
- Writing style samples for Pro/Premium
- Premium double-check feature
