# Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│                                                              │
│  Navigation: Home | Features | Docs | Download | [Log in]  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Click "Log in"
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION HOME PAGE                        │
│                                                              │
│               Welcome to Ovara                               │
│         Choose an option to continue                         │
│                                                              │
│              ┌──────────────────┐                           │
│              │     Log In       │  ◄─── For existing users  │
│              └──────────────────┘                           │
│                                                              │
│              ┌──────────────────┐                           │
│              │ Create Account   │  ◄─── For new users       │
│              └──────────────────┘                           │
└─────────────────┬───────────────────┬────────────────────────┘
                  │                   │
      Choose      │                   │      Choose
     "Log In"     │                   │  "Create Account"
                  │                   │
                  ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│      LOGIN SCREEN        │  │   CREATE ACCOUNT SCREEN       │
│                          │  │                               │
│  Email: ___________      │  │  Email: ___________           │
│  Password: ________      │  │  Password: ________           │
│                          │  │  Confirm Password: ________   │
│  ☑ Remember me           │  │                               │
│                          │  │  Validates passwords match    │
│  [Forgot password?]      │  │  Minimum 6 characters         │
│                          │  │                               │
│  [Sign in]               │  │  [Create Account]             │
│  [Back]                  │  │  [Back]                       │
└──────┬───────────┬───────┘  └──────────┬────────────────────┘
       │           │                      │
       │           │ Click               │ Account created
       │           │ "Forgot             │
       │           │ password"           ▼
       │           │           ┌──────────────────────────────┐
       │           │           │  EMAIL VERIFICATION SCREEN   │
       │           │           │                              │
       │           │           │  Check your email for        │
       │           │           │  verification link           │
       │           │           │                              │
       │           │           │  [Back to Login]             │
       │           │           │  [Resend verification email] │
       │           │           └──────────┬───────────────────┘
       │           │                      │
       │           │                      │ Click verification
       │           │                      │ link in email
       │           │                      │
       │           │                      ▼
       │           │           ┌──────────────────────────────┐
       │           │           │     EMAIL VERIFIED!          │
       │           │           │                              │
       │           │           │  Success notification shown  │
       │           │           │  → Returns to Auth Home      │
       │           │           └──────────────────────────────┘
       │           │
       │           ▼
       │  ┌──────────────────────────────┐
       │  │  FORGOT PASSWORD SCREEN       │
       │  │                               │
       │  │  Email: ___________           │
       │  │                               │
       │  │  [Send Reset Link]            │
       │  │  [Back to Login]              │
       │  └───────────┬───────────────────┘
       │              │
       │              │ Email sent with
       │              │ reset link
       │              │
       │              ▼
       │  ┌──────────────────────────────┐
       │  │   PASSWORD RESET EMAIL       │
       │  │                               │
       │  │   User clicks link in email  │
       │  │   → Can set new password     │
       │  └──────────────────────────────┘
       │
       │ Successful login
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOGGED IN STATE                           │
│                                                              │
│  Navigation shows user dropdown with:                       │
│  - Home                                                     │
│  - Control Panel                                            │
│  - Community                                                │
│  - Settings                                                 │
│  - Upgrade to Pro                                           │
│  - Sign out                                                 │
│                                                              │
│  Download page accessible                                   │
│  Features page accessible                                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Authentication Home**: Users choose between Login or Create Account
2. **Create Account**: Email + password with confirmation, followed by email verification
3. **Login**: Standard login with remember me option
4. **Forgot Password**: Email-based password reset flow
5. **Email Verification**: Required for new accounts, with resend option
6. **Success Flow**: After verification, users return to auth home and can log in
7. **Signed In**: Full access to all features and user menu

## Data Privacy

- Each user's data is isolated in Supabase
- Row Level Security (RLS) policies ensure users only see their own data
- Authentication is handled securely by Supabase
- Email verification prevents fake accounts
- Password reset requires email access

## Theme Consistency

All authentication screens use:
- Dark background with gradient effects
- Purple/indigo accent colors
- Glass-morphism card designs
- Consistent button styling
- Smooth transitions and animations
