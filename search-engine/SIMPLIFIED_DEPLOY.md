# 🚀 Simplified Deployment Guide - Ovara Search Engine

**For testing with ~100 searches/month**

Total cost: **$0/month** (using free tiers)

---

## 📋 What You Need

1. ✅ Brave Search API key - Get at: https://api-dashboard.search.brave.com/register
2. ✅ OpenAI API key - Get at: https://platform.openai.com/api-keys
3. ✅ Railway account - Sign up at: https://railway.app
4. ✅ Vercel account - Sign up at: https://vercel.com
5. ✅ GitHub repo with your code

---

## Part 1: Deploy Backend to Railway (10 minutes)

### Step 1: Login to Railway

Open your browser and go to: **https://railway.app**

Click "Login" and sign in with GitHub.

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select your `Ovara` repository
5. Railway will ask which folder - leave it as root for now

### Step 3: Configure Root Directory

1. After the project is created, go to **Settings**
2. Find "Root Directory"
3. Set it to: `search-engine/backend`
4. Click "Update"

### Step 4: Add Environment Variables

1. In your Railway project, go to **Variables** tab
2. Click "Raw Editor"
3. Paste this (replace with your actual keys):

```env
NODE_ENV=production
PORT=3001

# Your API Keys
BRAVE_API_KEY=your-brave-api-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# We'll update this after frontend deploys
FRONTEND_URL=https://localhost:5173
```

4. Click "Update Variables"

### Step 5: Trigger Deploy

1. Go to **Deployments** tab
2. Click "Deploy"
3. Wait 2-3 minutes for build to complete

### Step 6: Get Backend URL

1. Once deployed, go to **Settings**
2. Click "Generate Domain" under "Domains"
3. You'll get a URL like: `https://your-app.up.railway.app`
4. **SAVE THIS URL** - you'll need it for frontend!

### Step 7: Test Backend

Open this URL in your browser:
```
https://your-app.up.railway.app/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T...",
  "uptime": 123
}
```

If you see this - **Backend is live!** ✅

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Login to Vercel

Open your browser and go to: **https://vercel.com**

Click "Login" and sign in with GitHub.

### Step 2: Create New Project

1. Click "Add New..." → "Project"
2. Import your GitHub repository `Ovara`
3. Vercel will detect the project

### Step 3: Configure Project

1. **Framework Preset**: Vite
2. **Root Directory**: Click "Edit" → enter `search-engine/frontend`
3. **Build Command**: `npm run build` (should be auto-detected)
4. **Output Directory**: `dist` (should be auto-detected)

### Step 4: Add Environment Variable

