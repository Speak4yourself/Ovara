# Complete Test Purchase Guide

## Current Status ✅

All webhook infrastructure is now properly configured:
- ✅ Webhook endpoint deployed with `--no-verify-jwt`
- ✅ Webhook signing secret set: `STRIPE_WEBHOOK_SECRET`
- ✅ Webhook URL configured in Stripe Dashboard
- ✅ Edge function has intelligent tier detection

## The Issue

Your previous checkout sessions show `"payment_status": "unpaid"` and `"status": "open"`, which means you **started** checkout but didn't **complete** the payment.

The webhook `checkout.session.completed` only fires AFTER successful payment.

## How to Complete a Full Test Purchase

### Step 1: Start Checkout
1. Open your Ovara app
2. Make sure you're logged in
3. Go to the pricing page
4. Click "Get Premium" (or whichever tier you want)

### Step 2: Complete Payment on Stripe
This is the critical step you may have missed before:

1. You'll be redirected to `checkout.stripe.com`
2. You should see a payment form with:
   - Email field
   - Card information fields
   - A blue button at the bottom

3. Fill in the form:
   - **Email**: Use any test email
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

4. **CRITICAL**: Click the blue **"Subscribe"** or **"Pay"** button at the bottom
   - This is what completes the payment
   - Without clicking this, the checkout stays "open" and unpaid
   - The webhook will NOT fire until you click this

5. Wait for Stripe to process (should be instant for test card)

6. You should be redirected back to your app

### Step 3: Verify Webhook Fired

#### Check Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Attempts" tab
4. You should see a **new** event: `checkout.session.completed`
5. Click on it - it should show:
   - ✅ Green checkmark with "200 OK" response
   - Response body: `{"received":true}`

If you see an error instead:
- Red X with error message → Share the error with me
- 401 error → We already fixed this, shouldn't happen
- "No signature" → We already fixed this, shouldn't happen

#### Check Supabase Database:
1. Go to https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/editor
2. Click on `user_subscriptions` table (in left sidebar under "Tables")
3. Look for a row with your `user_id`
4. It should show:
   - `tier`: "premium" (or whichever you purchased)
   - `status`: "active"
   - `current_period_end`: 30 days from now

#### Check Your App:
1. Refresh the page (or reload the app)
2. Your subscription tier should now show "Premium" (or the tier you purchased)
3. Log out
4. Log back in
5. Subscription should **still** show "Premium" ✅

## Common Mistakes

### ❌ Mistake 1: Not Clicking "Subscribe" Button
**Symptom**: Checkout page loads, you see the form, but then close it or navigate away
**Result**: Checkout session created but `payment_status: "unpaid"`
**Fix**: Must click the blue button at the bottom to complete payment

### ❌ Mistake 2: Clicking Stripe Logo or Back Button
**Symptom**: You're on checkout page but click back instead of completing
**Result**: Same as above - checkout stays open/unpaid
**Fix**: Complete the full flow by clicking "Subscribe"

### ❌ Mistake 3: Using Wrong Test Card
**Symptom**: Payment fails or asks for real card
**Result**: Checkout doesn't complete
**Fix**: Use exactly `4242 4242 4242 4242` - this is Stripe's test card

## What Happens After Successful Payment

1. **Stripe processes payment** (instant for test mode)
2. **Stripe creates subscription** in their system
3. **Stripe sends webhook** to: `https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook`
4. **Our webhook handler**:
   - Verifies signature ✅
   - Extracts subscription details
   - Determines tier from product name ("Ovara Premium" → tier="premium")
   - Creates/updates record in `user_subscriptions` table
5. **Your app loads subscription** from database
6. **UI shows correct tier** 🎉

## If It Still Doesn't Work

After completing a FULL checkout (with the "Subscribe" button clicked):

1. **Check webhook attempt in Stripe**
   - Share the full response/error from the attempt

2. **Check Supabase function logs**
   - Go to https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/logs/edge-functions
   - Filter by `stripe-webhook`
   - Look for logs from the time of your purchase
   - Share any error messages

3. **Check browser console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any errors related to subscription loading

## Summary

The webhook configuration is correct. You just need to complete a full test purchase by:
1. Starting checkout from your app
2. Filling in test card details on Stripe
3. **Clicking the "Subscribe" button** ← You probably missed this step
4. Waiting for redirect back to app

Then verify the webhook fired and subscription was created.
