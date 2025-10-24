// Supabase Edge Function: extract-pdf-text
// Extracts text from PDF files

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * Extract text from PDF using pdf.js
 * Note: This is a simplified implementation
 * For production, you may want to use a dedicated PDF parsing service
 */
async function extractTextFromPDF(pdfData: Uint8Array): Promise<string> {
  try {
    // Import pdf.js library
    const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm')

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData })
    const pdf = await loadingTask.promise

    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.')
  }
}

/**
 * Alternative: Simple text extraction without pdf.js
 * This is a fallback for when pdf.js is not available
 */
function simplePDFExtraction(pdfData: Uint8Array): string {
  try {
    // Convert Uint8Array to string
    const text = new TextDecoder('utf-8', { fatal: false }).decode(pdfData)

    // Remove PDF header and binary data
    let cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')

    // Try to extract text between common PDF text markers
    const textMatches = cleanText.match(/\(([^)]+)\)/g)

    if (textMatches && textMatches.length > 0) {
      return textMatches
        .map(match => match.slice(1, -1))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Fallback: just clean the text
    cleanText = cleanText
      .replace(/[^\x20-\x7E\n]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanText.length < 100) {
      throw new Error('Could not extract readable text from PDF')
    }

    return cleanText
  } catch (error) {
    throw new Error('Failed to extract text. Please try copy-pasting the text manually.')
  }
}

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

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return new Response(JSON.stringify({ error: 'File must be a PDF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Read file data
    const arrayBuffer = await file.arrayBuffer()
    const pdfData = new Uint8Array(arrayBuffer)

    // Extract text
    let extractedText: string

    try {
      // Try advanced extraction with pdf.js
      extractedText = await extractTextFromPDF(pdfData)
    } catch (error) {
      console.log('pdf.js extraction failed, trying simple extraction:', error)

      try {
        // Fallback to simple extraction
        extractedText = simplePDFExtraction(pdfData)
      } catch (fallbackError) {
        console.error('Simple extraction also failed:', fallbackError)
        return new Response(
          JSON.stringify({
            error: 'Could not extract text from PDF. The file may be scanned or image-based. Please copy-paste the text manually.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Validate extracted text
    if (!extractedText || extractedText.length < 50) {
      return new Response(
        JSON.stringify({
          error: 'Not enough text extracted from PDF. Please ensure the PDF contains selectable text.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Clean up text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim()

    return new Response(
      JSON.stringify({
        text: extractedText,
        wordCount: extractedText.split(/\s+/).length,
        fileName: file.name,
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
    console.error('PDF extraction error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process PDF. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
