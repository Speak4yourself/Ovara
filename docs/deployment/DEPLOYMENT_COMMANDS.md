# Quick Deployment Commands

Your environment is now configured! Here are the commands to complete the deployment.

## Quick Start - Run PowerShell Script

The easiest way is to run the PowerShell script:

```powershell
powershell -ExecutionPolicy Bypass -File deploy-supabase.ps1
```

This will:
1. Link your Supabase project
2. Set all secrets
3. Deploy both Edge Functions

## Manual Deployment (If Script Fails)

If you prefer to run commands manually, follow these steps:

### 1. Set Environment Variable

```cmd
set SUPABASE_ACCESS_TOKEN=sbp_101037c370d2ea67a1ac6f638f13148a88dc0c88
```

### 2. Link Project

```cmd
npx supabase link --project-ref voluiferhsehqrlwsjaq
```

### 3. Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/settings/api
2. Find the **"service_role" key** (under "Project API keys")
3. Click "Reveal" and copy the key

### 4. Set Secrets

```cmd
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

npx supabase secrets set SUPABASE_URL=https://voluiferhsehqrlwsjaq.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste_your_service_role_key_here>
```

### 5. Deploy Functions

```cmd
npx supabase functions deploy create-checkout-session

npx supabase functions deploy stripe-webhook
```

## After Deployment

### Set Up Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Set endpoint URL to:
   ```
   https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **webhook signing secret** (starts with `whsec_`)
6. Set it as a secret:
   ```cmd
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Test Your Integration

1. Start the dev server:
   ```cmd
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Log in to your account

4. Click on a pricing plan

5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Troubleshooting

### "Access token not provided"
Make sure you've set the environment variable:
```cmd
set SUPABASE_ACCESS_TOKEN=sbp_101037c370d2ea67a1ac6f638f13148a88dc0c88
```

### Function deployment fails
- Check that you're in the project directory
- Verify the `supabase/functions` folder exists
- Try running with `--debug` flag: `npx supabase functions deploy create-checkout-session --debug`

### Webhook not receiving events
- Double-check the webhook URL in Stripe Dashboard
- Verify the webhook secret is set correctly
- Check function logs: `npx supabase functions logs stripe-webhook`

## Current Configuration

✅ Environment variables configured in `.env`:
- Supabase URL
- Supabase Anon Key
- Stripe Publishable Key
- All 6 Stripe Price IDs

✅ Edge Functions created:
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

✅ Frontend integration:
- Stripe checkout buttons on pricing pages
- Annual savings calculator
- User authentication check

## What's Left

🔲 Deploy Edge Functions to Supabase (run the PowerShell script or manual commands above)
🔲 Get and set Service Role Key
🔲 Set up Stripe webhook
🔲 Set webhook secret
🔲 Test the payment flow

Once these are complete, your Stripe payment integration will be fully functional!
