# Quick Setup Guide - Ovara Browser Extension

Get your extension up and running in 5 minutes!

---

## 📋 Prerequisites

- Chrome or Edge browser (version 88+)
- Your Ovara Supabase credentials
- Basic knowledge of loading Chrome extensions

---

## 🚀 Quick Start

### Step 1: Configure Supabase

1. Open `popup.js`
2. Find lines 4-5:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

3. Replace with your actual values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

**Where to find these:**
- Go to your Supabase dashboard
- Click Settings → API
- Copy "Project URL" and "anon public" key

### Step 2: Update Web App URLs

1. Open `popup.js`
2. Find lines ~174-186 (feature buttons)
3. Replace `https://your-app-url.com` with your domain

Example:
```javascript
humanizerBtn.addEventListener('click', () => {
  window.open('https://ovara-app.vercel.app/humanizer', '_blank');
});
```

4. Also update in `background.js` (lines ~30-40)

### Step 3: Create Extension Icons

You need 3 icon sizes. Use any of these methods:

**Option A: Use an icon generator**
1. Go to https://redketchup.io/icon-converter
2. Upload your logo/image
3. Generate 16x16, 48x48, and 128x128 PNG files
4. Save to `browser-extension/icons/` folder

**Option B: Use design software**
- Figma, Photoshop, or Canva
- Create square canvas: 128x128
- Design your icon
- Export as PNG at 3 sizes

**Option C: Placeholder (for testing)**
Create simple colored squares:
```
icons/
  icon16.png  (purple square, 16x16)
  icon48.png  (purple square, 48x48)
  icon128.png (purple square, 128x128)
```

### Step 4: Load Extension in Chrome

1. **Open Chrome Extensions:**
   - Type `chrome://extensions/` in address bar
   - Or Menu → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle switch in top-right corner

3. **Load Unpacked Extension:**
   - Click "Load unpacked" button
   - Navigate to your `browser-extension` folder
   - Click "Select Folder"

4. **Verify Installation:**
   - Extension should appear in list
   - No errors should show

5. **Pin Extension:**
   - Click puzzle piece icon in toolbar
   - Find "Ovara - AI Writing Assistant"
   - Click pin icon to keep it visible

### Step 5: Test It!

1. **Click extension icon** - Should see login screen
2. **Login** - Use your Ovara account
3. **Test Auto-Typer:**
   - Open any website (e.g., Google Docs)
   - Click extension → Auto-Typer
   - Type some text
   - Click "Start Auto-Type"
   - Click any text field
   - Watch it type! ⌨️

---

## 🔧 Configuration Checklist

- [ ] Supabase URL configured
- [ ] Supabase anon key configured
- [ ] Web app URLs updated
- [ ] Icons created and placed
- [ ] Extension loaded in Chrome
- [ ] Extension pinned to toolbar
- [ ] Login tested successfully
- [ ] Auto-typer tested successfully

---

## 🐛 Troubleshooting

### "Failed to fetch" error on login
- ✅ Check Supabase URL is correct
- ✅ Check Supabase key is correct
- ✅ Verify your Supabase project is active
- ✅ Check browser console for CORS errors

### Auto-typer doesn't work
- ✅ Make sure you clicked "Start Auto-Type"
- ✅ Click directly on a text input field
- ✅ Try on a simple site like Google.com first
- ✅ Check browser console for errors

### Extension won't load
- ✅ Check all files are in the folder
- ✅ Verify manifest.json is valid (no syntax errors)
- ✅ Make sure icons folder exists (even if empty)
- ✅ Refresh extension: chrome://extensions/ → Reload

### Icons don't show
- ✅ Check file names match exactly (case-sensitive)
- ✅ Verify PNG format
- ✅ Check file permissions
- ✅ Try removing and reloading extension

---

## 📝 Configuration File Template

Save this as `config.txt` for your records:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
WEB_APP_URL=https://your-app.vercel.app
```

**⚠️ Never commit this file to Git!**

---

## 🎨 Recommended Icon Design

**Colors:**
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Dark Purple)
- Background: White or Transparent

**Style:**
- Clean and modern
- Recognizable at small sizes
- Matches your brand

**Simple Design Ideas:**
- Letter "O" with gradient
- Pen/pencil icon with gradient
- Document with AI sparkle
- Keyboard with magic effect

---

## 🚀 Next Steps

After setup:

1. **Test all features:**
   - Login/Logout
   - Auto-typer on different sites
   - Right-click context menu
   - Feature quick-access buttons

2. **Customize:**
   - Update colors to match your brand
   - Add your logo to icons
   - Modify button labels if needed

3. **Deploy:**
   - Follow README.md for Chrome Web Store publishing
   - Prepare screenshots and promotional materials

---

## 📞 Need Help?

- Check README.md for detailed documentation
- Review browser console for error messages
- Test each component individually
- Verify all credentials are correct

---

**Estimated Setup Time:** 5-10 minutes

**You're ready to go! 🎉**
