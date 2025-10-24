# 💻 Ovara Desktop App - AI-Enhanced Search

Electron desktop application for Windows, Mac, and Linux.

---

## ✨ Features

- 🔍 **Powerful Search** - Multi-provider results
- 🤖 **AI Answers** - GPT-4 powered responses
- 💬 **Slide-Out Chat** - ChatGPT-style assistant
- ⚡ **Fast & Native** - Runs as native app
- 🎨 **Beautiful UI** - Modern, clean design
- 📚 **Search History** - Track your searches
- ⚙️ **Settings** - Customize your experience

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd desktop-app
npm install
```

### 2. Configure API URL

Edit `renderer.js` and change the API_URL:

```javascript
const API_URL = 'https://your-backend.railway.app/api';
```

### 3. Run the App

```bash
npm start
```

The Ovara Search app will launch!

---

## 🏗️ Building for Distribution

### Build for Windows

```bash
npm run build:win
```

Output: `dist/Ovara Search Setup.exe`

### Build for Mac

```bash
npm run build:mac
```

Output: `dist/Ovara Search.dmg`

### Build for Linux

```bash
npm run build:linux
```

Output: `dist/Ovara Search.AppImage` and `.deb`

### Build for All Platforms

```bash
npm run build:all
```

---

## 🎨 UI Overview

### Main Window
- **Header**: Logo, settings, history buttons
- **Search Bar**: Large, centered search input
- **Results Area**: AI answer card + search results
- **Floating Button**: Opens AI chat (bottom right)

### Chat Panel
- **Slides in from right** (400px wide)
- Message history
- Text input with auto-resize
- Send button

### Features
- Click results to open in browser
- Smooth animations
- Keyboard shortcuts
- Dark theme

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus search | `Ctrl/Cmd + F` |
| Search | `Enter` |
| Open chat | `Ctrl/Cmd + K` |
| Close chat | `Esc` |
| New search | `Ctrl/Cmd + N` |

---

## 🔧 Configuration

### Update Backend URL

In `renderer.js`:
```javascript
const API_URL = 'https://your-backend.railway.app/api';
```

### Customize Window Size

In `main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1200,  // Change width
  height: 800,  // Change height
  ...
});
```

### Change App Icon

Replace these files in `assets/`:
- `icon.ico` (Windows)
- `icon.icns` (Mac)
- `icon.png` (Linux)

---

## 📊 Technical Specs

### Technologies
- **Framework**: Electron 28+
- **UI**: HTML/CSS/JavaScript
- **Storage**: electron-store
- **HTTP**: axios

### Performance
- **App size**:
  - Windows: ~150MB
  - Mac: ~200MB
  - Linux: ~120MB
- **Memory**: ~100MB
- **Startup**: < 2 seconds

### Supported Platforms
- ✅ Windows 10/11 (64-bit)
- ✅ macOS 10.14+ (Intel & Apple Silicon)
- ✅ Linux (Ubuntu 20.04+, Fedora 35+)

---

## 🎯 Features Roadmap

### Current Version (1.0.0)
- [x] Search functionality
- [x] AI answers
- [x] Chat interface
- [x] Result display
- [x] External link opening

### Planned Features
- [ ] Search history with date filters
- [ ] Bookmarks
- [ ] Multiple tabs
- [ ] Download manager
- [ ] Extensions support
- [ ] Custom themes
- [ ] Keyboard shortcuts customization
- [ ] Auto-update
- [ ] Screenshot tool
- [ ] Note-taking

---

## 🐛 Troubleshooting

### App won't start

```bash
rm -rf node_modules
npm install
npm start
```

### Build fails

```bash
npm install electron-builder --save-dev
npm run build:win
```

### White screen on launch

Check `renderer.js` console for errors:
- Open DevTools: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)

---

## 📦 Distribution

### Code Signing (Important!)

#### Windows
```bash
# Get a code signing certificate
# Set environment variables
set CSC_LINK=path/to/certificate.pfx
set CSC_KEY_PASSWORD=your_password
npm run build:win
```

#### Mac
```bash
# Join Apple Developer Program ($99/year)
# Create certificates in Xcode
# Build will auto-sign
npm run build:mac
```

### Auto-Update Setup

Use `electron-updater` for automatic updates:

```bash
npm install electron-updater
```

Add to `main.js`:
```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## 🔐 Security

### Content Security Policy

Already configured in the app with secure defaults.

### Safe External Links

All external links open in default browser, not within the app.

### No Node Integration in Renderer

For better security, consider disabling `nodeIntegration` and using `contextBridge`.

---

## 📈 Analytics (Optional)

To add usage analytics:

```bash
npm install electron-google-analytics
```

Then track searches, clicks, etc.

---

## 🎨 Customization

### Change Theme

Edit `styles.css`:

```css
:root {
  --bg-color: #0b0c10;
  --surface-color: #1f2833;
  --accent-color: #6366f1;
  --text-color: #c5c6c7;
  --highlight-color: #66fcf1;
}
```

### Add Menu Bar

In `main.js`:

```javascript
const { Menu } = require('electron');

const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { label: 'New Search', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
    ]
  }
]);

Menu.setApplicationMenu(menu);
```

---

## 🌐 Publishing

### Microsoft Store (Windows)

1. Create Microsoft Partner account
2. Reserve app name
3. Build MSIX package
4. Submit for certification

### Mac App Store

1. Enroll in Apple Developer Program
2. Create app in App Store Connect
3. Build and notarize
4. Submit for review

### Snap Store (Linux)

```bash
snapcraft
snapcraft upload ovara-search_1.0.0_amd64.snap
```

---

## 📄 License

Proprietary - All rights reserved © Ovara 2025

---

## 🆘 Support

- **Email**: support@ovara.app
- **Website**: ovara.app
- **Issues**: Report bugs via email

---

## 💡 Development Tips

### Enable DevTools in Production

In `main.js`:
```javascript
mainWindow.webContents.openDevTools();
```

### Hot Reload (Development)

```bash
npm install electron-reload
```

Add to `main.js`:
```javascript
require('electron-reload')(__dirname);
```

---

**Built with Electron ⚡**

*Native desktop experience with web technologies*
