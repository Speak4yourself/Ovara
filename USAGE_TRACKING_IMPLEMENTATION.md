# Usage Tracking & Rate Limiting System

Complete implementation of tier-based usage tracking with beautiful UI warnings and upgrade prompts.

---

## Overview

This system tracks user usage across all AI features and enforces tier-based limits. When users approach or hit their limits, they see beautiful warning popups with upgrade CTAs that link to the purchase page.

**Key Features:**
- ✅ Database-backed usage tracking (resets monthly)
- ✅ Separate tracking for cheap vs premium model usage
- ✅ Beautiful UI warnings when limits are approached (80%+) or hit (100%)
- ✅ Automatic upgrade prompts with benefits and pricing
- ✅ "Upgrade Now" buttons that send users to `/purchase` page
- ✅ Real-time usage display components

---

## Database Schema

### Table: `usage_tracking`

Location: `sql/CREATE_USAGE_TRACKING.sql`

**Columns:**
- `user_id`: User reference
- `period_start` / `period_end`: Monthly tracking period
- `tier`: User's subscription tier

**Free Tier Counters** (for cheap models):
- `citations_used` / `citations_limit` (10/month)
- `ai_detections_used` / `ai_detections_limit` (20/month = 5/week)
- `outlines_used` / `outlines_limit` (20/month)
- `essay_analyses_used` / `essay_analyses_limit` (12/month = 3/week)
- `humanizations_used` / `humanizations_limit` (12/month)
- `essay_generations_used` / `essay_generations_limit` (12/month)

**Premium Counters** (for premium models on Basic/Pro):
- `premium_detections_used` / `premium_detections_limit` (Basic: 10, Pro: 100)
- `premium_analyses_used` / `premium_analyses_limit` (Basic: 5, Pro: 50)
- `premium_humanizations_used` / `premium_humanizations_limit` (Basic: 5, Pro: 50)
- `premium_essays_used` / `premium_essays_limit` (Basic: 3, Pro: 30)

### Functions

1. **`get_or_create_usage_period(p_user_id, p_tier)`**
   - Gets or creates current month's usage record
   - Automatically sets limits based on tier
   - Returns usage tracking object

2. **`can_use_feature(p_user_id, p_tier, p_feature, p_is_premium)`**
   - Checks if user can use a feature
   - Returns `true` if allowed, `false` if limit reached
   - Features: `citation`, `ai_detection`, `outline`, `essay_analysis`, `humanization`, `essay_generation`

3. **`increment_usage(p_user_id, p_tier, p_feature, p_is_premium)`**
   - Increments usage counter for a feature
   - Returns updated usage object

---

## React Utilities

### File: `src/utils/usageTracking.js`

**Functions:**

1. **`getCurrentUsage()`**
   ```javascript
   const usage = await getCurrentUsage()
   // Returns full usage object for current month
   ```

2. **`canUseFeature(feature, isPremium)`**
   ```javascript
   const canUse = await canUseFeature('citation', false)
   if (!canUse) {
     // Show limit warning
   }
   ```

3. **`incrementUsage(feature, isPremium)`**
   ```javascript
   const updatedUsage = await incrementUsage('citation', false)
   setUsage(updatedUsage) // Update local state
   ```

4. **`getFeatureUsage(usage, feature, isPremium)`**
   ```javascript
   const stats = getFeatureUsage(usage, 'citation', false)
   // Returns: { used, limit, remaining, percentage }
   ```

5. **`getTierLimits(tier)`**
   ```javascript
   const limits = getTierLimits('free')
   // Returns limit configuration for tier
   ```

6. **`getNextTierInfo(currentTier)`**
   ```javascript
   const upgrade = getNextTierInfo('free')
   // Returns: { tier, name, price, benefits }
   ```

---

## UI Components

### 1. UsageLimitWarning Component

Location: `src/components/UsageLimitWarning.jsx`

**Beautiful popup warning that appears when:**
- User hits 80% of limit (warning state - yellow/orange)
- User hits 100% of limit (blocked state - red)

**Features:**
- Animated slide-in from right
- Progress bar showing usage
- Tier-specific upgrade information
- "Upgrade Now" button → navigates to `/purchase`
- Close button (X)

**Usage:**
```jsx
{showLimitWarning && usage && (
  <UsageLimitWarning
    usage={usage}
    feature="citation"
    isPremium={false}
    tier={tier}
    onClose={() => setShowLimitWarning(false)}
  />
)}
```

**Visual Design:**
```
┌───────────────────────────────────────┐
│  ⚠️  Almost at your limit        X    │
│  2 Citations remaining                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  8 used                          10   │
│                                       │
│  ⚡ Upgrade to Basic                  │
│  • Unlimited basic usage              │
│  • Try premium AI models (limited)    │
│                                       │
│  [  Upgrade Now - $9.99/month  ]      │
└───────────────────────────────────────┘
```

### 2. UsageTracker Component

Location: `src/components/UsageTracker.jsx`

**Displays current usage statistics**

**Two modes:**

