# Ovara Assistant - AI Co-Pilot Browser Extension

**"An AI that sits beside you, not above you."**

## 🚀 What is Ovara Assistant?

Ovara Assistant is a revolutionary AI-powered browser extension that provides an embedded AI co-pilot on any webpage. Unlike traditional AI tools that require you to switch tabs or contexts, Ovara Assistant sits right next to your content, providing real-time AI assistance while you browse, write, and work.

## ✨ Key Features

### 🤖 AI Co-Pilot Sidebar
- **Always Accessible**: Toggle the assistant with `Ctrl+Space` (or `Cmd+Space` on Mac)
- **Context-Aware**: Select text from any webpage to give Ovara context
- **Persistent**: The sidebar stays open as you navigate, providing continuous assistance

### ⚡ Quick Actions
- **Rewrite**: Improve and refine your text
- **Summarize**: Get concise summaries of long content
- **Humanize**: Make AI-generated text sound natural
- **Detect AI**: Analyze if text was written by AI
- **Grammar Check**: Fix grammar and spelling errors
- **Expand**: Add more details and depth to your writing

### 🎯 Smart Features
- **Page Context Integration**: Select text from the page to provide context for AI requests
- **Permission-Based Editing**: Secure, user-controlled text insertion
- **Tier-Based Limits**: Fair usage limits based on your subscription
- **Seamless UX**: Beautiful, theme-matched interface

## 📋 How to Use

### Activating Ovara Assistant

1. **From Extension Popup**:
   - Click the Ovara extension icon
   - Click "Ovara Assistant" card
   - The sidebar will appear on the right side of your page

2. **Using Keyboard Shortcut**:
   - Press `Ctrl+Space` (Windows/Linux)
   - Press `Cmd+Space` (Mac)
   - Toggle the sidebar on/off instantly

### Using Quick Actions

1. **Select text** on the webpage you want to work with
2. Click the "Select Text from Page" button in the assistant
3. The selected text will appear in the context area
4. Choose a quick action button (Rewrite, Summarize, etc.)
5. The prompt will auto-fill with your request
6. Click "Generate" to get AI-powered results

### Custom Prompts

1. Type your custom request in the prompt box
2. Examples:
   - "Rewrite this paragraph to be more professional"
   - "Summarize the main points from this article"
   - "Check this for grammar errors and fix them"
   - "Make this text sound more human and conversational"
3. Click "Generate"
4. Copy the result or insert it directly into the page

### Inserting Results

1. After generating a response, click "Insert into Page"
2. Grant permission when prompted
3. Click on any text field on the page
4. The generated text will be inserted automatically

## 🎨 Theme Matching

Ovara Assistant automatically matches your website's theme:
- **Dark Mode**: Sleek dark interface with indigo accents
- **Light Mode**: Clean, bright interface (coming soon)
- Consistent with Ovara's brand identity

## 💎 Subscription Tiers

### Free Tier
- **10 requests per day**
- Access to all basic features
- Perfect for trying out Ovara Assistant

### Pro Tier ($14.99/month)
- **500 requests per day**
- Priority processing
- Advanced humanization features
- Custom typing profiles

### Premium Tier ($29.99/month)
- **Unlimited requests**
- GPT-4 powered responses
- Advanced AI detection
- Bypass AI detectors
- Priority support
- Discord VIP role
- Early access to features

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Toggle Assistant | `Ctrl+Space` | `Cmd+Space` |
| Open Extension | Click icon | Click icon |

## 🔒 Privacy & Permissions

### What Ovara Assistant Can Do:
- ✅ Read selected text (only when you explicitly select it)
- ✅ Insert text into fields (only with your permission)
- ✅ Access your Ovara account for tier verification

### What Ovara Assistant Cannot Do:
- ❌ Read your browsing history
- ❌ Access your personal data without permission
- ❌ Track your activity across websites
- ❌ Modify pages without your consent

## 🛠️ Technical Architecture

### Components

1. **`assistant-sidebar.html`**: The main UI for the sidebar
2. **`assistant-sidebar.js`**: Core logic for user interactions
3. **`content.js`**: DOM injection and text selection handling
4. **`background.js`**: Message routing and API calls
5. **`popup.js`**: Extension popup interface

### Data Flow

```
User Action → Content Script → Background Script → Supabase API → OpenAI → Response → UI
```

### API Integration

The extension communicates with:
- **Supabase**: Authentication and user management
- **OpenAI API**: AI text generation (via Supabase Edge Functions)
- **Rate Limiting**: Tier-based request tracking

## 🎯 Competitive Advantages

### vs. Atlas Browser
- ✅ Works in ANY browser (Chrome, Edge, Brave, etc.)
- ✅ Lightweight extension vs. full browser install
- ✅ More affordable pricing
- ✅ Better AI models

### vs. Grammarly
- ✅ Full AI writing capabilities, not just grammar
- ✅ AI detection and humanization features
- ✅ Context-aware assistance
- ✅ Custom prompts and actions

### vs. ChatGPT Browser Extension
- ✅ Embedded sidebar (no tab switching)
- ✅ Direct text insertion into pages
- ✅ Writing-focused features
- ✅ Academic and professional use cases

## 📈 Future Roadmap

### Phase 1 (Current)
- [x] Basic sidebar UI
- [x] Quick action buttons
- [x] Text selection integration
- [x] OpenAI API integration

### Phase 2 (Next 2 weeks)
- [ ] Voice input support
- [ ] Memory/session persistence
- [ ] Custom tone presets
- [ ] Real-time collaboration features

### Phase 3 (Next month)
- [ ] Plugin system for custom actions
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features

### Phase 4 (Future)
- [ ] Mobile app integration
- [ ] Offline mode with local LLMs
- [ ] Custom model fine-tuning
- [ ] Enterprise features

## 🐛 Troubleshooting

### Assistant Won't Open
- Make sure you're logged in to your Ovara account
- Try reloading the page
- Check if another extension is conflicting

### Text Selection Not Working
- Click "Select Text from Page" first
- Then select the text you want to use
- The selection should appear in the context area

### Generate Button Not Working
- Ensure you're logged in
- Check your daily request limit
- Verify your internet connection

### Text Insertion Failing
- Click "Insert into Page" and grant permission
- Make sure a text field is focused/active
- Some websites may block automatic text insertion

## 💬 Support

- **Discord**: Join our community at [discord.gg/ovara](https://discord.gg/ovara)
- **Email**: support@ovara.app
- **Website**: [ovara.app](https://ovara.app)
- **Documentation**: Full docs at [docs.ovara.app](https://docs.ovara.app)

## 📄 License

Ovara Assistant is proprietary software owned by Ovara.
© 2025 Ovara. All rights reserved.

## 🙏 Credits

Built with:
- React/Vanilla JS
- Supabase
- OpenAI API
- Chrome Extension APIs

---

**Ready to enhance your writing with AI?**
[Install Ovara Extension →](https://chrome.google.com/webstore)

**Questions?**
[Join our Discord](https://discord.gg/ovara) | [Read the Docs](https://docs.ovara.app) | [Visit Website](https://ovara.app)
