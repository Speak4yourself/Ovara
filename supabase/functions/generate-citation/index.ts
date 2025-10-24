// Supabase Edge Function: generate-citation
// Generates citations in multiple formats using Purdue OWL guidelines and AI validation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface Author {
  firstName: string
  lastName: string
}

interface CitationData {
  title: string
  authors: Author[]
  url?: string
  accessDate?: string
  websiteName?: string
  publishDate?: string
  publisher?: string
  publicationYear?: string
  edition?: string
  pages?: string
  journalName?: string
  volume?: string
  issue?: string
  doi?: string
  videoSource?: string
  duration?: string
}

interface CitationRequest {
  style: string // APA, MLA, Chicago, Harvard, IEEE
  sourceType: string // website, book, journal, video
  data: CitationData
  tier: string
}

/**
 * Format author names according to citation style
 */
function formatAuthors(authors: Author[], style: string, sourceType: string): string {
  if (!authors || authors.length === 0) return ''

  const filterAuthors = authors.filter(a => a.lastName.trim() !== '')

  if (style === 'APA') {
    if (filterAuthors.length === 1) {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName ? a.firstName.charAt(0) + '.' : ''}`
    } else if (filterAuthors.length === 2) {
      return `${formatAuthors([filterAuthors[0]], 'APA', sourceType)} & ${formatAuthors([filterAuthors[1]], 'APA', sourceType)}`
    } else if (filterAuthors.length <= 20) {
      const allButLast = filterAuthors.slice(0, -1).map(a => formatAuthors([a], 'APA', sourceType)).join(', ')
      const last = formatAuthors([filterAuthors[filterAuthors.length - 1]], 'APA', sourceType)
      return `${allButLast}, & ${last}`
    } else {
      // 21+ authors: first 19 + ... + last
      const first19 = filterAuthors.slice(0, 19).map(a => formatAuthors([a], 'APA', sourceType)).join(', ')
      const last = formatAuthors([filterAuthors[filterAuthors.length - 1]], 'APA', sourceType)
      return `${first19}, ... ${last}`
    }
  }

  if (style === 'MLA') {
    if (filterAuthors.length === 1) {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName || a.firstName.charAt(0)}`
    } else if (filterAuthors.length === 2) {
      const a1 = filterAuthors[0]
      const a2 = filterAuthors[1]
      return `${a1.lastName}, ${a1.firstName}, and ${a2.firstName} ${a2.lastName}`
    } else if (filterAuthors.length === 3) {
      const names = filterAuthors.map((a, i) =>
        i === 0 ? `${a.lastName}, ${a.firstName}` : `${a.firstName} ${a.lastName}`
      )
      return `${names[0]}, ${names[1]}, and ${names[2]}`
    } else {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName}, et al.`
    }
  }

  if (style === 'Chicago') {
    if (filterAuthors.length === 1) {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName}`
    } else if (filterAuthors.length === 2) {
      const a1 = filterAuthors[0]
      const a2 = filterAuthors[1]
      return `${a1.lastName}, ${a1.firstName}, and ${a2.firstName} ${a2.lastName}`
    } else if (filterAuthors.length === 3) {
      const a1 = filterAuthors[0]
      const a2 = filterAuthors[1]
      const a3 = filterAuthors[2]
      return `${a1.lastName}, ${a1.firstName}, ${a2.firstName} ${a2.lastName}, and ${a3.firstName} ${a3.lastName}`
    } else {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName}, et al.`
    }
  }

  if (style === 'Harvard') {
    if (filterAuthors.length === 1) {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName.charAt(0)}.`
    } else if (filterAuthors.length <= 3) {
      return filterAuthors.map(a => `${a.lastName}, ${a.firstName.charAt(0)}.`).join(' and ')
    } else {
      const a = filterAuthors[0]
      return `${a.lastName}, ${a.firstName.charAt(0)}. et al.`
    }
  }

  if (style === 'IEEE') {
    if (filterAuthors.length === 1) {
      const a = filterAuthors[0]
      return `${a.firstName.charAt(0)}. ${a.lastName}`
    } else {
      return filterAuthors.map(a => `${a.firstName.charAt(0)}. ${a.lastName}`).join(', ')
    }
  }

  return ''
}

/**
 * Generate citation for website
 */
