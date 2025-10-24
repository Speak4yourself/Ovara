# ⚡ OVARA EXTENSION - QUICK START GUIDE

## 🚀 **GET STARTED IN 5 MINUTES**

### **Step 1: Configure Supabase (2 minutes)**

Open these files and replace the placeholder URLs:

#### **In `popup.js` (line 4-5):**
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // Your actual URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your actual key
```

#### **In `background.js` (line 15-16):**
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // Same as popup.js
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Same as popup.js
```

**Where to find these:**
1. Go to your Supabase project
2. Settings → API
3. Copy "Project URL" and "anon public" key

---

### **Step 2: Create Database Table (1 minute)**

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.saved_essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.saved_essays ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own essays
CREATE POLICY "Users can read own essays"
  ON public.saved_essays
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own essays
CREATE POLICY "Users can insert own essays"
  ON public.saved_essays
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### **Step 3: Load Extension (1 minute)**

1. Open Chrome/Edge browser
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **"Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Navigate to the `browser-extension` folder
6. Click **"Select Folder"**

Extension icon should appear in your toolbar!

---

### **Step 4: Test It! (1 minute)**

1. Click the extension icon
2. Login with your Supabase account
3. Click "Grammar Check" - should turn green
4. Click "AI Writing Coach" - sidebar should appear
5. Click "Auto-Typer" - enter test text
6. Click "Saved Essays" - should load (even if empty)

**All features work with mock data - no API needed yet!**

---

## 🎯 **FEATURE QUICK REFERENCE**

### **Auto-Typer:**
- Enter text → Adjust speed → Start → Click any field
- **Works in Google Docs!** 🎉

### **Grammar Check:**
- Toggle on → Type anywhere → Red underlines appear
- Click underline → See suggestion → Accept/Ignore

### **AI Writing Coach:**
- Toggle on → Sidebar appears → Type anywhere
- Live stats + suggestions + quick actions

### **Saved Essays:**
- Shows all essays from web app
- Click essay → Loads into auto-typer

---

## 🐛 **TROUBLESHOOTING**

### **Extension won't load?**
- Make sure you selected the `browser-extension` folder (not parent folder)
- Check for syntax errors in console

### **Login fails?**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check if user exists in Supabase Auth

### **Grammar/Coach not working?**
- They work with mock data by default!
- Check browser console for errors
- Make sure you clicked the toggle buttons

### **Saved Essays empty?**
- Normal if you haven't saved essays yet
- Add test data to `saved_essays` table
- Make sure RLS policies are set up

---

## 📚 **NEXT: ADD REAL AI**

Currently using mock data. To add real AI:

1. Create Supabase Edge Functions:
   - `check-grammar`
   - `coach-suggestions`
   - `coach-action`

2. Use Claude/GPT API in these functions

3. Extension will automatically use real AI!

See `INTEGRATION_COMPLETE.md` for full details.

---

## ✅ **YOU'RE READY!**

Your extension is now:
- ✅ Loaded in browser
- ✅ Connected to database
- ✅ Working with mock AI
- ✅ Ready to use on any website!

**Open Google Docs and try it out!** 🚀
