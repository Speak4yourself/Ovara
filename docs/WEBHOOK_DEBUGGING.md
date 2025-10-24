# Webhook Not Firing - Debugging Guide

## Symptom
- Purchased subscription through Stripe checkout
- Checkout completed successfully
- No record created in `user_subscriptions` table
- No subscription showing in the app

## Root Cause
The webhook endpoint is likely **not configured** in Stripe, so Stripe doesn't know where to send the events.

## Step-by-Step Debugging

### 1. Check if Webhook Exists in Stripe

1. Go to https://dashboard.stripe.com/test/webhooks
2. Look for an endpoint with URL: `https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook`

**If you DON'T see this webhook:**
- The webhook was never configured
- Follow "How to Add Webhook Endpoint" below

**If you DO see the webhook:**
- Click on it
- Go to the "Attempts" tab
- Check if events were sent when you made the purchase
- If events show errors, check the error details

### 2. How to Add Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint" button
3. Enter endpoint URL:
   ```
   https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook
   ```
4. Click "Select events to listen to"
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. Click "Add endpoint"
7. **IMPORTANT:** Copy the "Signing secret" (starts with `whsec_...`)

### 3. Add Webhook Signing Secret to Supabase

After creating the webhook, you need to add the signing secret:

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/settings/functions
2. Scroll to "Secrets"
3. Add a new secret:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (the signing secret from Stripe)
4. Click "Add secret"

**Option B: Via CLI**
```bash
export SUPABASE_ACCESS_TOKEN=sbp_808f731f52cda3598bf45afb9c5ba60d56c5e9f9
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here --project-ref voluiferhsehqrlwsjaq
```

### 4. Test the Webhook

After adding the webhook endpoint and secret:

**Option A: Make a Test Purchase**
1. Log in to your app
2. Go to pricing page
3. Click "Get Premium"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout

**Option B: Send Test Event from Stripe Dashboard**
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Click "Send test webhook"

### 5. Verify Webhook Delivery

**Check in Stripe Dashboard:**
1. Go to your webhook endpoint
2. Click "Attempts" tab
3. You should see recent events
4. Click on an event to see:
   - ✅ Green checkmark = Success (200 response)
   - ❌ Red X = Failed (check error details)

**Check in Supabase Logs:**
1. Go to https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/logs/edge-functions
2. Select `stripe-webhook` from dropdown
3. Look for recent logs showing:
   - `Processing event: checkout.session.completed`
   - `Inferred tier 'premium' from product name: Ovara Premium`

**Check Database:**
1. Go to https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/editor
2. Select `user_subscriptions` table
3. Look for a record with your `user_id`

### 6. Common Issues

#### Issue: Webhook returns 401 Unauthorized
**Cause:** Webhook signing secret not set or incorrect
**Fix:** Follow step 3 above to set `STRIPE_WEBHOOK_SECRET`

#### Issue: Webhook returns 400 Bad Request
**Cause:** Error in webhook handler code
**Fix:** Check Supabase function logs for error details

#### Issue: Webhook shows 200 but no subscription created
**Possible causes:**
1. **Product name doesn't contain tier keyword**
   - Check your Stripe product is named "Ovara Premium", "Ovara Pro", or "Ovara Basic"
   - Or add `tier` metadata to your Stripe prices

2. **RLS policy blocking insert**
   - Check `user_subscriptions` table policies
   - Service role should have permission to insert

3. **User ID not in metadata**
   - Check checkout session metadata includes `userId`

#### Issue: No events showing in webhook attempts
**Cause:** Webhook endpoint added AFTER the purchase
**Fix:** Webhooks only fire for future events. Make a new test purchase.

### 7. Manual Fix for Existing Purchases

If you already purchased but webhook didn't fire, manually create the subscription:

1. Go to Supabase SQL Editor
2. Run:
```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Insert subscription (replace YOUR_USER_ID)
INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    billing_period,
    current_period_end
)
VALUES (
    'YOUR_USER_ID',
    'premium',
    'active',
    'monthly',
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
    tier = 'premium',
    status = 'active',
    updated_at = NOW();
```

### 8. Verification Checklist

- [ ] Webhook endpoint exists in Stripe dashboard
- [ ] Webhook URL is: `https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook`
- [ ] Webhook listens to: `checkout.session.completed`
- [ ] Signing secret (`STRIPE_WEBHOOK_SECRET`) is set in Supabase
- [ ] Edge function is deployed (we did this)
- [ ] Stripe products are named correctly (contain "Premium", "Pro", or "Basic")
- [ ] Test purchase shows event in webhook attempts
- [ ] Event shows 200 success response
- [ ] Subscription appears in `user_subscriptions` table

### 9. Current Status

✅ **Completed:**
- Edge function deployed with improved tier detection
- Function can infer tier from product name

❌ **Still Needed:**
- Configure webhook endpoint in Stripe dashboard (if not done)
- Add webhook signing secret to Supabase
- Test with a new purchase

## Quick Start

If you haven't set up webhooks yet, run these steps:

1. **Add Webhook in Stripe:**
   - URL: `https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret

2. **Add Secret to Supabase:**
   - Go to Project Settings → Functions → Secrets
   - Add `STRIPE_WEBHOOK_SECRET` with the signing secret

3. **Test:**
   - Make a new test purchase
   - Check webhook attempts in Stripe
   - Check `user_subscriptions` table in Supabase

That's it! After these steps, subscriptions will be created automatically.
