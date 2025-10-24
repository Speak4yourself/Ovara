# Supabase Deployment Script
# Run this with: powershell -ExecutionPolicy Bypass -File deploy-supabase.ps1

$env:SUPABASE_ACCESS_TOKEN = "sbp_101037c370d2ea67a1ac6f638f13148a88dc0c88"

Write-Host "===== Supabase Edge Functions Deployment =====" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Linking Supabase project..." -ForegroundColor Yellow
npx supabase link --project-ref voluiferhsehqrlwsjaq

Write-Host ""
Write-Host "Step 2: Setting Stripe secret key..." -ForegroundColor Yellow
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

Write-Host ""
Write-Host "Step 3: Getting Service Role Key..." -ForegroundColor Yellow
Write-Host "You need to get the SERVICE_ROLE_KEY from your Supabase dashboard" -ForegroundColor Red
Write-Host "Go to: https://supabase.com/dashboard/project/voluiferhsehqrlwsjaq/settings/api" -ForegroundColor Cyan
Write-Host ""
$serviceRoleKey = Read-Host "Paste your service_role key here and press Enter (or type 'skip' to skip this step)"

if ($serviceRoleKey -ne "skip" -and $serviceRoleKey -ne "") {
    Write-Host "Setting Service Role Key..." -ForegroundColor Yellow
    npx supabase secrets set SERVICE_ROLE_KEY=$serviceRoleKey
}

Write-Host ""
Write-Host "Step 4: Deploying create-checkout-session function..." -ForegroundColor Yellow
npx supabase functions deploy create-checkout-session

Write-Host ""
Write-Host "Step 5: Deploying stripe-webhook function..." -ForegroundColor Yellow
npx supabase functions deploy stripe-webhook

Write-Host ""
Write-Host "===== Deployment Complete! =====" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. If you skipped the service role key, set it with:" -ForegroundColor White
Write-Host "   npx supabase secrets set SERVICE_ROLE_KEY=your_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set up Stripe webhook:" -ForegroundColor White
Write-Host "   - Go to: https://dashboard.stripe.com/test/webhooks" -ForegroundColor Gray
Write-Host "   - Add endpoint: https://voluiferhsehqrlwsjaq.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Gray
Write-Host "   - Select events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted" -ForegroundColor Gray
Write-Host "   - Copy webhook secret and run:" -ForegroundColor Gray
Write-Host "     npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the integration by running: npm run dev" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
