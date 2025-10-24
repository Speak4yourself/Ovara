# Ovara Folder Organization Plan

## Current Structure (Messy)
```
Ovara/
├── .env
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── supabaseClient.js
├── discord-bot/
│   ├── src/index.js
│   ├── .env
│   ├── package.json
│   └── [docs]
├── AUTH_FLOW_DIAGRAM.md
├── DISCORD_BOT_SETUP.md
├── DISCORD_INTEGRATION_COMPLETE.md
├── IMPLEMENTATION_SUMMARY.md
├── ROADMAP.md
├── README.md
├── package.json
└── [config files]
```

## Proposed Structure (Clean & Organized)

```
Ovara/
├── 📁 frontend/                    # Website/Web App
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Toast.jsx
│   │   ├── 📁 pages/               # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── FeaturesPage.jsx
│   │   │   ├── PricingPage.jsx
│   │   │   ├── DownloadPage.jsx
│   │   │   ├── DocsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── ControlPanelPage.jsx
│   │   ├── 📁 services/            # API & service functions
│   │   │   ├── supabaseClient.js
│   │   │   ├── authService.js
│   │   │   ├── discordService.js
│   │   │   ├── stripeService.js
│   │   │   └── aiService.js
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSubscription.js
│   │   │   └── useDiscord.js
│   │   ├── 📁 utils/               # Utility functions
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   ├── 📁 assets/              # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── .env                        # Frontend environment variables
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── 📁 backend/                     # Backend services
│   ├── 📁 discord-bot/             # Discord bot
│   │   ├── 📁 src/
│   │   │   ├── index.js
│   │   │   ├── commands/
│   │   │   │   ├── link.js
│   │   │   │   ├── sync.js
│   │   │   │   ├── status.js
│   │   │   │   └── unlink.js
│   │   │   ├── services/
│   │   │   │   ├── supabaseService.js
│   │   │   │   └── roleService.js
│   │   │   └── utils/
│   │   │       └── logger.js
│   │   ├── .env
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── 📁 api/                     # Backend API (future)
│   │   ├── 📁 routes/
│   │   │   ├── auth.js
│   │   │   ├── subscriptions.js
│   │   │   ├── ai.js
│   │   │   └── webhooks.js
│   │   ├── 📁 controllers/
│   │   ├── 📁 middleware/
│   │   ├── server.js
│   │   ├── .env
│   │   └── package.json
│   │
│   └── 📁 database/                # Database files
│       ├── schema.sql              # Full database schema
│       ├── migrations/
│       │   ├── 001_initial.sql
│       │   ├── 002_discord_integration.sql
│       │   └── 003_subscriptions.sql
│       ├── seeds/
│       │   └── test_data.sql
│       └── triggers/
│           └── webhook-trigger.sql
│
├── 📁 extensions/                  # Browser extensions
│   ├── 📁 chrome/
│   │   ├── manifest.json
│   │   ├── 📁 src/
│   │   │   ├── popup/
│   │   │   ├── content/
│   │   │   └── background/
│   │   └── README.md
│   ├── 📁 edge/
│   └── 📁 firefox/
│
├── 📁 docs/                        # Documentation
│   ├── 📁 setup/
│   │   ├── INSTALLATION.md
│   │   ├── DISCORD_BOT_SETUP.md
│   │   └── STRIPE_SETUP.md
│   ├── 📁 guides/
│   │   ├── AUTH_FLOW_DIAGRAM.md
│   │   ├── DISCORD_INTEGRATION_COMPLETE.md
│   │   └── API_DOCUMENTATION.md
│   ├── 📁 architecture/
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   ├── DATABASE_SCHEMA.md
│   │   └── SYSTEM_ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── CONTRIBUTING.md
│
├── 📁 scripts/                     # Utility scripts
│   ├── deploy.sh
│   ├── database-reset.sh
│   └── test.sh
│
├── 📁 tests/                       # Tests
│   ├── 📁 frontend/
│   ├── 📁 backend/
│   └── 📁 e2e/
│
├── .gitignore
├── README.md                       # Main project README
├── LICENSE
└── package.json                    # Root package.json (workspace)
```

---

## Step-by-Step Migration Plan

### Phase 1: Create New Folder Structure (No Bot Restart Needed)

```bash
# Create all new directories
mkdir -p frontend/src/{components,pages,services,hooks,utils,assets/{images,icons,fonts}}
mkdir -p backend/api/{routes,controllers,middleware}
mkdir -p backend/database/{migrations,seeds,triggers}
mkdir -p extensions/{chrome,edge,firefox}
mkdir -p docs/{setup,guides,architecture}
mkdir -p scripts
mkdir -p tests/{frontend,backend,e2e}
```

