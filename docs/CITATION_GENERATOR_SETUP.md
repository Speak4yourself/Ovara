# 📚 Citation Generator - Setup Guide

## Quick Start (5 Minutes)

### 1. Deploy Edge Function

```bash
# Navigate to your Supabase project
cd supabase

# Deploy the generate-citation function
npx supabase functions deploy generate-citation

# Set environment variables
npx supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Create Database Tables

```bash
# Run the SQL script
psql -h your-supabase-host -U postgres -d postgres -f sql/CREATE_CITATION_TABLES.sql

# Or use Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of sql/CREATE_CITATION_TABLES.sql
# 3. Click "Run"
```

### 3. Verify Integration

The Citation Generator is already integrated into your app! Just:

1. Start your development server:
```bash
npm run dev
```

2. Log in to your account

3. Navigate to Control Panel

4. Click "Citation Generator" (requires Pro or Premium tier)

## 🎯 Features Overview

### Citation Styles
- **APA 7th Edition** - Psychology, Education, Social Sciences
- **MLA 9th Edition** - Literature, Arts, Humanities
- **Chicago 17th Edition** - History, Publishing
- **Harvard** - UK Universities, General Academic
- **IEEE** - Engineering, Computer Science

### Source Types
- **Website** - Online articles, blogs, web pages
- **Book** - Print or digital books
- **Journal** - Academic journal articles
- **Video** - YouTube, Vimeo, educational videos

### Tier Requirements
- **Basic**: Not available
- **Pro**: Full access, unlimited citations
- **Premium**: Full access + AI validation

## 📋 Usage Instructions

### Step 1: Select Citation Style
Choose from APA, MLA, Chicago, Harvard, or IEEE based on your requirements.

### Step 2: Select Source Type
Pick the type of source you're citing: Website, Book, Journal, or Video.

### Step 3: Fill in Source Details

**For Websites:**
- Title (required)
- URL (required)
- Access Date (required)
- Author(s) (optional)
- Website Name (optional)

**For Books:**
- Title (required)
- Author(s) (required)
- Publication Year (required)
- Publisher (optional)
- Edition (optional)
- Pages (optional)

**For Journals:**
- Article Title (required)
- Journal Name (required)
- Volume (required)
- Issue (required)
- Author(s) (optional)
- Pages (optional)
- DOI (optional)

**For Videos:**
- Title (required)
- Platform (required)
- URL (required)
- Creator (optional)
- Upload Date (optional)

### Step 4: Add Authors
- Click "+ Add Author" to add more authors
- Fill in First Name and Last Name
- Click "Remove" to remove an author
- System automatically formats author names per style guide

### Step 5: Generate Citation
- Click "Generate Citation" button
- Citation appears formatted according to selected style
- Premium users get AI validation automatically

### Step 6: Use Your Citation
- **Copy**: Click "Copy" to copy to clipboard
- **Save**: Click "Save" to add to your citation history
- **Export**: Click "Export" to download as .txt file

## 🎓 Citation Style Examples

### APA 7th Edition
```
Smith, J. (2025). The impact of artificial intelligence on education.
Educational Technology Journal. Retrieved October 14, 2025,
from https://example.com/article
```

### MLA 9th Edition
```
Smith, John. "The Impact of Artificial Intelligence on Education."
Educational Technology Journal, 14 Oct. 2025,
https://example.com/article.
```

### Chicago 17th Edition
```
Smith, John. "The Impact of Artificial Intelligence on Education."
Educational Technology Journal. Accessed October 14, 2025.
https://example.com/article.
```

### Harvard
```
Smith, J (2025) 'The Impact of Artificial Intelligence on Education',
Educational Technology Journal, Available at:
https://example.com/article (Accessed: 14 October 2025).
```

### IEEE
```
[1] J. Smith, "The Impact of Artificial Intelligence on Education,"
Educational Technology Journal, Accessed: Oct. 14, 2025. [Online].
Available: https://example.com/article
```

## 🔧 Configuration

### Environment Variables

Required for Premium AI validation:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Add to your `.env` file or Supabase secrets:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

### Database Configuration

The setup script creates:
- `citations` table - Stores all saved citations
- `citation_usage` table - Tracks monthly usage
- Helper functions for usage counting
- Row Level Security policies

### Tier Limits

Update tier limits in `CitationGenerator.jsx`:

```javascript
const limits = {
  basic: { citationsPerMonth: 0 },      // Not available
  pro: { citationsPerMonth: Infinity }, // Unlimited
  premium: { citationsPerMonth: Infinity, aiValidation: true }
}
```

## 🐛 Troubleshooting

### Issue: "Citation Generator coming soon" button

**Solution**: Ensure you have Pro or Premium tier:
```javascript
// Check your subscription in Control Panel
userSubscription.tier === 'pro' || userSubscription.tier === 'premium'
```

### Issue: Edge function not deployed

**Solution**: Deploy manually:
```bash
cd supabase
npx supabase functions deploy generate-citation --no-verify-jwt
```

### Issue: Database tables don't exist

**Solution**: Run SQL script:
```bash
# Copy contents of sql/CREATE_CITATION_TABLES.sql
# Paste in Supabase Dashboard > SQL Editor
# Click "Run"
```

### Issue: Citations not saving

**Solution**: Check RLS policies:
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'citations';

-- If missing, run CREATE_CITATION_TABLES.sql again
```

