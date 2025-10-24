# Ovara Browser Extension

A powerful Chrome/Edge browser extension for the Ovara AI Writing Assistant platform. Features include authentication, auto-typing, and quick access to all Ovara features.

---

## 🎯 Features

### ⌨️ **Auto-Typer**
- Type text automatically into any input field on any website
- Adjustable typing speed (10-120 WPM)
- Natural typing with random variations
- Works on:
  - Text inputs (`<input type="text">`)
  - Textareas (`<textarea>`)
  - Content-editable elements
  - Email fields, search boxes, and more

### 🔐 **Secure Authentication**
- Login directly from the extension
- Syncs with your Ovara web account
- Session persistence
- View your subscription tier

### ✨ **Quick Access**
- One-click access to:
  - Humanizer
  - Citation Generator
  - AI Detector
  - Essay Generator
- Right-click context menu integration

### 🎨 **Beautiful UI**
- Modern gradient design
- Smooth animations
- Responsive interface
- Clean and intuitive

---

## 📦 Installation

### Option 1: Chrome Web Store (When Published)
1. Visit Chrome Web Store
2. Search for "Ovara"
3. Click "Add to Chrome"

### Option 2: Local Development
1. **Download/Clone the extension:**
   ```bash
   cd browser-extension
   ```

2. **Configure Supabase credentials:**
   - Open `popup.js`
   - Replace `YOUR_SUPABASE_URL` with your Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

3. **Create extension icons:**
   - Place icons in `icons/` folder:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)

4. **Load extension in Chrome:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `browser-extension` folder

5. **Pin the extension:**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Ovara"
   - Click the pin icon

---

## 🚀 Usage

### Login
1. Click the Ovara extension icon
2. Enter your email and password
3. Click "Sign In"

Your session will be saved and persist across browser restarts.

### Auto-Typer

**Method 1: From Extension Popup**
1. Click the Ovara extension icon
2. Click "Auto-Typer"
3. Paste or type your text
4. Adjust typing speed (slider)
5. Click "Start Auto-Type"
6. Click any text field on the page
7. Watch it type automatically!

**Method 2: Right-Click Menu**
1. Select text on any webpage
2. Right-click
3. Choose "Auto-Type This Text"
4. Click any text field

**Method 3: From Humanizer**
1. Humanize text in the web app
2. Copy result
3. Use auto-typer to paste it naturally

### Quick Access Features
- Click any feature card to open it in a new tab
- Your login session is shared with the web app

---

## ⚙️ Configuration

### Supabase Setup

In `popup.js`, update these constants:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Get these from your Supabase project dashboard:
1. Go to Settings → API
2. Copy "Project URL" → Use as `SUPABASE_URL`
3. Copy "anon public" key → Use as `SUPABASE_ANON_KEY`

### Web App URLs

Update these URLs in the extension files:

**In `popup.js`:**
```javascript
humanizerBtn.addEventListener('click', () => {
  window.open('https://your-app-url.com/humanizer', '_blank');
});
```

**In `background.js`:**
```javascript
chrome.tabs.create({
  url: `https://your-app-url.com/humanizer?text=${encodeURIComponent(selectedText)}`
});
```

Replace `your-app-url.com` with your actual domain.

---

## 🎨 Customization

### Icons

Place your custom icons in the `icons/` folder:

```
browser-extension/
  icons/
    icon16.png   (16x16 pixels)
    icon48.png   (48x48 pixels)
    icon128.png  (128x128 pixels)
```

**Icon Guidelines:**
- Use PNG format with transparent background
- 16px: Toolbar icon (small)
- 48px: Extension management page
- 128px: Chrome Web Store listing

**Design Tips:**
- Use your brand colors (#667eea, #764ba2)
- Keep it simple and recognizable
- Test on light and dark backgrounds

### Colors

Main gradient:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Tier badges:
- **Free**: Default (white transparent)
- **Basic**: Blue `#3b82f6 → #06b6d4`
- **Pro**: Purple `#8b5cf6 → #ec4899`
- **Premium**: Gold `#ffd700 → #ffed4e`

---

## 🔧 Development

### File Structure

