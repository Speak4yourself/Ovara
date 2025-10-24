# Admin Dashboard Access Guide

## How to Access the Admin Dashboard

Once you're logged in and have admin permissions:

1. **Click your username** in the top-right corner
2. **Click "⚡ Admin"** in the dropdown menu
3. You'll be taken to the Admin Dashboard

## How to Grant Admin Access to Your Account

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `scripts/make-admin.sql` from this project
4. **Replace `YOUR_EMAIL_HERE`** with your actual email address (the one you used to sign up)
5. **Run the SQL query**
6. Refresh your Ovara website and you should now have admin access

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/Ovara

# Run the SQL script (after editing it with your email)
supabase db push --file scripts/make-admin.sql
```

### Option 3: Manual Database Insert

1. Go to Supabase Dashboard → **Table Editor**
2. Find the `auth.users` table and copy your `id` (UUID)
3. Go to the `admin_users` table
4. Click **Insert** and fill in:
   - `user_id`: Your UUID from step 2
   - `role`: `super_admin`
   - `permissions`: `["all"]`
   - Click **Save**

## Admin Roles

- **super_admin**: Full access to everything
- **admin**: Standard admin access
- **support**: Limited access for support staff
- **moderator**: Content moderation access

## Admin Dashboard Features

Once you have admin access, you can:

✅ **Accounts Tab**: View and manage all user accounts
✅ **Memberships Tab**: View and modify user subscriptions
✅ **Discount Codes Tab**: Create and manage discount codes
✅ **Statistics Tab**: View system-wide analytics

## Troubleshooting

**"Access Denied" message?**
- Make sure you ran the SQL script with YOUR email
- Check that the `admin_users` table exists in your database
- Verify the entry was created:
  ```sql
  SELECT * FROM admin_users WHERE user_id = 'YOUR_USER_ID';
  ```

**Admin link not showing in menu?**
- Make sure you're logged in
- Refresh the page after becoming an admin
- Check browser console for errors

**Need help?**
- Check Supabase logs for errors
- Verify database schema is up to date
- Make sure RLS policies allow access to `admin_users` table