### Phase 2: Move Documentation (Safe to do now)

```bash
# Move docs
mv AUTH_FLOW_DIAGRAM.md docs/guides/
mv DISCORD_BOT_SETUP.md docs/setup/
mv DISCORD_INTEGRATION_COMPLETE.md docs/guides/
mv IMPLEMENTATION_SUMMARY.md docs/architecture/
mv ROADMAP.md docs/

# Move discord-bot docs
mv discord-bot/README.md docs/setup/DISCORD_BOT_README.md
mv discord-bot/QUICKSTART.md docs/setup/DISCORD_BOT_QUICKSTART.md
mv discord-bot/WEBHOOK_SETUP.md docs/setup/WEBHOOK_SETUP.md
```

### Phase 3: Organize Database Files (Safe to do now)

```bash
# Move database files
cp discord-bot/database-schema.sql backend/database/schema.sql
cp discord-bot/webhook-trigger.sql backend/database/triggers/webhook-trigger.sql
```

### Phase 4: Move Discord Bot (Requires Bot Restart)

**Stop the bot first!**

```bash
# Stop discord bot processes
# Then:
mv discord-bot backend/discord-bot

# Update any import paths if needed
# Restart the bot from new location:
cd backend/discord-bot && npm start
```

### Phase 5: Reorganize Frontend (Requires Dev Server Restart)

**Stop the dev server first!**

```bash
# Create component files (extract from App.jsx)
# Move services
mv src/supabaseClient.js frontend/services/

# Move src to frontend
mv src frontend/src

# Update vite.config.js if needed
# Restart: npm run dev
```

### Phase 6: Update Configuration Files

#### Update `vite.config.js`:
```javascript
export default {
  root: 'frontend',
  // ... other config
}
```

#### Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "cd frontend && vite",
    "build": "cd frontend && vite build",
    "bot": "cd backend/discord-bot && npm start"
  }
}
```

---

## Benefits of This Organization

### 1. **Scalability**
- Easy to add new features in the right place
- Clear separation of concerns
- Each service can be deployed independently

### 2. **Maintainability**
- Find files quickly
- Understand project structure at a glance
- New developers can onboard faster

### 3. **Best Practices**
- Follows industry-standard folder structure
- Separates frontend, backend, and extensions
- Documentation is organized and accessible

### 4. **Future-Proof**
- Room for API server
- Room for mobile apps
- Room for desktop apps
- Easy to add CI/CD pipelines

---

## Current vs. Proposed Comparison

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Frontend** | `src/` (3 files) | `frontend/src/` (organized) |
| **Backend** | `discord-bot/` | `backend/discord-bot/`, `backend/api/` |
| **Database** | Mixed in bot folder | `backend/database/` |
| **Docs** | Root folder (5 .md files) | `docs/` (organized by type) |
| **Extensions** | Not started | `extensions/` (ready) |
| **Tests** | None | `tests/` (ready) |

---

## When to Reorganize

### ⚠️ Important Notes:
1. **Stop all running processes first** (dev server, discord bot)
2. **Test after each phase** to ensure nothing breaks
3. **Update all import paths** in your code
4. **Update configuration files** (vite.config.js, package.json)
5. **Commit to git** before starting (safety!)

### Recommended Time:
- **Before** adding Stripe integration (clean start)
- **Before** building AI features (organized workspace)
- When you have 30-60 minutes of uninterrupted time

---

## Quick Start After Reorganization

```bash
# Frontend
cd frontend
npm install
npm run dev

# Discord Bot
cd backend/discord-bot
npm install
npm start

# API (when built)
cd backend/api
npm install
npm start
```

---

## Files to Update After Reorganization

### Frontend Files:
- [ ] `frontend/src/main.jsx` - Update import paths
- [ ] `frontend/src/App.jsx` - Update service imports
- [ ] `frontend/vite.config.js` - Update root path
- [ ] `frontend/index.html` - Check script paths

### Backend Files:
- [ ] `backend/discord-bot/src/index.js` - Update database paths
- [ ] `backend/discord-bot/.env` - No changes needed

### Root Files:
- [ ] `package.json` - Update scripts
- [ ] `.gitignore` - Add new folders if needed
- [ ] `README.md` - Update folder structure documentation

---

Would you like me to help you reorganize now, or should we wait until after you stop the running services?
