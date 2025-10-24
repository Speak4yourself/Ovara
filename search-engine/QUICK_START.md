# ⚡ Ovara Search Engine - 5-Minute Quick Start

Get the search engine running in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- API keys (get these first):
  - **Bing Search API**: https://portal.azure.com (Required)
  - **OpenAI API**: https://platform.openai.com (Required)
  - **Brave API**: https://brave.com/search/api/ (Optional but recommended)

---

## 🚀 Step 1: Get API Keys (5 min)

### Bing Search API ($200 free credit)

1. Go to https://portal.azure.com
2. Create free account (no credit card for trial)
3. Search for "Bing Search v7"
4. Click "Create"
5. Copy "Key 1" from Keys and Endpoint
6. **Save this key!**

### OpenAI API ($5-18 free credit for new accounts)

1. Go to https://platform.openai.com
2. Sign up
3. Go to API Keys
4. Click "Create new secret key"
5. **Save this key!**

### Brave Search API (Optional - Free 2K searches/month)

1. Go to https://brave.com/search/api/
2. Sign up
3. Generate API key
4. **Save this key!**

---

## 💻 Step 2: Install & Configure (2 min)

### Backend Setup

```bash
# Navigate to backend
cd search-engine/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file** with your API keys:
```env
# Required
BING_API_KEY=your-bing-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# Optional (but recommended)
BRAVE_API_KEY=your-brave-key-here

# Leave these as-is
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend Setup

```bash
# Navigate to frontend (from backend)
cd ../frontend

# Install dependencies
npm install
```

---

## ▶️ Step 3: Run (1 min)

Open **TWO terminals**:

### Terminal 1 - Backend
```bash
cd search-engine/backend
npm run dev
```

You should see:
```
🚀 Ovara Search Engine API running on port 3001
```

### Terminal 2 - Frontend
```bash
cd search-engine/frontend
npm run dev
```

You should see:
```
VITE ready in 300 ms
➜  Local:   http://localhost:5173/
```

---

## 🎯 Step 4: Test (1 min)

1. Open browser to http://localhost:5173
2. You should see the Ovara Search homepage
3. Type a search query (try: "best pizza recipes")
4. Press Enter or click Search
5. You should see:
   - AI-generated answer at the top
   - Search results below
   - Sources labeled (bing, brave)

**If it works - Congratulations! 🎉**

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can open http://localhost:5173
- [ ] Can type and submit search
- [ ] Results appear
- [ ] AI answer appears (if OpenAI key is valid)
- [ ] No errors in terminal

---

## 🐛 Common Issues

### "API key not configured"

**Problem**: Backend can't find API keys

**Fix**:
1. Make sure `.env` file is in `backend/` directory
2. Check API keys have no quotes or spaces
3. Restart backend server (Ctrl+C, then `npm run dev`)

### "CORS error" in browser

**Problem**: Backend and frontend can't communicate

**Fix**:
1. Make sure backend is running on port 3001
2. Make sure frontend is running on port 5173
3. Check `FRONTEND_URL` in backend `.env` is `http://localhost:5173`

### "Module not found"

**Problem**: Dependencies not installed

**Fix**:
```bash
# In backend
cd backend
rm -rf node_modules
npm install

# In frontend
cd frontend
rm -rf node_modules
npm install
```

### Search returns no results

**Problem**: API keys might be invalid or rate limited

**Fix**:
1. Check backend terminal for error messages
2. Verify API keys are correct
3. Check you haven't exceeded free tier limits
4. Try a different search query

### Slow searches (> 5 seconds)

**Expected**: First search is always slower
- Query enhancement: ~300ms
- Search APIs: ~800ms
- AI answer: ~1200ms
- Total: ~2-3 seconds

**If much slower**:
- Check your internet connection
- API providers might be slow
- Try again (second search should be instant from cache)

---

## 🎓 Next Steps

### Test Different Queries

Try these to see AI in action:
- "How does photosynthesis work"
- "Best programming languages 2025"
- "Recipe for chocolate chip cookies"
- "What is quantum computing"

### Check the Cache

Second time you search the same thing should be **instant** (cached).

### Explore Features

- **Trending searches**: On homepage
- **Search suggestions**: Type slowly to see
- **Source labels**: Each result shows source (bing/brave)
- **AI confidence**: High/medium/low in AI answer card

---

## 📊 Monitor Usage

### Check Backend Logs

In backend terminal, you'll see:
```
🔍 Original: "pizza" → Enhanced: "best pizza recipes near me"
✅ Cache HIT (Memory): best pizza recipes
💾 Cached to Redis: chocolate cake recipe (TTL: 3600s)
```

### Cost Tracking (Important!)

**Keep an eye on**:
- OpenAI dashboard: https://platform.openai.com/usage
- Azure portal: https://portal.azure.com (Bing usage)

**Free tier limits**:
- Bing: $200 credit (for new accounts)
- OpenAI: $5-18 credit
- That's ~10K-20K searches free!

---

## 💡 Tips for Testing

### Save Money While Testing

1. **Use caching**: Search the same queries
2. **Test with Brave only**: Cheaper ($0.50 vs $7 per 1K)
3. **Disable AI temporarily**: Set `aiEnabled: false` in search request
4. **Monitor usage**: Check dashboards daily

### Test Different Scenarios

1. **Simple query**: "cats"
2. **Question**: "How tall is the Eiffel Tower?"
3. **Complex**: "Difference between React and Vue"
4. **Misspelled**: "reastaurants near me"
5. **Long query**: "What are the best practices for writing..."

---

## 🚀 Ready for Production?

Once you've tested locally and everything works:

1. **Read DEPLOYMENT.md** for production deploy
2. **Deploy to Railway** (backend)
3. **Deploy to Vercel** (frontend)
4. **Set up monitoring** (Sentry, Plausible)
5. **Launch!** 🎉

---

## 📞 Need Help?

### Resources

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOYMENT.md
- **Architecture**: See BUILD_COMPLETE.md
- **Detailed Plan**: See docs/OVARA_SEARCH_ENGINE_PLAN.md

### Support

- **GitHub Issues**: Report bugs
- **Email**: support@ovara.app
- **Discord**: discord.gg/ovara

---

## ⏱️ Time Breakdown

If everything goes smoothly:

```
Getting API keys:        5 minutes
Installing dependencies: 2 minutes
Running servers:         1 minute
Testing:                 1 minute
─────────────────────────────────
TOTAL:                   ~9 minutes
```

---

## 🎉 Success!

**If you got here and it's working - AWESOME!**

You now have a working AI-enhanced search engine running locally!

### What you can search:
- ✅ Any topic
- ✅ Questions
- ✅ Recipes
- ✅ Tutorials
- ✅ News
- ✅ Products
- ✅ Anything!

### What you get back:
- ✅ AI-generated answer
- ✅ Multiple search results
- ✅ Source citations
- ✅ Fast results (< 2s)
- ✅ Privacy-first

---

## 🎯 Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Install everything
cd backend && npm install && cd ../frontend && npm install

# Production build
cd backend && npm run build
cd frontend && npm run build

# Check health
curl http://localhost:3001/health
```

---

**Happy Searching! 🔍✨**

*Remember: First search is slow (~2s), cached searches are instant!*
