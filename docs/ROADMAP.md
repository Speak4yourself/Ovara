# Ovara Development Roadmap

## ✅ Completed Features

### Website Foundation
- [x] Landing page with hero, features, stats
- [x] Pricing page (3 tiers: Basic/Pro/Premium)
- [x] Features page
- [x] Download page
- [x] Docs/Updates page
- [x] Authentication system (Supabase)
  - [x] Sign up with email verification
  - [x] Login/Logout
  - [x] Password reset
  - [x] Remember me
- [x] Settings page
  - [x] Account details
  - [x] Security (password change)
  - [x] Preferences (dark mode, notifications, language)
  - [x] Subscription display (shows current tier from database)

### Discord Integration
- [x] Discord bot with slash commands
  - [x] `/link` - Generate linking code
  - [x] `/sync` - Manual role sync
  - [x] `/status` - Check account status
  - [x] `/unlink` - Disconnect account
- [x] Account linking system (8-character codes)
- [x] Automatic role assignment (Basic/Pro/Premium)
- [x] Auto-sync every 30 seconds
- [x] Real-time subscription updates on website
- [x] Welcome message in roles channel
- [x] Auto-restore roles for returning members

### Database
- [x] User authentication (Supabase Auth)
- [x] User subscriptions table
- [x] Discord links table
- [x] Discord link codes table
- [x] Row Level Security (RLS) policies

---

## 🚧 To-Do: Payment & Subscription System

### Stripe Integration
- [ ] Set up Stripe account
- [ ] Install Stripe SDK (`npm install stripe @stripe/stripe-js`)
- [ ] Create Stripe products for each tier
  - [ ] Basic: $5/month or $48/year
  - [ ] Pro: $15/month or $144/year
  - [ ] Premium: $29/month or $276/year
- [ ] Implement Stripe Checkout
  - [ ] Checkout page component
  - [ ] Success/Cancel redirects
  - [ ] Handle one-time and recurring payments
- [ ] Create webhook endpoint for Stripe events
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Update user_subscriptions table from Stripe webhooks
- [ ] Add subscription management
  - [ ] View current plan
  - [ ] Upgrade/Downgrade
  - [ ] Cancel subscription
  - [ ] Billing history
  - [ ] Payment method management
- [ ] Handle trial periods (optional)
- [ ] Implement proration for upgrades/downgrades

**Estimated Lines of Code:** ~800-1,000 lines
**Estimated Time:** 2-3 days

---

## 🚧 To-Do: AI Features

### 1. AI Humanizer
**Purpose:** Make AI-generated text sound more natural and human-like

**Requirements:**
- [ ] Choose AI provider (OpenAI, Anthropic, Cohere, etc.)
- [ ] Set up API keys and environment variables
- [ ] Create humanizer service/API
  - [ ] Text input endpoint
  - [ ] Streaming response support
  - [ ] Rate limiting per tier
    - Basic: 10 requests/day
    - Pro: 100 requests/day
    - Premium: Unlimited
- [ ] Build UI for humanizer
  - [ ] Input textarea
  - [ ] "Humanize" button
  - [ ] Output display with copy button
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Character/word count
  - [ ] Before/After comparison view
- [ ] Add usage tracking
  - [ ] Store request count in database
  - [ ] Display usage quota in UI
  - [ ] Block requests when quota exceeded
- [ ] Implement different humanization styles
  - [ ] Casual
  - [ ] Professional
  - [ ] Academic
  - [ ] Creative

**Estimated Lines of Code:** ~600-800 lines
**Estimated Time:** 2-3 days

### 2. AI Detector
**Purpose:** Detect if text was written by AI

**Requirements:**
- [ ] Choose detection service (ZeroGPT API, GPTZero, or build custom)
- [ ] Set up API integration
- [ ] Create detector service/API
  - [ ] Text analysis endpoint
  - [ ] Return confidence score (0-100%)
  - [ ] Highlight suspicious sections
  - [ ] Rate limiting per tier
