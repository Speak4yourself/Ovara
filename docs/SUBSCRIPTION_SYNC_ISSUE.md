# Subscription Sync Issue - Root Cause Analysis

## Issue Description
When users purchase a subscription through Stripe, the subscription appears to "disappear" after logging out. Upon logging back in, they see "Basic" tier instead of their purchased tier (Pro/Premium).

## Root Cause

The issue is **NOT** that subscriptions are being deleted on logout. The real problem is that **subscriptions are never being created in the database** when purchases happen.

### What's Actually Happening:

1. **Purchase Flow:**
   - User clicks "Get Premium" → Redirected to Stripe Checkout
   - User enters test card details and completes purchase
   - Stripe checkout succeeds ✅
   - User redirected back to app ✅

2. **Missing Step:**
   - **Stripe webhook should fire** → `stripe-webhook` edge function
   - **Edge function should create record** in `user_subscriptions` table
   - **This step is NOT happening** ❌

3. **On Logout:**
   - React clears `userSubscription` state (lines 178-181 in App.jsx)
   - This is **correct behavior** - it's just clearing UI state
   - The subscription should exist in the database (but it doesn't)

4. **On Login:**
   - `loadUserSubscription()` queries database for subscription record
   - Finds nothing (because webhook never created it)
   - Defaults to "Basic" tier

## The Code is Correct

The logout behavior (App.jsx lines 178-181) is **correct**:

```javascript
} else {
  setDiscordLink(null);
  setUserSubscription(null);  // This is fine - just clearing state
}
```

This only clears React state, not the database. The problem is the database record never existed.

## Why Webhook Didn't Fire

The webhook handler exists at `supabase/functions/stripe-webhook/index.ts` and looks correct. However, it's not being called because:

1. **Webhook not configured in Stripe Dashboard**
   - Need to add webhook endpoint URL in Stripe Dashboard
   - URL format: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

2. **Webhook signing secret not set**
   - After creating webhook, Stripe provides a signing secret
   - Must be added as `STRIPE_WEBHOOK_SECRET` in Supabase env vars

3. **Edge function may not be deployed**
   - Functions need to be deployed with `supabase functions deploy stripe-webhook`

## Solution Steps

### 1. Deploy the Stripe Webhook Function

```bash
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
```

### 2. Get the Webhook URL

After deployment, the URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter the webhook URL from step 2
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`)

### 4. Add Webhook Secret to Supabase

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add secret:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (from step 3)

### 5. Test the Integration

#### Option A: Use Stripe CLI (Recommended)
```bash
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

#### Option B: Make a Real Test Purchase
1. Log in to Ovara
2. Go to pricing page
3. Click "Get Premium"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check Supabase → Table Editor → `user_subscriptions`
7. You should see a new record with your user_id and tier='premium'
8. Refresh the app - you should see Premium tier
9. Log out and log back in - Premium tier should persist ✅

## How to Fix Existing Users

For users who purchased but don't have subscription records, manually create them:

```sql
-- Find the user's ID
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Insert subscription record
INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    billing_period,
    current_period_end
)
VALUES (
    'USER_ID_FROM_ABOVE',
    'premium',  -- or 'pro'
    'active',
    'monthly',  -- or 'yearly'
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
    tier = 'premium',
    status = 'active',
    updated_at = NOW();
```

## Prevention

Once webhooks are properly configured:
- ✅ New purchases automatically create subscription records
- ✅ Subscriptions persist across logout/login
- ✅ Subscription updates sync automatically
- ✅ Cancellations update status correctly

## Monitoring

To monitor webhook delivery:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. View "Attempts" tab to see webhook deliveries
4. Failed webhooks will show error details

## Debugging Webhook Issues

If webhooks still aren't working:

1. **Check Supabase Logs:**
   ```bash
   supabase functions logs stripe-webhook --project-ref YOUR_PROJECT_REF
   ```

2. **Check Environment Variables:**
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
   - `SUPABASE_URL` - Auto-provided
   - `SERVICE_ROLE_KEY` - Auto-provided

3. **Verify Webhook Handler:**
   - Check `supabase/functions/stripe-webhook/index.ts`
   - Ensure it handles `checkout.session.completed` event
   - Verify it creates records in `user_subscriptions` table

4. **Test Locally:**
   ```bash
   supabase start
   supabase functions serve stripe-webhook
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

## Summary

**The Bug:** Not a bug in the logout code. The issue is that Stripe webhooks aren't configured, so subscription purchases never create database records.

**The Fix:** Configure Stripe webhook endpoint and add signing secret to Supabase.

**Impact:** Once fixed, all future purchases will work correctly and subscriptions will persist across sessions.
