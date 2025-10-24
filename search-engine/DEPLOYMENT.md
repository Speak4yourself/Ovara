# 🚀 Ovara Search Engine - Deployment Guide

Complete guide for deploying Ovara Search to production.

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) [Recommended]
- **Cost**: $0-20/month
- **Difficulty**: Easy
- **Scalability**: Good

### Option 2: AWS/GCP
- **Cost**: $50-200/month
- **Difficulty**: Medium
- **Scalability**: Excellent

### Option 3: DigitalOcean/Linode
- **Cost**: $10-50/month
- **Difficulty**: Medium
- **Scalability**: Good

---

## 🏆 Recommended Setup (Vercel + Railway)

### Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier available)
- API keys ready

---

## 📦 Part 1: Deploy Backend to Railway

### Step 1: Prepare Backend

1. **Create `Procfile` in backend directory**:
```
web: node dist/server.js
```

2. **Update `package.json` scripts**:
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "postinstall": "npm run build"
  }
}
```

### Step 2: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select `search-engine/backend` as root directory

### Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=3001

# Required
BING_API_KEY=your-bing-key
OPENAI_API_KEY=sk-your-key

# Optional
BRAVE_API_KEY=your-brave-key
REDIS_URL=your-redis-url

# Will be set after frontend deploy
FRONTEND_URL=https://search.ovara.app
```

### Step 4: Get Backend URL

After deployment, Railway will give you a URL like:
```
https://your-app.railway.app
```

Save this for frontend configuration.

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Create `.env.production` in frontend directory**:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

2. **Update `package.json`** (already done):
```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

### Step 2: Deploy to Vercel

**Option A: Via CLI**
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Via Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub
4. Select `search-engine/frontend` as root directory
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add:
   - `VITE_API_URL` = `https://your-backend.railway.app/api`

### Step 4: Redeploy

After adding env vars, trigger a redeploy in Vercel.

### Step 5: Get Frontend URL

Vercel will give you:
```
https://your-app.vercel.app
```

Or use custom domain:
```
https://search.ovara.app
```

### Step 6: Update Backend CORS

Go back to Railway backend, update environment variable:
```
FRONTEND_URL=https://search.ovara.app
```

Redeploy backend.

---

## 🔧 Part 3: Set Up Services

### Redis (Upstash) - Free Tier

1. Go to https://upstash.com
2. Create account
3. Click "Create Database"
4. Select region closest to your Railway backend
5. Copy Redis URL
6. Add to Railway env: `REDIS_URL=redis://...`

### PostgreSQL (Supabase) - Free Tier

1. Go to https://supabase.com
2. Create project
3. Go to Settings → Database
4. Copy connection string
5. Add to Railway env: `DATABASE_URL=postgresql://...`

---

## 🌐 Part 4: Custom Domain

### Add Custom Domain to Vercel

1. In Vercel project settings → Domains
2. Add `search.ovara.app`
3. Update DNS records:
   - Type: `CNAME`
   - Name: `search`
   - Value: `cname.vercel-dns.com`

### SSL Certificate

Vercel automatically provisions SSL certificates.

---

## 📊 Part 5: Monitoring

### Set Up Error Tracking (Sentry)

1. Go to https://sentry.io
2. Create project
3. Install SDK:

**Backend**:
```bash
npm install @sentry/node
```

```typescript
// server.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: 'production'
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Frontend**:
```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: 'production'
});
```

### Set Up Analytics (Plausible)

1. Go to https://plausible.io
2. Add domain `search.ovara.app`
3. Add script to `index.html`:

```html
<script defer data-domain="search.ovara.app"
  src="https://plausible.io/js/script.js">
</script>
```

### Uptime Monitoring (UptimeRobot)

1. Go to https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.railway.app/health`
   - Interval: 5 minutes

---

## 🔐 Part 6: Security Checklist

- [x] HTTPS enabled (automatic with Vercel/Railway)
- [x] Environment variables secure (not in code)
- [x] CORS configured correctly
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] Input validation (Zod)
- [ ] Set up firewall rules (if using AWS/GCP)
- [ ] Enable DDoS protection (Cloudflare)

---

## 💰 Part 7: Cost Optimization