- [ ] Build UI for detector
  - [ ] Input textarea
  - [ ] "Analyze" button
  - [ ] Results visualization
    - [ ] Confidence meter/gauge
    - [ ] Percentage breakdown
    - [ ] Color-coded highlighting
  - [ ] Detailed report
    - [ ] Sentence-by-sentence analysis
    - [ ] AI likelihood per section
- [ ] Add usage tracking (same as humanizer)

**Estimated Lines of Code:** ~500-700 lines
**Estimated Time:** 2-3 days

### 3. Essay Writer
**Purpose:** Generate essays based on prompts

**Requirements:**
- [ ] AI model integration (GPT-4, Claude, etc.)
- [ ] Create essay writing service
  - [ ] Prompt input
  - [ ] Topic, length, style parameters
  - [ ] Streaming generation
  - [ ] Rate limiting per tier
    - Basic: 5 essays/day
    - Pro: 50 essays/day
    - Premium: Unlimited
- [ ] Build UI for essay writer
  - [ ] Prompt input with templates
  - [ ] Settings panel
    - [ ] Essay length (words/pages)
    - [ ] Writing style
    - [ ] Academic level
    - [ ] Citation style (MLA, APA, Chicago)
  - [ ] Real-time generation display
  - [ ] Edit mode
  - [ ] Save essays to database
  - [ ] Export options (PDF, DOCX, TXT)
- [ ] Essay history/library
  - [ ] View past essays
  - [ ] Search/filter
  - [ ] Delete essays
- [ ] Advanced features
  - [ ] Outline generation
  - [ ] Section-by-section writing
  - [ ] Source citation generator
  - [ ] Plagiarism check integration

**Estimated Lines of Code:** ~1,000-1,500 lines
**Estimated Time:** 3-5 days

### 4. Grammar & Spell Check
**Requirements:**
- [ ] Integrate grammar checking API (LanguageTool, Grammarly API)
- [ ] Real-time error detection
- [ ] Suggestions panel
- [ ] Auto-correct options

**Estimated Lines of Code:** ~400-600 lines
**Estimated Time:** 1-2 days

### 5. Citation Generator
**Requirements:**
- [ ] Support multiple citation styles (MLA, APA, Chicago)
- [ ] Manual entry form
- [ ] URL/ISBN auto-fetch
- [ ] Export bibliography

**Estimated Lines of Code:** ~300-400 lines
**Estimated Time:** 1-2 days

---

## 🚧 To-Do: Control Panel Features

### Saved Essays
- [ ] Database schema for saved essays
  - [ ] Title, content, created_at, updated_at
  - [ ] User association
  - [ ] Folder/tag system
- [ ] CRUD operations
  - [ ] Create new essay
  - [ ] Read/view essays
  - [ ] Update/edit essays
  - [ ] Delete essays
- [ ] UI for essay management
  - [ ] List view with search/filter
  - [ ] Essay editor
  - [ ] Auto-save functionality
  - [ ] Version history

**Estimated Lines of Code:** ~600-800 lines
**Estimated Time:** 2-3 days

### Presets System
- [ ] Database schema for presets
  - [ ] Preset name, settings, type
  - [ ] User association
- [ ] Preset creation/management UI
- [ ] Quick-apply presets
- [ ] Share presets with team (Premium)

**Estimated Lines of Code:** ~400-500 lines
**Estimated Time:** 1-2 days

---

## 🚧 To-Do: Browser Extension

### Chrome Extension
- [ ] Extension manifest (manifest.json)
- [ ] Content scripts
  - [ ] Inject UI into text editors
  - [ ] Detect editable fields
- [ ] Background service worker
  - [ ] API communication
  - [ ] Authentication state
- [ ] Popup UI
  - [ ] Quick access to features
  - [ ] Settings
  - [ ] Usage stats
- [ ] Features integration
  - [ ] Humanizer overlay
  - [ ] AI detector inline
  - [ ] Grammar check as-you-type
  - [ ] Quick essay generation
- [ ] Context menu integration
- [ ] Keyboard shortcuts

**Estimated Lines of Code:** ~1,500-2,000 lines
**Estimated Time:** 5-7 days

### Edge Extension
- [ ] Port Chrome extension to Edge
- [ ] Test compatibility