### Issue: AI validation not working (Premium)

**Solution**: Check Anthropic API key:
```bash
# Verify secret is set
npx supabase secrets list

# Set if missing
npx supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

## 📊 Monitoring

### Check Usage

```sql
-- Get user's monthly citation count
SELECT get_monthly_citation_count('user_id_here');

-- View all citations for a user
SELECT * FROM citations
WHERE user_id = 'user_id_here'
ORDER BY created_at DESC;

-- Get usage statistics
SELECT
  user_id,
  month_start,
  citations_count
FROM citation_usage
WHERE month_start >= date_trunc('month', CURRENT_DATE - interval '3 months')
ORDER BY month_start DESC, citations_count DESC;
```

### Monitor Edge Function

```bash
# View function logs
npx supabase functions logs generate-citation

# Follow logs in real-time
npx supabase functions logs generate-citation --follow
```

## 🎨 Customization

### Add Custom Citation Style

1. Add to style selector (`CitationGenerator.jsx`):
```javascript
<option value="Vancouver">Vancouver</option>
```

2. Implement formatting function (`generate-citation/index.ts`):
```typescript
function formatVancouverCitation(data: CitationData): string {
  // Formatting logic based on Vancouver style guide
  return formattedCitation
}
```

3. Update switch statement:
```typescript
case 'Vancouver':
  return formatVancouverCitation(data)
```

### Modify Author Formatting

Edit author formatting functions in `generate-citation/index.ts`:

```typescript
function formatAuthorsAPA(authors: Author[]): string {
  if (authors.length === 0) return ''
  if (authors.length === 1) {
    return `${authors[0].lastName}, ${authors[0].firstName[0]}.`
  }
  // Add your custom logic here
}
```

### Custom Export Format

Modify the export functionality in `CitationGenerator.jsx`:

```javascript
const handleExportBibliography = () => {
  let content = 'Bibliography\n\n'

  savedCitations.forEach((citation, index) => {
    content += `${index + 1}. ${citation.formatted_citation}\n\n`
  })

  // Add custom header/footer
  content += `\nGenerated by Ovara Citation Generator\n`
  content += `Date: ${new Date().toLocaleDateString()}\n`

  // Download
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bibliography.txt'
  a.click()
}
```

## 🔗 Resources

### Official Style Guides
- [Purdue OWL - Citation Styles](https://owl.purdue.edu/owl/research_and_citation/resources.html)
- [APA Style 7th Edition](https://apastyle.apa.org/)
- [MLA Style Center](https://style.mla.org/)
- [Chicago Manual of Style](https://www.chicagomanualofstyle.org/)
- [Harvard Referencing Guide](https://www.mendeley.com/guides/harvard-citation-guide)
- [IEEE Reference Guide](https://journals.ieeeauthorcenter.ieee.org/your-role-in-article-production/ieee-editorial-style-manual/)

### Development Resources
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [React Documentation](https://react.dev/)

## ✅ Verification Checklist

Before using Citation Generator in production:

- [ ] Edge function deployed successfully
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Anthropic API key set (for Premium AI validation)
- [ ] Component integrated in Control Panel
- [ ] Tier restrictions working
- [ ] All 5 citation styles working
- [ ] All 4 source types working
- [ ] Save/copy/export functional
- [ ] Citation history loading properly

## 🎉 You're Ready!

Your Citation Generator is now fully set up and ready to use. Users with Pro or Premium tiers can:

1. Generate citations in 5 major styles
2. Cite websites, books, journals, and videos
3. Add multiple authors with proper formatting
4. Save citations to their history
5. Export bibliographies
6. Get AI validation (Premium only)

---

**Need help?** Check the main [CITATION_GENERATOR_README.md](../CITATION_GENERATOR_README.md) for detailed documentation and examples.
