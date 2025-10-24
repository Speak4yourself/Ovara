@echo off
set SUPABASE_ACCESS_TOKEN=sbp_101037c370d2ea67a1ac6f638f13148a88dc0c88

echo Linking Supabase project...
npx supabase link --project-ref voluiferhsehqrlwsjaq

echo.
echo Setting secrets...
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

npx supabase secrets set SUPABASE_URL=https://voluiferhsehqrlwsjaq.supabase.co

echo.
echo NOTE: You need to get the SERVICE_ROLE_KEY from your Supabase dashboard
echo Go to: https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/settings/api
echo Copy the service_role key (secret) and run:
echo npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

echo.
echo Deploying create-checkout-session function...
npx supabase functions deploy create-checkout-session

echo.
echo Deploying stripe-webhook function...
npx supabase functions deploy stripe-webhook

echo.
echo Deployment complete!
echo.
echo NEXT STEPS:
echo 1. Set the SUPABASE_SERVICE_ROLE_KEY secret (see note above)
echo 2. Set up the Stripe webhook (see STRIPE_SETUP_GUIDE.md Step 4)
pause
