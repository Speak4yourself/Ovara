# Ovara Project Structure

## 📁 Root Directories

```
ovara/
├── src/                    # React frontend source code
├── backend/                # Backend services (if any)
├── discord-bot/            # Discord bot integration
├── email-templates/        # HTML email templates for auth flows
├── supabase/              # Supabase configuration and migrations
├── sql/                   # SQL scripts and database utilities
├── scripts/               # Deployment and utility scripts
├── docs/                  # Project documentation
├── frontend/              # Additional frontend assets (if any)
├── dist/                  # Build output directory
└── node_modules/          # NPM dependencies
```

## 📄 Key Files

### Configuration
- `.env` - Environment variables (not tracked)
- `.env.example` - Environment variable template
- `package.json` - Node.js dependencies and scripts
- `vite.config.js` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `vercel.json` - Vercel deployment configuration

### Frontend
- `index.html` - Main HTML entry point
- `src/App.jsx` - Main React application component
- `src/supabaseClient.js` - Supabase client configuration
- `src/stripeConfig.js` - Stripe pricing configuration

### Documentation (`docs/`)
- `setup/` - Setup guides
  - `SUPABASE_SETUP.md` - Supabase configuration guide
  - `STRIPE_SETUP_GUIDE.md` - Stripe integration guide
  - `DATABASE_FIX.md` - Database troubleshooting
- `deployment/` - Deployment documentation
  - `DEPLOYMENT_COMMANDS.md` - Deployment instructions
- `FOLDER_ORGANIZATION.md` - This file

### SQL Scripts (`sql/`)
- `CREATE_TABLES.sql` - Database table creation scripts
- `GET_USER_COUNT.sql` - User count function

### Scripts (`scripts/`)
- `deploy-supabase.bat` - Windows deployment script
- `deploy-supabase.ps1` - PowerShell deployment script
- `temp-deploy.bat` - Temporary deployment script

### Email Templates (`email-templates/`)
- `confirm-signup.html` - Email verification template
- `invite-user.html` - User invitation template
- `magic-link.html` - Passwordless login template
- `change-email.html` - Email change confirmation
- `reset-password.html` - Password reset template
- `reauthentication.html` - Identity verification template

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Fill in your Supabase and Stripe credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📦 Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Deployment:** Vercel
- **Bot:** Discord.js

## 🔗 Important Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