function generateWebsiteCitation(data: CitationData, style: string): string {
  const authors = formatAuthors(data.authors, style, 'website')
  const title = data.title
  const websiteName = data.websiteName || ''
  const url = data.url || ''
  const publishDate = data.publishDate ? new Date(data.publishDate).getFullYear() : 'n.d.'
  const accessDate = data.accessDate ? new Date(data.accessDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  if (style === 'APA') {
    // APA 7th edition
    let citation = authors ? `${authors}. ` : ''
    citation += publishDate !== 'n.d.' ? `(${publishDate}). ` : '(n.d.). '
    citation += `<i>${title}</i>. `
    if (websiteName) citation += `${websiteName}. `
    if (url) citation += `Retrieved ${accessDate}, from ${url}`
    return citation
  }

  if (style === 'MLA') {
    // MLA 9th edition
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    if (websiteName) citation += `<i>${websiteName}</i>, `
    if (publishDate !== 'n.d.') citation += `${publishDate}, `
    if (url) citation += `${url}. `
    citation += `Accessed ${accessDate}.`
    return citation
  }

  if (style === 'Chicago') {
    // Chicago 17th edition
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    if (websiteName) citation += `${websiteName}. `
    if (publishDate !== 'n.d.') citation += `${publishDate}. `
    if (url) citation += `${url}.`
    return citation
  }

  if (style === 'Harvard') {
    let citation = authors ? `${authors} ` : ''
    citation += publishDate !== 'n.d.' ? `${publishDate}. ` : 'n.d. '
    citation += `<i>${title}</i>. `
    citation += `[online] `
    if (websiteName) citation += `${websiteName}. `
    citation += `Available at: ${url} [Accessed ${accessDate}].`
    return citation
  }

  if (style === 'IEEE') {
    let citation = authors ? `${authors}, ` : ''
    citation += `"${title}," `
    if (websiteName) citation += `${websiteName}, `
    if (publishDate !== 'n.d.') citation += `${publishDate}. `
    citation += `[Online]. Available: ${url}. `
    citation += `[Accessed: ${accessDate}].`
    return citation
  }

  return ''
}

/**
 * Generate citation for book
 */
function generateBookCitation(data: CitationData, style: string): string {
  const authors = formatAuthors(data.authors, style, 'book')
  const title = data.title
  const publisher = data.publisher || ''
  const year = data.publicationYear || 'n.d.'
  const edition = data.edition || ''
  const pages = data.pages || ''

  if (style === 'APA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `(${year}). `
    citation += `<i>${title}</i>`
    if (edition) citation += ` (${edition} ed.)`
    citation += `. `
    if (publisher) citation += `${publisher}.`
    return citation
  }

  if (style === 'MLA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `<i>${title}</i>. `
    if (edition) citation += `${edition} ed., `
    if (publisher) citation += `${publisher}, `
    citation += `${year}.`
    return citation
  }

  if (style === 'Chicago') {
    let citation = authors ? `${authors}. ` : ''
    citation += `<i>${title}</i>. `
    if (edition) citation += `${edition} ed. `
    if (publisher) citation += `${publisher}, `
    citation += `${year}.`
    return citation
  }

  if (style === 'Harvard') {
    let citation = authors ? `${authors} ` : ''
    citation += `${year}. `
    citation += `<i>${title}</i>. `
    if (edition) citation += `${edition} edn. `
    if (publisher) citation += `${publisher}.`
    return citation
  }

  if (style === 'IEEE') {
    let citation = authors ? `${authors}, ` : ''
    citation += `<i>${title}</i>`
    if (edition) citation += `, ${edition} ed.`
    if (publisher) citation += ` ${publisher}, `
    citation += `${year}.`
    return citation
  }

  return ''
}

/**
 * Generate citation for journal article
 */
function generateJournalCitation(data: CitationData, style: string): string {
  const authors = formatAuthors(data.authors, style, 'journal')
  const title = data.title
  const journalName = data.journalName || ''
  const volume = data.volume || ''
  const issue = data.issue || ''
  const pages = data.pages || ''
  const year = data.publicationYear || 'n.d.'
  const doi = data.doi || ''

  if (style === 'APA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `(${year}). `
    citation += `${title}. `
    citation += `<i>${journalName}</i>, `
    if (volume) citation += `<i>${volume}</i>`
    if (issue) citation += `(${issue})`
    if (pages) citation += `, ${pages}`
    citation += `. `
    if (doi) citation += `https://doi.org/${doi}`
    return citation
  }

  if (style === 'MLA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    citation += `<i>${journalName}</i>, `
    if (volume) citation += `vol. ${volume}, `
    if (issue) citation += `no. ${issue}, `
    citation += `${year}, `
    if (pages) citation += `pp. ${pages}.`
    return citation
  }

  if (style === 'Chicago') {
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    citation += `<i>${journalName}</i> `
    if (volume) citation += `${volume}, `
    if (issue) citation += `no. ${issue} `
    citation += `(${year}): `
    if (pages) citation += `${pages}.`
    return citation
  }

  if (style === 'Harvard') {
    let citation = authors ? `${authors} ` : ''
    citation += `${year}. `
    citation += `'${title}', `
    citation += `<i>${journalName}</i>, `
    if (volume) citation += `vol. ${volume}, `
    if (issue) citation += `no. ${issue}, `
    if (pages) citation += `pp. ${pages}.`
    return citation
  }

  if (style === 'IEEE') {
    let citation = authors ? `${authors}, ` : ''
    citation += `"${title}," `
    citation += `<i>${journalName}</i>, `
    if (volume) citation += `vol. ${volume}, `
    if (issue) citation += `no. ${issue}, `
    if (pages) citation += `pp. ${pages}, `
    citation += `${year}.`
    return citation
  }

  return ''
}

/**
 * Generate citation for video
 */
function generateVideoCitation(data: CitationData, style: string): string {
  const authors = formatAuthors(data.authors, style, 'video')
  const title = data.title
  const videoSource = data.videoSource || 'Video'
  const url = data.url || ''
  const date = data.publishDate ? new Date(data.publishDate).getFullYear() : 'n.d.'
  const duration = data.duration || ''

  if (style === 'APA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `(${date}). `
    citation += `<i>${title}</i> [Video]. `
    citation += `${videoSource}. `
    if (url) citation += `${url}`
    return citation
  }

  if (style === 'MLA') {
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    citation += `${videoSource}, `
    citation += `${date}. `
    if (url) citation += `${url}.`
    return citation
  }

  if (style === 'Chicago') {
    let citation = authors ? `${authors}. ` : ''
    citation += `"${title}." `
    citation += `${videoSource} video, `
    if (duration) citation += `${duration}. `
    citation += `${date}. `
    if (url) citation += `${url}.`
    return citation
  }

  if (style === 'Harvard') {
    let citation = authors ? `${authors} ` : ''
    citation += `${date}. `
    citation += `<i>${title}</i>. `
    citation += `[video] ${videoSource}. `
    if (url) citation += `Available at: ${url}`
    return citation
  }

  if (style === 'IEEE') {
    let citation = authors ? `${authors}, ` : ''
    citation += `"${title}," `
    citation += `${videoSource}, `
    citation += `${date}. [Online Video]. `
    if (url) citation += `Available: ${url}`
    return citation
  }

  return ''
}

/**
 * Validate citation using AI (Pro/Premium only)
 */
async function validateCitationWithAI(citation: string, style: string, sourceType: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return citation
  }

  try {
    const prompt = `You are a citation expert specializing in ${style} format. Review the following citation for a ${sourceType} and correct any formatting errors according to official ${style} 7th/9th/17th edition guidelines and Purdue OWL standards.

Return ONLY the corrected citation, with no explanations or additional text.

Citation to review:
${citation}

Corrected citation:`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('AI validation failed')
      return citation
    }

    const data = await response.json()
    const validatedCitation = data.content[0].text.trim()

    return validatedCitation || citation
  } catch (error) {
    console.error('AI validation error:', error)
    return citation
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, content-type',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const { style, sourceType, data, tier }: CitationRequest = await req.json()

    // Generate base citation
    let citation = ''

    if (sourceType === 'website') {
      citation = generateWebsiteCitation(data, style)
    } else if (sourceType === 'book') {
      citation = generateBookCitation(data, style)
    } else if (sourceType === 'journal') {
      citation = generateJournalCitation(data, style)
    } else if (sourceType === 'video') {
      citation = generateVideoCitation(data, style)
    } else {
      throw new Error('Unsupported source type')
    }

    // AI validation for Pro/Premium
    let aiValidated = false
    if ((tier === 'pro' || tier === 'premium') && ANTHROPIC_API_KEY) {
      citation = await validateCitationWithAI(citation, style, sourceType)
      aiValidated = true
    }

    // Return result
    return new Response(
      JSON.stringify({
        citation,
        style,
        sourceType,
        data,
        aiValidated,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Citation generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
