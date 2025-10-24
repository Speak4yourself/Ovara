# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for the Ovara membership system.

## Prerequisites

- Stripe account (test mode is already configured)
- Supabase project with Edge Functions enabled
- Environment variables configured

## Step 1: Set Up Stripe Products and Prices

You need to create products and prices in your Stripe Dashboard for each membership tier.

### Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click "Add product" for each tier:

#### Basic Tier
- **Product Name**: Ovara Basic
- **Description**: Core typing engine with 10 saved presets
- **Pricing**:
  - Monthly: $5/month (recurring)
  - Yearly: $48/year (recurring)

#### Pro Tier
- **Product Name**: Ovara Pro
- **Description**: All Basic features plus unlimited presets, stealth mode, and priority support
- **Pricing**:
  - Monthly: $15/month (recurring)
  - Yearly: $144/year (recurring)

#### Premium Tier
- **Product Name**: Ovara Premium
- **Description**: All Pro features plus advanced customization and 24/7 priority support
- **Pricing**:
  - Monthly: $29/month (recurring)
  - Yearly: $276/year (recurring)

### Important: Add Metadata to Prices

For each price you create, add metadata to help identify the tier:
- Key: `tier`
- Value: `basic`, `pro`, or `premium`

This metadata is used by the webhook to correctly assign subscription tiers.

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SI9dyD1bZSa5Jx4au7Febt5hTDBgOw2b0O7chf2rR9Pple00STnKCTAw3WxuBU6CSloMxTFyNcRU87KCWZ7cLN700e2g2uFV2

# Stripe Price IDs (get these from Stripe Dashboard after creating products)
VITE_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx
```

**To get Price IDs:**
1. Go to your product in Stripe Dashboard
2. Click on the pricing
3. Copy the Price ID (starts with `price_`)

## Step 3: Deploy Supabase Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### Set Edge Function Secrets

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Set webhook secret (get this after setting up webhook in Stripe)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Set Supabase URL and service role key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deploy Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy webhook function
supabase functions deploy stripe-webhook
```

## Step 4: Set Up Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to your Supabase function:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Update your Supabase secrets with this webhook secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Step 5: Update Database Schema

Make sure your `user_subscriptions` table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (true);
```

## Step 6: Test the Integration

### Testing in Development

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the pricing page
3. Toggle between monthly and yearly to see the savings calculation
4. Click on a plan to initiate checkout (you must be logged in)
5. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future date for expiry and any 3 digits for CVC

### What Happens During Checkout

1. User clicks on a plan button
2. Frontend calls the `create-checkout-session` Edge Function
3. Function creates a Stripe Checkout Session
4. User is redirected to Stripe's hosted checkout page
5. User completes payment
6. Stripe sends webhook to `stripe-webhook` function
7. Webhook updates the `user_subscriptions` table
8. User is redirected back to your site with success message

## Step 7: Go Live

When ready for production:

1. Switch Stripe to live mode
2. Create new products and prices in live mode
3. Update environment variables with live keys:
   - `VITE_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `STRIPE_SECRET_KEY` (starts with `sk_live_`)
4. Create new webhook endpoint for live mode
5. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

## Features Implemented

### 1. Annual Savings Display
- When viewing **yearly** plans: Shows actual savings amount and percentage
  - Example: "Save $12 (20%) vs monthly"
- When viewing **monthly** plans: Shows how much they could save with yearly
  - Example: "$48/yr saves 20%"

### 2. Stripe Checkout Integration
- Secure payment processing through Stripe
- Automatic subscription management
- Real-time subscription updates via webhooks
- Support for both monthly and yearly billing

### 3. User Authentication Required
- Users must be logged in to subscribe
- Automatic redirect to login if not authenticated

## Pricing Structure

| Tier | Monthly | Yearly | Annual Savings |
|------|---------|--------|----------------|
| Basic | $5 | $48 | $12 (20%) |
| Pro | $15 | $144 | $36 (20%) |
| Premium | $29 | $276 | $72 (21%) |

## Troubleshooting

### Checkout fails with "Price configuration error"
- Verify all price IDs are correctly set in `.env`
- Make sure environment variables are loaded (restart dev server)

### Webhook not receiving events
- Check webhook endpoint URL is correct
- Verify webhook signing secret is set correctly
- Check Supabase function logs: `supabase functions logs stripe-webhook`

### Subscription not updating in database
- Check Supabase function logs for errors
- Verify RLS policies allow service role to write
- Ensure webhook secret is correctly configured

### "No checkout URL received" error
- Check Supabase Edge Function logs
- Verify Stripe secret key is set correctly
- Make sure user is authenticated

## Support

For issues with:
- **Stripe**: [Stripe Documentation](https://stripe.com/docs)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **This Integration**: Check the function logs or review the code in `supabase/functions/`

## Security Notes

- Never commit `.env` file to version control
- Use test mode keys during development
- Validate webhook signatures (already implemented)
- Use Supabase RLS policies to protect data
- Store sensitive keys in Supabase secrets, not in code
