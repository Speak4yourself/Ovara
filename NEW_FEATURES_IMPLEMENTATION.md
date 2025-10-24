# New Features Implementation Guide

## ✅ Completed Features

### 1. **Terms of Service Page**
- File: `src/components/TermsOfService.jsx`
- Professional legal page with all necessary terms
- Covers subscriptions, AI content, liability, etc.

### 2. **Privacy Policy Page**
- File: `src/components/PrivacyPolicy.jsx`
- Comprehensive privacy policy
- GDPR, FERPA, CCPA compliant
- Covers data collection, usage, and rights

### 3. **Contact/Support Page**
- File: `src/components/ContactSupport.jsx`
- Support ticket submission form
- Direct email contacts
- FAQ section
- Database table: `sql/create_support_tickets.sql`

### 4. **Subscription Cancellation**
- Added cancel button in Settings → Subscription tab
- Subtle, blends with background as requested
- Edge Function: `supabase/functions/cancel-subscription/index.ts`
- Cancels via Stripe API securely

### 5. **PDF Upload** ✅ Already Working
- Feature already implemented and functional
- Edge Function: `supabase/functions/extract-pdf-text/index.ts`
- Supports text extraction from PDFs

### 6. **Admin Dashboard** ✅ Already Complete
- View/manage users
- View/modify subscriptions
- Create/manage discount codes
- Statistics dashboard

## 📝 To Add to App.jsx

Add these imports at the top:
```javascript
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import ContactSupport from './components/ContactSupport'
```

Add these routes in the main render (after the Settings route):
```javascript
{/* Terms of Service */}
{page === 'terms' && (
  <TermsOfService onBack={() => setPage('home')} />
)}

{/* Privacy Policy */}
{page === 'privacy' && (
  <PrivacyPolicy onBack={() => setPage('home')} />
)}

{/* Contact & Support */}
{page === 'contact' && (
  <ContactSupport
    user={user}
    onBack={() => setPage('home')}
    showToast={showToast}
  />
)}
```

Add footer links (in the homepage footer):
```javascript
<div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-white/60">
  <button onClick={() => setPage('terms')} className="hover:text-white transition">Terms of Service</button>
  <button onClick={() => setPage('privacy')} className="hover:text-white transition">Privacy Policy</button>
  <button onClick={() => setPage('contact')} className="hover:text-white transition">Contact Support</button>
</div>
```

## 🚀 Still Need to Implement

### High Priority

#### 1. **Auto-Save Functionality**
Location: Update `EssayGenerator.jsx` and all essay editing components

Add this hook to each essay component:
```javascript
// Auto-save hook
useEffect(() => {
  if (!essayText) return

  const timeoutId = setTimeout(async () => {
    if (currentEssayId) {
      await supabase
        .from('saved_essays')
        .update({ content: essayText, updated_at: new Date().toISOString() })
        .eq('id', currentEssayId)

      console.log('Auto-saved')
    }
  }, 2000) // Save after 2 seconds of inactivity

  return () => clearTimeout(timeoutId)
}, [essayText])
```

#### 2. **Export to PDF/DOCX**
Install package:
```bash
npm install jspdf html-docx-js
```

Create utility file `src/utils/export.js`:
```javascript
import jsPDF from 'jspdf'

export function exportToPDF(title, content) {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text(title, 20, 20)

  // Add content
  doc.setFontSize(12)
  const splitText = doc.splitTextToSize(content, 170)
  doc.text(splitText, 20, 40)

  // Download
  doc.save(`${title}.pdf`)
}

export function exportToDOCX(title, content) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body>
        <h1>${title}</h1>
        <p>${content.replace(/\n/g, '</p><p>')}</p>
      </body>
    </html>
  `

  const converted = htmlDocx.asBlob(htmlContent)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(converted)
  link.download = `${title}.docx`
  link.click()
}
```

Add export buttons to SavedEssays component:
```javascript
import { exportToPDF, exportToDOCX } from '../utils/export'

