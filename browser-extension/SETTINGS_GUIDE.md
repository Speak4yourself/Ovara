# Ovara Assistant - Settings & Customization Guide

## 🎨 Overview

The Ovara Assistant now includes comprehensive customization options, allowing you to personalize the theme, position, size, and behavior of your AI co-pilot to match your workflow perfectly.

---

## 🚀 Accessing Settings

### From Extension Popup:
1. Click the Ovara extension icon
2. Sign in (if not already signed in)
3. Click the **"Settings"** card (⚙️ icon)
4. Settings will open in a new tab

### From Ovara Assistant:
- Settings automatically apply to the assistant when saved
- Changes take effect immediately on all open tabs

---

## 🎨 Theme Settings

### Auto (Default - Recommended)
- Automatically matches your Chrome browser theme
- Switches between light and dark based on system preference
- Best for users who change themes frequently

### Dark Theme
- Dark background (#0b0c10) with light text
- Perfect for night-time use
- Reduces eye strain in low-light environments
- Matches Ovara website branding

### Light Theme
- Light background (#ffffff) with dark text
- Ideal for daytime use or bright environments
- Better contrast for some users
- Professional appearance

**How it works:**
- Theme is saved per-user account
- Syncs across all devices
- Applied instantly to assistant sidebar
- Persists across browser sessions

---

## 📍 Position Settings

Choose where the Ovara Assistant appears on your screen:

### 1. Right Side (Default)
- **Size**: 300-800px wide
- **Best for**: Most users, natural reading flow
- **Page adjustment**: Content shifts left
- **Animation**: Slides in from right

```
┌─────────────────┬────────┐
│                 │        │
│   Your Page     │   🤖   │
│   Content       │  Ovara │
│                 │        │
└─────────────────┴────────┘
```

### 2. Left Side
- **Size**: 300-800px wide
- **Best for**: Right-handed mouse users, alternative layout
- **Page adjustment**: Content shifts right
- **Animation**: Slides in from left

```
┌────────┬─────────────────┐
│        │                 │
│   🤖   │   Your Page     │
│  Ovara │   Content       │
│        │                 │
└────────┴─────────────────┘
```

### 3. Top
- **Size**: 250-800px tall
- **Best for**: Ultrawide monitors, quick reference
- **Page adjustment**: Content shifts down
- **Animation**: Slides in from top

```
┌─────────────────────────┐
│     🤖 Ovara Assistant  │
├─────────────────────────┤
│                         │
│   Your Page Content     │
│                         │
└─────────────────────────┘
```

### 4. Bottom
- **Size**: 250-800px tall
- **Best for**: Laptops, bottom taskbar users
- **Page adjustment**: Content shifts up
- **Animation**: Slides in from bottom

```
┌─────────────────────────┐
│                         │
│   Your Page Content     │
│                         │
├─────────────────────────┤
│     🤖 Ovara Assistant  │
└─────────────────────────┘
```

### 5. Split Screen
- **Size**: 50% of viewport width
- **Best for**: Multitasking, side-by-side comparison
- **Page adjustment**: Content takes 50% width
- **Animation**: Slides in from right

```
┌─────────────┬─────────────┐
│             │             │
│  Your Page  │  🤖 Ovara  │
│   Content   │  Assistant │
│             │             │
└─────────────┴─────────────┘
```

---

## 📏 Size Settings

Control how much screen space the assistant occupies:

### Small (300px)
- **Best for**: Small screens, laptops (13-14")
- **Use case**: Quick queries, minimal space usage
- **Visibility**: Compact but functional

### Medium (380px) - Default
- **Best for**: Most users, balanced layout
- **Use case**: General writing assistance
- **Visibility**: Comfortable reading and interaction

### Large (480px)
- **Best for**: Large monitors (24"+), detailed work
- **Use case**: Long-form writing, complex queries
- **Visibility**: Spacious, easy to read

### Custom (250-800px)
- **Best for**: Power users, specific workflows
- **How to use**:
  1. Select "Custom" size
  2. Drag the slider to your preferred size
  3. See preview in real-time
  4. Save when perfect

**Size applies to:**
- **Sides (left/right)**: Width of assistant panel
- **Top/Bottom**: Height of assistant panel
- **Split screen**: Fixed at 50% width

---

## ⚙️ Behavior Settings

### Auto-Open on Page Load
- **Default**: OFF
- **What it does**: Automatically opens assistant when you visit a page
- **Best for**: Power users who always use the assistant
- **Note**: May be distracting on some websites

**When to enable:**
- Writing essays or documents
- Working on specific projects
- Using assistant frequently

**When to disable:**
- Casual browsing
- News websites
- Social media

### Remember Position
- **Default**: ON (Recommended)
- **What it does**: Remembers if assistant was open/closed
- **Best for**: Consistent workflow
- **Note**: State persists across sessions

**Example:**
1. Open assistant on a writing website
2. Close browser
3. Return tomorrow
4. Assistant automatically opens on that site

---

## 💡 Recommended Configurations

### For Students (Essay Writing)
```
Theme: Auto
Position: Right Side
Size: Large (480px)
Auto-Open: ON (for docs.google.com)
Remember State: ON
```

### For Developers (Code Review)
```
Theme: Dark
Position: Split Screen
Size: 50% (fixed)
Auto-Open: OFF
Remember State: ON
```

### For Content Writers
```
Theme: Light
Position: Right Side
Size: Medium (380px)
Auto-Open: OFF
Remember State: ON
```

### For Laptop Users (13-14")
```
Theme: Auto
Position: Bottom
Size: Small (300px)
Auto-Open: OFF
Remember State: ON
```

### For Ultrawide Monitors (34"+)
```
Theme: Dark
Position: Split Screen
Size: 50% (fixed)
Auto-Open: ON
Remember State: ON
```

---

## 🔧 Technical Details

### How Settings Work

1. **Storage**: Settings saved in `chrome.storage.local`
2. **Persistence**: Settings persist across browser sessions
3. **Sync**: Settings apply to all tabs instantly
4. **Performance**: Zero performance impact when closed

### Settings Object Structure
```javascript
{
  theme: 'auto' | 'dark' | 'light',
  position: 'right' | 'left' | 'top' | 'bottom' | 'split',
  size: 'small' | 'medium' | 'large' | 'custom',
  customSize: 250-800, // pixels
  autoOpen: boolean,
  rememberState: boolean
}
```

### First-Time Setup
On first install, Ovara automatically:
1. Detects your system theme
2. Sets theme to "Auto"
3. Sets position to "Right"
4. Sets size to "Medium"
5. Disables auto-open
6. Enables remember state

### Theme Detection
```javascript
// Checks system preference
window.matchMedia('(prefers-color-scheme: dark')
```

---

## 🐛 Troubleshooting

### Settings Not Saving
1. Check browser permissions
2. Clear extension storage
3. Reload extension
4. Try again

### Assistant Not Repositioning
1. Close and reopen assistant
2. Refresh the page
3. Check if another extension conflicts
4. Reset to default settings

### Theme Not Changing
1. Make sure to click "Save Settings"
2. Reload the assistant (Ctrl+Space twice)
3. Check if page has custom CSS blocking theme
4. Try switching to manual Dark or Light

### Position Looks Weird
1. Some websites have fixed layouts
2. Try different position
3. Adjust size
4. Split screen works best for complex sites

---

## 🎓 Pro Tips

### 1. Keyboard Shortcuts
- `Ctrl+Space`: Toggle assistant (works regardless of settings)
- `Ctrl+Shift+T`: Open auto-typer

### 2. Per-Website Configurations
While not yet supported, you can:
- Use "Remember State" to auto-open on specific sites
- Manually adjust position for different workflows

### 3. Performance Optimization
- Close assistant when not in use
- Disable auto-open for better browsing performance
- Use smaller sizes on older computers

### 4. Multi-Monitor Setup
- Position assistant on secondary monitor edge
- Use split screen for primary monitor
- Adjust size based on monitor resolution

### 5. Accessibility
- Light theme for better contrast
- Large size for easier reading
- Bottom position for easier mouse access

---

## 🔮 Coming Soon

### Phase 2 Features
- [ ] Per-website settings
- [ ] Multiple position presets
- [ ] Floating/draggable mode
- [ ] Opacity control
- [ ] Font size adjustment
- [ ] Custom keyboard shortcuts

### Phase 3 Features
- [ ] Resize by dragging
- [ ] Pin/unpin behavior
- [ ] Minimize to icon
- [ ] Quick switch positions
- [ ] Export/import settings

---

## 📊 Settings Comparison

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Theme Options | ✅ All | ✅ All | ✅ All |
| Position Options | ✅ All | ✅ All | ✅ All |
| Size Options | ✅ All | ✅ All | ✅ All |
| Auto-Open | ✅ Yes | ✅ Yes | ✅ Yes |
| Remember State | ✅ Yes | ✅ Yes | ✅ Yes |
| Per-Website Config | ❌ No | ✅ Yes | ✅ Yes |
| Custom Presets | ❌ No | ❌ No | ✅ Yes |
| Advanced Controls | ❌ No | ❌ No | ✅ Yes |

---

## 💬 Feedback & Support

Love the new settings? Have suggestions?

- **Discord**: [discord.gg/ovara](https://discord.gg/ovara)
- **Email**: support@ovara.app
- **Feature Requests**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 📝 Changelog

### v2.0.0 - Settings Update
- ✅ Added theme customization (Dark/Light/Auto)
- ✅ Added 5 position options
- ✅ Added 4 size presets + custom
- ✅ Added auto-open behavior
- ✅ Added remember state
- ✅ Auto-detect system theme on install
- ✅ Real-time preview in settings
- ✅ Smooth animations for all positions

---

**Enjoy your fully customizable Ovara Assistant! 🎉**
