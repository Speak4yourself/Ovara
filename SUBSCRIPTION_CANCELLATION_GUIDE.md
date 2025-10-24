# Subscription Cancellation Feature

## Overview
Users can now cancel their subscriptions directly from the Settings page. The cancel button is intentionally subtle (small, low-opacity text) to blend in with the background and not be immediately obvious.

## Features Implemented

### 1. Cancel Subscription Button in Settings
- **Location**: Settings → Subscription tab
- **Appearance**: Small, subtle text link at the bottom (blends with background)
- **Conditions**: Only shows when:
  - User has an active subscription
  - Subscription tier is not "free"
  - User has a valid Stripe subscription ID

### 2. Admin Dashboard
The Admin Dashboard already has full access to:
- **Accounts Tab**: View all users, search by email/ID, delete accounts
- **Memberships Tab**: View and modify user subscriptions, change tiers and status
- **Discount Codes Tab**: Create, manage, and track discount codes
- **Statistics Tab**: System-wide analytics

The "⚡ Admin" link appears in the user dropdown menu only for users who have admin permissions.

## Deployment Instructions

### Step 1: Deploy the Cancel Subscription Edge Function

```bash
# Make sure you're in the project directory
cd C:\Users\hopla\OneDrive\Documents\GitHub\Ovara

# Deploy the new Edge Function
supabase functions deploy cancel-subscription

# Or deploy all functions at once
supabase functions deploy
```

### Step 2: Set Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Environment Variables
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
SUPABASE_URL=https://voluiferhsehqrlwsjaq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Update Database Schema (if needed)

Make sure the `user_subscriptions` table has these columns:
- `cancel_at_period_end` (boolean)
- `canceled_at` (timestamp)

If not, run this SQL:

```sql
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
```

## How It Works

### For Users:
1. Go to **Settings** → **Subscription** tab
2. At the bottom, you'll see a small "Cancel subscription" link (very subtle)
3. Click it and confirm
4. Subscription will be canceled at the end of the current billing period
5. User keeps access until the period ends

### For Admins:
1. Login with admin account
2. Click username → "⚡ Admin" in dropdown
3. Access to 4 tabs:
   - **Accounts**: View/delete user accounts
   - **Memberships**: Modify user subscription tiers and status
   - **Discount Codes**: Create/manage promo codes
   - **Statistics**: View system stats

## Security Notes

- ✅ Cancel button only shows for authenticated users with active subscriptions
- ✅ Edge Function verifies user owns the subscription before canceling
- ✅ Stripe API calls are made server-side (not exposed to frontend)
- ✅ All requests require valid Supabase auth token
- ✅ Admin access is verified against `admin_users` table

## Testing

To test the cancel subscription feature:

1. Create a test subscription (use Stripe test mode)
2. Login with that account
3. Go to Settings → Subscription
4. Look for the subtle "Cancel subscription" link at the bottom
5. Click and confirm
6. Check that:
   - Subscription is canceled in Stripe dashboard
   - Database status is updated to "canceled"
   - User still has access until period end

## Troubleshooting

**Cancel button not showing?**
- Check that user has an active subscription
- Verify `stripe_subscription_id` exists in database
- Make sure subscription tier is not "free"

**Cancellation fails?**
- Check Supabase Edge Function logs
- Verify Stripe secret key is set correctly
- Check that subscription ID is valid in Stripe dashboard
- Ensure database permissions allow updates

**Admin link not showing?**
- Run `scripts/make-admin.sql` with your email
- Check `admin_users` table for your user ID
- Refresh the page after becoming admin