**Compact Mode** (for feature pages):
```jsx
<UsageTracker tier={tier} feature="citation" compact />
```

Shows single feature with progress bar.

**Full Mode** (for dashboard):
```jsx
<UsageTracker tier={tier} />
```

Shows all features with usage bars, organized by:
- Basic AI Usage (for Free tier)
- Premium AI Usage (for paid tiers)

**Features:**
- Color-coded progress bars (blue → yellow at 80% → red at 100%)
- "Unlimited" badges for paid tier features
- Icon for each feature
- Real-time usage numbers

---

## Integration Guide

### Step 1: Import Dependencies

```javascript
import { canUseFeature, incrementUsage, getCurrentUsage } from '../utils/usageTracking'
import UsageLimitWarning from './UsageLimitWarning'
import UsageTracker from './UsageTracker'
```

### Step 2: Add State

```javascript
const [usage, setUsage] = useState(null)
const [showLimitWarning, setShowLimitWarning] = useState(false)
```

### Step 3: Load Usage on Mount

```javascript
useEffect(() => {
  if (user) {
    loadUsage()
  }
}, [user])

const loadUsage = async () => {
  try {
    const data = await getCurrentUsage()
    setUsage(data)
  } catch (error) {
    console.error('Error loading usage:', error)
  }
}
```

### Step 4: Check Before Feature Use

```javascript
const handleFeature = async () => {
  // Check if user can use feature
  const canUse = await canUseFeature('citation', false)
  if (!canUse) {
    setShowLimitWarning(true)
    showToast('Limit reached! Upgrade to continue')
    return
  }

  // ... perform feature action ...

  // Increment usage counter
  const updatedUsage = await incrementUsage('citation', false)
  setUsage(updatedUsage)

  // Check if approaching limit (80%)
  const tier = userSubscription?.tier?.toLowerCase() || 'free'
  if (tier === 'free') {
    const used = updatedUsage.citations_used || 0
    const limit = updatedUsage.citations_limit || 10
    if (used >= limit * 0.8) {
      setShowLimitWarning(true)
    }
  }
}
```

### Step 5: Add UI Components

```jsx
return (
  <div>
    {/* Limit Warning Popup */}
    {showLimitWarning && usage && (
      <UsageLimitWarning
        usage={usage}
        feature="citation"
        isPremium={false}
        tier={tier}
        onClose={() => setShowLimitWarning(false)}
      />
    )}

    {/* Usage Tracker (optional) */}
    <UsageTracker tier={tier} feature="citation" compact />

    {/* Your feature UI */}
  </div>
)
```

---

## Feature Names

Use these exact strings for the `feature` parameter:

| Feature | Name String | Free Limit | Basic (Cheap) | Basic (Premium) | Pro (Premium) |
|---------|-------------|------------|---------------|-----------------|---------------|
| Citations | `citation` | 10/month | ∞ | N/A | N/A |
| AI Detection | `ai_detection` | 20/month | ∞ | 10/month | 100/month |
| Outlines | `outline` | 20/month | ∞ | N/A | N/A |
| Essay Analysis | `essay_analysis` | 12/month | ∞ | 5/month | 50/month |
| Humanization | `humanization` | 12/month | ∞ | 5/month | 50/month |
| Essay Generation | `essay_generation` | 12/month | ∞ | 3/month | 30/month |

---

## Example: Citation Generator

See `src/components/CitationGenerator.jsx` for full implementation.

**Key parts:**

1. **State setup:**
```javascript
const [usage, setUsage] = useState(null)
const [showLimitWarning, setShowLimitWarning] = useState(false)
```

2. **Load usage:**
```javascript
useEffect(() => {
  if (user) {
    loadUsage()
  }
}, [user])
```

3. **Check before generation:**
```javascript
const generateCitation = async () => {
  const canUse = await canUseFeature('citation', false)
  if (!canUse) {
    setShowLimitWarning(true)
    showToast('Citation limit reached!')
    return
  }

  // Generate citation...

  // Track usage
  const updatedUsage = await incrementUsage('citation', false)
  setUsage(updatedUsage)

  // Show warning if approaching limit
  if (updatedUsage.citations_used >= updatedUsage.citations_limit * 0.8) {
    setShowLimitWarning(true)
  }
}
```

4. **Render warning:**
```jsx
{showLimitWarning && usage && (
  <UsageLimitWarning
    usage={usage}
    feature="citation"
    isPremium={false}
    tier={tier}
    onClose={() => setShowLimitWarning(false)}
  />
)}
```

---

## Premium Model Tracking

For features that support both cheap and premium models (AI Detection, Essay Analysis, Humanizer, Essay Generator):

**Example: AI Detection with premium option**

