# Ovara Assistant - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Update Credentials (2 minutes)

Open `background.js` and update lines 15-16 with your Supabase credentials:

```javascript
const SUPABASE_URL = 'https://voluiferhsehqrlwsjaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbHVpZmVyaHNlaHFybHdzamFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY4NTIsImV4cCI6MjA3NTk1Mjg1Mn0.NH_4iG_aDQjd70iB-NjOumP1p8pfwDwqbRojmhmV2TQ';
```

(These are already in `popup.js`, just copy them to `background.js`)

### Step 2: Load Extension (1 minute)

1. Open Chrome/Edge
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" ON
4. Click "Load unpacked"
5. Select your `browser-extension` folder
6. Done! ✅

### Step 3: Test It (2 minutes)

1. **Click the Ovara extension icon** in your toolbar
2. **Sign in** with your Ovara account
3. **Click "Ovara Assistant"** card
4. **Press Ctrl+Space** to toggle sidebar on any webpage
5. **Try a quick action**:
   - Select some text on the page
   - Click "Rewrite" button
   - Click "Generate"
   - See the result!

## 🎉 You're Done!

The assistant is now working with **mock responses**. To connect real AI:

### Optional: Connect Real AI API

Create a Supabase Edge Function:

```bash
# In your project directory
cd supabase/functions
supabase functions new ovara-assistant
```

Add this code to `supabase/functions/ovara-assistant/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  const { prompt, tier } = await req.json()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: tier === 'premium' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Ovara Assistant.' },
        { role: 'user', content: prompt }
      ]
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify({
    result: data.choices[0].message.content
  }))
})
```

Deploy it:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase functions deploy ovara-assistant
```

## 📚 What You Built

✅ Full AI co-pilot sidebar
✅ 6 quick actions (Rewrite, Summarize, Humanize, Detect, Grammar, Expand)
✅ Text selection from pages
✅ Context-aware prompting
✅ Permission-based text insertion
✅ Tier-based rate limiting
✅ Keyboard shortcut (Ctrl+Space)
✅ Theme matching your website

## 🎯 Next Actions

1. **Test thoroughly** with different websites
2. **Create extension icons** (128x128, 48x48, 16x16)
3. **Add screenshots** for Chrome Web Store
4. **Gather user feedback** from Discord
5. **Iterate and improve** based on usage

## 💬 Need Help?

- **Read full docs**: `OVARA_ASSISTANT_README.md`
- **Implementation details**: `ASSISTANT_IMPLEMENTATION_SUMMARY.md`
- **Discord**: [discord.gg/ovara](https://discord.gg/ovara)

---

**That's it! You now have a working Ovara Assistant. Happy building! 🚀**