// In the essay actions:
<Button onClick={() => exportToPDF(essay.title, essay.content)}>
  <Download className="w-4 h-4 mr-2" />
  Export PDF
</Button>
<Button onClick={() => exportToDOCX(essay.title, essay.content)}>
  <Download className="w-4 h-4 mr-2" />
  Export DOCX
</Button>
```

#### 3. **Word Count Goals & Reading Time**
Add to any essay component:
```javascript
// Calculate reading time (200 words per minute average)
const getReadingTime = (text) => {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} min read`
}

// Word count goal
const [wordGoal, setWordGoal] = useState(500)
const currentWords = essayText.trim().split(/\s+/).filter(w => w.length > 0).length
const progress = (currentWords / wordGoal) * 100

// Display
<div className="flex items-center gap-4">
  <div className="text-sm">
    {currentWords} / {wordGoal} words
    <div className="w-32 h-2 bg-white/10 rounded-full mt-1">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  </div>
  <div className="text-sm text-white/60">
    {getReadingTime(essayText)}
  </div>
</div>
```

#### 4. **Search in Saved Essays**
Update SavedEssays component:
```javascript
const [searchQuery, setSearchQuery] = useState('')

// Filter essays
const filteredEssays = essays.filter(essay =>
  essay.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  essay.content.toLowerCase().includes(searchQuery.toLowerCase())
)

// Add search input
<Input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search essays..."
  className="mb-4"
/>
```

#### 5. **Favorite/Star Essays**
Add favorite column to database:
```sql
ALTER TABLE saved_essays ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
```

Add star button to each essay:
```javascript
const toggleFavorite = async (essayId, currentState) => {
  await supabase
    .from('saved_essays')
    .update({ is_favorite: !currentState })
    .eq('id', essayId)

  loadEssays() // Refresh
}

// In UI:
<button onClick={() => toggleFavorite(essay.id, essay.is_favorite)}>
  <Star className={essay.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'} />
</button>
```

#### 6. **Undo/Redo Functionality**
Add to essay editors:
```javascript
const [history, setHistory] = useState([])
const [historyIndex, setHistoryIndex] = useState(-1)

// Save to history on change
const handleTextChange = (newText) => {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(newText)
  setHistory(newHistory)
  setHistoryIndex(newHistory.length - 1)
  setEssayText(newText)
}

// Undo
const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1)
    setEssayText(history[historyIndex - 1])
  }
}

// Redo
const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1)
    setEssayText(history[historyIndex + 1])
  }
}

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [historyIndex, history])
```

### Lower Priority

#### 7. **Email Notification System**
Create Edge Function `supabase/functions/send-notification/index.ts` using Resend or SendGrid

#### 8. **Onboarding Tutorial**
Use a library like `intro.js` or `react-joyride`:
```bash
npm install react-joyride
```

#### 9. **Usage Analytics for Admins**
Add charts using `recharts`:
```bash
npm install recharts
```

Add analytics tab in AdminDashboard with usage graphs

## 📋 Deployment Checklist

1. Deploy Edge Functions:
```bash
supabase functions deploy cancel-subscription
```

2. Run SQL migrations:
```bash
# Run create_support_tickets.sql in Supabase SQL Editor
```

3. Update App.jsx with new routes (see above)

4. Test all new features:
   - Terms of Service page loads
   - Privacy Policy page loads
   - Contact form submits successfully
   - Cancel subscription works
   - PDF uploads work

5. Add footer links to homepage

## 🎯 Quick Implementation Order

1. **Today:** Add routes to App.jsx + Add footer links
2. **Day 2:** Auto-save + Export PDF/DOCX
3. **Day 3:** Word count goals + Reading time + Search
4. **Day 4:** Favorites + Undo/Redo
5. **Day 5:** Onboarding tutorial
6. **Day 6:** Email notifications
7. **Day 7:** Usage analytics

## 📧 Support

All the legal pages reference these support emails:
- support@ovara.app
- billing@ovara.app
- privacy@ovara.app

Make sure these are set up or forward to your main email!