**Estimated Lines of Code:** ~200-300 lines (mostly config)
**Estimated Time:** 1 day

### Firefox Extension
- [ ] Port Chrome extension to Firefox
- [ ] WebExtensions API compatibility

**Estimated Lines of Code:** ~300-400 lines
**Estimated Time:** 1-2 days

---

## 🚧 To-Do: Admin Dashboard

### Admin Features
- [ ] Admin authentication/authorization
- [ ] User management
  - [ ] View all users
  - [ ] Edit user subscriptions
  - [ ] Ban/suspend users
- [ ] Analytics dashboard
  - [ ] Total users
  - [ ] Active subscriptions
  - [ ] Revenue metrics
  - [ ] Feature usage stats
- [ ] Discord server management
  - [ ] View all linked accounts
  - [ ] Force sync roles
  - [ ] Unlink accounts
- [ ] Support ticket system
  - [ ] View user issues
  - [ ] Respond to tickets
- [ ] Content moderation
  - [ ] Review flagged essays
  - [ ] Abuse detection

**Estimated Lines of Code:** ~1,000-1,500 lines
**Estimated Time:** 3-5 days

---

## 🚧 To-Do: Additional Features

### Email System
- [ ] Welcome emails
- [ ] Email verification
- [ ] Password reset emails
- [ ] Subscription confirmation/receipts
- [ ] Usage limit notifications
- [ ] Newsletter system

**Estimated Lines of Code:** ~400-600 lines
**Estimated Time:** 1-2 days

### API for Third-Party Integrations
- [ ] REST API endpoints
- [ ] API key generation
- [ ] Rate limiting
- [ ] Documentation
- [ ] SDKs (optional)

**Estimated Lines of Code:** ~800-1,000 lines
**Estimated Time:** 2-3 days

### Mobile App (Optional)
- [ ] React Native app
- [ ] iOS version
- [ ] Android version
- [ ] Feature parity with web

**Estimated Lines of Code:** ~3,000-5,000 lines
**Estimated Time:** 2-4 weeks

---

## 📊 Total Estimated Work Remaining

### Code to Write
- **Stripe Integration:** ~900 lines
- **AI Humanizer:** ~700 lines
- **AI Detector:** ~600 lines
- **Essay Writer:** ~1,300 lines
- **Grammar Check:** ~500 lines
- **Citation Generator:** ~350 lines
- **Saved Essays:** ~700 lines
- **Presets:** ~450 lines
- **Chrome Extension:** ~1,750 lines
- **Edge Extension:** ~250 lines
- **Firefox Extension:** ~350 lines
- **Admin Dashboard:** ~1,250 lines
- **Email System:** ~500 lines
- **API:** ~900 lines

**Total New Lines:** ~10,500 lines

### Combined with Current Codebase
- **Current:** 8,602 lines
- **Estimated Final:** ~19,000+ lines of code

### Time Estimate
- **Core Features (Stripe + AI):** 2-3 weeks
- **Extensions:** 1-2 weeks
- **Admin & Polish:** 1 week
- **Testing & Bug Fixes:** 1 week

**Total:** 5-7 weeks of development

---

## 🎯 Recommended Development Order

### Phase 1: Monetization (Week 1-2)
1. Stripe integration
2. Payment flows
3. Subscription management
4. Testing with test mode

### Phase 2: Core AI Features (Week 2-4)
1. AI Humanizer
2. AI Detector
3. Essay Writer
4. Grammar check

### Phase 3: Extensions (Week 4-5)
1. Chrome extension
2. Edge/Firefox ports
3. Extension store submissions

### Phase 4: Admin & Polish (Week 6)
1. Admin dashboard
2. Email system
3. Analytics
4. Bug fixes

### Phase 5: Launch Preparation (Week 7)
1. Final testing
2. Documentation
3. Marketing materials
4. Soft launch

---

## 💡 Next Steps

Would you like to start with:

1. **Stripe Integration** - Get payments working so you can monetize
2. **AI Humanizer** - Build the core product feature
3. **Chrome Extension** - Make it accessible to users

Which would you like to tackle first?