1. Expand **Environment Variables** section
2. Add variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-app.up.railway.app/api`

   ⚠️ Replace `your-app.up.railway.app` with YOUR Railway URL from Part 1, Step 6!

3. Make sure to add `/api` at the end!

### Step 5: Deploy

1. Click "Deploy"
2. Wait 1-2 minutes

### Step 6: Get Frontend URL

Once deployed, Vercel will show you:
```
https://your-app.vercel.app
```

**SAVE THIS URL!**

### Step 7: Update Backend CORS

Now go back to Railway:

1. Open your Railway project
2. Go to **Variables**
3. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Click "Update Variables"
5. Railway will auto-redeploy (wait 1 minute)

### Step 8: Test Frontend

1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see the Ovara Search homepage
3. Try a search: "best pizza recipes"
4. You should see:
   - AI answer at the top
   - Search results below

**If it works - YOU'RE LIVE!** 🎉

---

## Part 3: Test Your Live Search Engine

### Test Searches

Try these queries to make sure everything works:

1. **Simple query**: "cats"
2. **Question**: "How does photosynthesis work?"
3. **Recipe**: "chocolate cake recipe"
4. **Tutorial**: "learn Python programming"
5. **Complex**: "difference between React and Vue"

### What You Should See

✅ Search takes 2-3 seconds (first time)
✅ AI answer appears at top
✅ 10 search results below
✅ Sources labeled (brave)
✅ Second search of same query is instant (cached!)

---

## 💰 Cost Tracking

### Monitor Your Usage

**Brave API**: https://api-dashboard.search.brave.com/

**OpenAI API**: https://platform.openai.com/usage

**Railway**: https://railway.app (check usage tab)

**Vercel**: https://vercel.com (always free for frontend)

### Your Free Limits

- **Brave**: 2,000 searches/month FREE
- **OpenAI**: $5-18 FREE credit
- **Railway**: $5/month FREE credit
- **Vercel**: Unlimited FREE

For 100 searches/month, you'll use:
- Brave: 100 searches (FREE)
- OpenAI: ~$0.20-0.60 (FREE from credits)
- Railway: ~$0/month (within free tier)
- Vercel: $0 (always free)

**Total: $0 for first 3 months!** 🎉

---

## 🐛 Troubleshooting

### Backend Deploy Failed

**Check Railway logs**:
1. Go to Railway project
2. Click **Deployments**
3. Click failed deployment
4. Check **Build Logs** and **Deploy Logs**

**Common issues**:
- Missing environment variables → Add them in Variables tab
- Wrong root directory → Should be `search-engine/backend`
- TypeScript errors → Check backend code

### Frontend Can't Connect to Backend

**Symptoms**: "Network Error" or "Failed to fetch"

**Fixes**:
1. Check `VITE_API_URL` in Vercel → must end with `/api`
2. Check `FRONTEND_URL` in Railway → must match Vercel URL exactly
3. Wait 2 minutes after changing env vars (auto-redeploys)
4. Check browser console (F12) for error messages

### No Search Results

**Symptoms**: Search button works but no results

**Fixes**:
1. Check Brave API key is correct in Railway Variables
2. Check OpenAI API key is correct
3. Open Railway logs - look for API errors
4. Verify API keys have no extra spaces or quotes

### AI Answer Not Showing

**Symptoms**: Results show but no AI answer

**Possible causes**:
- OpenAI API key invalid → Check at https://platform.openai.com/api-keys
- OpenAI credits ran out → Check usage dashboard
- Query too simple → Try complex questions like "How does..."

---

## 🎯 Next Steps

### Test Thoroughly

Run 10-20 different searches to make sure:
- ✅ Search works consistently
- ✅ AI answers are relevant
- ✅ Caching works (repeat searches are instant)
- ✅ Error handling works (try gibberish)

### Monitor for 1 Week

Check your dashboards daily:
- Railway usage
- Brave API usage
- OpenAI usage

Make sure you're staying within free limits!

### Optional: Add Custom Domain

**Vercel Domain Setup**:
1. Go to Vercel project → Settings → Domains
2. Add your domain: `search.ovara.app`
3. Update your DNS (Vercel will show instructions)
4. Update `FRONTEND_URL` in Railway to new domain

---

## 📊 Performance Expectations

### First Search
- **Time**: 2-3 seconds
- **Why**: API calls + AI generation + no cache

### Cached Search
- **Time**: < 100ms
- **Why**: Served from memory cache

### API Costs (100 searches/month)
- **Brave**: $0.05 (within free tier)
- **OpenAI**: $0.20-0.60 (within free credits)
- **Total**: **$0**

---

## ✅ Deployment Checklist

Before you consider deployment complete:

### Backend
- [ ] Deployed to Railway
- [ ] Environment variables set (BRAVE_API_KEY, OPENAI_API_KEY, FRONTEND_URL)
- [ ] Health endpoint working (`/health`)
- [ ] Custom domain generated
- [ ] Logs show no errors

### Frontend
- [ ] Deployed to Vercel
- [ ] VITE_API_URL set correctly
- [ ] Can access homepage
- [ ] Search works
- [ ] AI answers work
- [ ] No console errors

### Testing
- [ ] Tested 5+ different queries
- [ ] All return results
- [ ] AI answers relevant
- [ ] Cache working (repeat searches instant)
- [ ] Mobile responsive

### Monitoring
- [ ] Railway dashboard accessible
- [ ] Brave API dashboard accessible
- [ ] OpenAI usage dashboard accessible
- [ ] Set up usage alerts (optional)

---

## 🆘 Need Help?

### Check Logs First

**Railway Backend Logs**:
```
Railway Dashboard → Your Project → Deployments → Latest → Logs
```

**Vercel Frontend Logs**:
```
Vercel Dashboard → Your Project → Deployments → Latest → Logs
```

**Browser Console**:
```
Open search page → Press F12 → Console tab
```

### Common Error Messages

**"CORS policy blocked"**
→ Fix: Update `FRONTEND_URL` in Railway to match Vercel URL

**"API key not found"**
→ Fix: Check Railway Variables - ensure keys are set correctly

**"Network Error"**
→ Fix: Check `VITE_API_URL` in Vercel - must end with `/api`

**"Rate limit exceeded"**
→ Fix: You hit free tier limit - wait or upgrade

---

## 🎉 Success!

Once everything is working:

**Your live search engine**:
- 🌐 Frontend: `https://your-app.vercel.app`
- 🔌 Backend: `https://your-app.up.railway.app`
- 💰 Cost: **$0/month** for testing
- ⚡ Speed: 2-3s first search, instant cached
- 🤖 AI: GPT-4 powered answers
- 🔍 Search: Brave Search API

**You can now**:
- Search any topic
- Get AI-generated answers
- See multiple search results
- Enjoy fast, cached results
- Track your usage
- Scale up when ready

---

**Built with ❤️ by Ovara**