```javascript
const detectAI = async (detailed = false) => {
  const tier = userSubscription?.tier?.toLowerCase() || 'free'

  // Determine if using premium
  const usePremium = detailed && (tier === 'pro' || tier === 'premium')

  // Check limit
  const canUse = await canUseFeature('ai_detection', usePremium)
  if (!canUse) {
    setShowLimitWarning(true)
    return
  }

  // Perform detection...

  // Track usage
  const updatedUsage = await incrementUsage('ai_detection', usePremium)
  setUsage(updatedUsage)

  // Check if approaching premium limit
  if (usePremium && (tier === 'basic' || tier === 'pro')) {
    const used = updatedUsage.premium_detections_used
    const limit = updatedUsage.premium_detections_limit
    if (used >= limit * 0.8) {
      setShowLimitWarning(true)
    }
  }
}
```

---

## Upgrade Flow

When user clicks "Upgrade Now" button:

1. **Warning component calls:**
```javascript
navigate('/purchase')
```

2. **Purchase page should:**
   - Show tier comparison
   - Highlight recommended tier based on current tier
   - Show Stripe checkout

3. **After successful purchase:**
   - Webhook updates `user_subscriptions` table
   - Next usage check automatically uses new tier limits

---

## Testing Checklist

### Free Tier
- [ ] User can use feature up to limit (10 citations)
- [ ] Warning appears at 80% (8 citations)
- [ ] Blocked at 100% (10 citations)
- [ ] "Upgrade to Basic" CTA appears
- [ ] Upgrade button → `/purchase`

### Basic Tier
- [ ] Unlimited cheap model usage (citations, detections, etc.)
- [ ] Limited premium usage (10 detections, 5 analyses, etc.)
- [ ] Warning at 80% of premium limit
- [ ] Blocked at 100% of premium limit
- [ ] "Upgrade to Pro" CTA appears

### Pro Tier
- [ ] Unlimited cheap model usage
- [ ] Expanded premium limits (100 detections, 50 analyses, etc.)
- [ ] Warning at 80% of premium limit
- [ ] "Upgrade to Premium" CTA appears

### Premium Tier
- [ ] Unlimited everything
- [ ] No warnings shown (limit = 999999)

---

## Database Setup

Run this SQL in Supabase SQL Editor:

```bash
# Execute the SQL file
cat sql/CREATE_USAGE_TRACKING.sql
```

Or manually in Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `sql/CREATE_USAGE_TRACKING.sql`
3. Run the script

---

## Monitoring & Analytics

### Track These Metrics

1. **Upgrade Conversion Rate**
   - How many users who see limit warnings upgrade?
   - Track with analytics event when warning shows

2. **Feature Usage by Tier**
   - Which features drive the most upgrades?
   - Query `usage_tracking` table

3. **Limit Hit Rate**
   - How many free users hit limits?
   - Adjust limits if too many/too few hitting them

### Example Analytics Events

```javascript
// When warning shows
analytics.track('Usage Limit Warning Shown', {
  tier: tier,
  feature: feature,
  isPremium: isPremium,
  percentage: usagePercentage
})

// When user clicks upgrade
analytics.track('Upgrade Button Clicked', {
  fromTier: currentTier,
  toTier: nextTier,
  source: 'usage_limit_warning',
  feature: feature
})
```

---

## Troubleshooting

### Warning not showing?
- Check if user has usage record: `SELECT * FROM usage_tracking WHERE user_id = ...`
- Verify tier in `user_subscriptions` table
- Check console for errors in `canUseFeature` or `incrementUsage`

### Usage not incrementing?
- Verify RPC functions exist in Supabase
- Check RLS policies allow user to update their own records
- Look for errors in browser console

### Wrong limits?
- Verify `get_or_create_usage_period` sets correct limits for tier
- Check if tier is lowercase in function calls
- Ensure user's tier in database matches their actual subscription

---

## Future Enhancements

1. **Email Notifications**
   - Send email at 80% usage
   - Send email at 100% usage

2. **Usage Dashboard**
   - Full page showing all usage stats
   - Charts and graphs
   - Historical data

3. **Soft Limits**
   - Allow slight overage (105%) before hard block
   - "You've used 105% of your limit" message

4. **Add-on Packs**
   - Buy extra premium credits
   - "Add 10 more premium detections for $5"

5. **Team Features**
   - Shared usage pool
   - Admin can see team usage

---

## Summary

**Files Created:**
- ✅ `sql/CREATE_USAGE_TRACKING.sql` - Database schema & functions
- ✅ `src/utils/usageTracking.js` - React utility functions
- ✅ `src/components/UsageLimitWarning.jsx` - Warning popup component
- ✅ `src/components/UsageTracker.jsx` - Usage display component

**Integration Example:**
- ✅ `src/components/CitationGenerator.jsx` - Full implementation

**Next Steps:**
1. Run SQL script in Supabase
2. Integrate into remaining features (AI Detector, Outline, Essay Analyzer, Humanizer, Essay Generator)
3. Create `/purchase` page with Stripe checkout
4. Test all tiers thoroughly
5. Add analytics tracking

**User Experience:**
- Free users see limits and upgrade prompts → drives conversion
- Paid users see premium usage tracking → encourages Pro upgrade
- Premium users see "Unlimited" badges → feel valued
- Beautiful UI makes limits feel helpful, not punishing

---

Generated: October 17, 2025
Status: ✅ Complete & Ready to Use