### Free Tier Limits

**Vercel**:
- ✅ Unlimited bandwidth
- ✅ 100GB hours/month

**Railway**:
- ✅ $5 free credit/month
- After free tier: ~$5-10/month

**Upstash Redis**:
- ✅ 10K commands/day free
- After: $0.2 per 100K commands

**Supabase**:
- ✅ 500MB database free
- After: $25/month

### Optimization Tips

1. **Aggressive Caching**
   - Set `CACHE_TTL_SECONDS=7200` (2 hours)
   - Reduce API calls by 40%+

2. **Use Brave API First**
   - Brave: $0.50/1K vs Bing: $7/1K
   - Set Brave as primary, Bing as fallback

3. **Smart AI Usage**
   - Use GPT-3.5 for simple queries
   - Reserve GPT-4 for complex questions
   - Cache AI answers aggressively

4. **Monitor Usage**
   - Set up cost alerts
   - Track API usage daily
   - Adjust rate limits if needed

---

## 🚦 Part 8: Production Checklist

### Pre-Launch

- [ ] All API keys configured
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Rate limiting tested
- [ ] Error handling tested
- [ ] Cache working
- [ ] Search results accurate
- [ ] AI answers quality checked
- [ ] Mobile responsive
- [ ] Performance tested (< 2s load)

### Post-Launch

- [ ] Monitoring set up (Sentry, UptimeRobot)
- [ ] Analytics configured (Plausible)
- [ ] Cost tracking enabled
- [ ] Backup strategy
- [ ] Incident response plan
- [ ] Documentation complete

---

## 🔄 Part 9: CI/CD (Optional)

### GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys on push

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deploys on push
```

---

## 🐛 Part 10: Troubleshooting Production

### Backend Not Responding

1. Check Railway logs:
   ```
   railway logs
   ```

2. Verify environment variables set

3. Check health endpoint:
   ```bash
   curl https://your-backend.railway.app/health
   ```

### Frontend Can't Connect to Backend

1. Check CORS settings in backend
2. Verify `VITE_API_URL` in Vercel env vars
3. Check network tab in browser DevTools

### High API Costs

1. Check cache hit rate
2. Increase `CACHE_TTL_SECONDS`
3. Switch to Brave API primarily
4. Add more aggressive rate limiting

### Slow Performance

1. Check Redis connection
2. Verify close geographical regions (frontend → backend → APIs)
3. Enable CDN (Cloudflare)
4. Optimize bundle size

---

## 📈 Part 11: Scaling

### When to Scale

**Signs you need to scale**:
- Response time > 2 seconds consistently
- Rate limits being hit frequently
- API costs > $500/month
- Database > 500MB

### Horizontal Scaling

**Railway**: Increase instances in dashboard

**Database**: Upgrade Supabase plan

**Redis**: Upgrade Upstash plan

### Cost at Scale

**10K searches/day**:
```
Railway (backend):   $20/month
Vercel (frontend):   $0/month (within free tier)
APIs (Bing/OpenAI):  $2,000/month (optimized)
Redis:               $20/month
Database:            $25/month
─────────────────────────────────────
TOTAL:               ~$2,065/month
```

---

## 🎯 Quick Deploy Checklist

```bash
# 1. Get API keys
✓ Bing Search API
✓ OpenAI API
✓ Brave API (optional)

# 2. Deploy backend to Railway
✓ Push to GitHub
✓ Connect Railway to repo
✓ Add environment variables
✓ Deploy

# 3. Deploy frontend to Vercel
✓ Add VITE_API_URL env var
✓ Deploy

# 4. Configure services
✓ Set up Redis (Upstash)
✓ Update backend with Redis URL
✓ Add custom domain

# 5. Set up monitoring
✓ Sentry for errors
✓ Plausible for analytics
✓ UptimeRobot for uptime

# 6. Test
✓ Search works
✓ AI answers work
✓ Cache works
✓ Mobile works

# 7. Launch! 🚀
```

---

## 📞 Support

Having deployment issues?

- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **Ovara Support**: support@ovara.app

---

**🎉 Congratulations! Your Ovara Search Engine is live!**

Access it at: `https://search.ovara.app`