```
browser-extension/
├── manifest.json         # Extension configuration
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic & authentication
├── content.js           # Auto-typer content script
├── content.css          # Content script styles
├── background.js        # Background service worker
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Key Files

**manifest.json**
- Extension metadata
- Permissions
- Content scripts configuration

**popup.html/js**
- Extension popup interface
- Authentication logic
- Feature navigation

**content.js**
- Injected into all web pages
- Handles auto-typing
- Shows overlay UI

**background.js**
- Service worker (always running)
- Context menu integration
- Badge notifications

### Testing

1. **Test Login:**
   - Try valid credentials
   - Try invalid credentials
   - Check session persistence

2. **Test Auto-Typer:**
   - Test on different input types
   - Test speed variations
   - Test cancel functionality
   - Test ESC key cancellation

3. **Test on Different Sites:**
   - Google Docs
   - Gmail
   - WordPress
   - Social media platforms

### Debugging

**View Console Logs:**
- Popup: Right-click extension icon → Inspect
- Content script: F12 on any webpage → Console
- Background: `chrome://extensions/` → Background page → Inspect

**Common Issues:**

1. **"Session undefined" error:**
   - Check Supabase credentials
   - Verify API keys are correct

2. **Auto-typer not working:**
   - Check content script is injected
   - Verify permissions in manifest

3. **CORS errors:**
   - Add your extension ID to Supabase allowed origins
   - Check `host_permissions` in manifest

---

## 📝 Permissions Explained

The extension requires these permissions:

- **`storage`**: Save login session and preferences
- **`activeTab`**: Inject auto-typer into current tab
- **`scripting`**: Execute content scripts
- **`host_permissions`**: Access websites for auto-typing
- **`notifications`** (optional): Show completion notifications

All permissions are used solely for extension functionality. No data is collected or shared with third parties.

---

## 🚀 Publishing

### Chrome Web Store

1. **Prepare assets:**
   - Create high-quality screenshots (1280x800 or 640x400)
   - Design promotional images
   - Write compelling description

2. **Create developer account:**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 registration fee

3. **Upload extension:**
   - Zip the `browser-extension` folder
   - Upload to developer dashboard
   - Fill out store listing
   - Submit for review

4. **Review process:**
   - Usually takes 1-3 days
   - Address any feedback
   - Publish when approved

### Edge Add-ons

Same process through [Microsoft Edge Add-ons Dashboard](https://partner.microsoft.com/dashboard/microsoftedge).

---

## 🔒 Security

- **No sensitive data stored:** Only session tokens in encrypted Chrome storage
- **Secure authentication:** Uses Supabase Auth with JWT tokens
- **HTTPS only:** All API calls use HTTPS
- **Minimal permissions:** Only requests necessary permissions
- **Open source:** Code is transparent and auditable

---

## 🎯 Roadmap

### Planned Features

- [ ] **Offline mode** - Cache text for later auto-typing
- [ ] **Templates** - Save frequently used text snippets
- [ ] **Keyboard shortcuts** - Quick access via hotkeys
- [ ] **Citation quick-add** - Generate citations from context menu
- [ ] **AI detection on selection** - Right-click to detect AI
- [ ] **Usage statistics** - View your tier limits in extension
- [ ] **Dark mode** - Match browser theme
- [ ] **Multi-language** - Support for multiple languages

### Future Enhancements

- [ ] **Chrome Sync** - Sync settings across devices
- [ ] **Voice typing** - Speak to auto-type
- [ ] **Smart paste** - Auto-format pasted text
- [ ] **Custom themes** - Personalize extension appearance

---

## 📞 Support

- **Documentation:** [docs.ovara.com](https://docs.ovara.com)
- **Web App:** [app.ovara.com](https://app.ovara.com)
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Email:** support@ovara.com

---

## 📄 License

Copyright © 2025 Ovara. All rights reserved.

---

## 🙏 Credits

Built with:
- Chrome Extension Manifest V3
- Supabase for authentication
- Vanilla JavaScript (no frameworks!)
- Love and coffee ☕

---

**Version:** 1.0.0
**Last Updated:** October 17, 2025
**Compatible With:** Chrome 88+, Edge 88+
