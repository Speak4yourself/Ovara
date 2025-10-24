// Supabase Edge Function: process-humanization
// This function processes humanization requests from the queue
// It uses Claude AI or ChatGPT to humanize text

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface HumanizationRequest {
  id: string
  user_id: string
  original_text: string
  tier: string
  skip_queue: boolean
  ai_model: string
}

interface WritingStyleSample {
  content: string
}

// Create Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Humanize text using Claude AI
 */
async function humanizeWithClaude(
  text: string,
  styleSamples: WritingStyleSample[] = [],
  doubleCheck = false
): Promise<{ humanizedText: string; aiDetectionScore?: number }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Build style context from samples
  let styleContext = ''
  if (styleSamples.length > 0) {
    styleContext = '\n\nWRITING STYLE SAMPLES (match this style):\n'
    styleSamples.forEach((sample, idx) => {
      styleContext += `\nSample ${idx + 1}:\n${sample.content.substring(0, 500)}\n`
    })
  }

  const prompt = `You are an expert at making AI-generated text sound natural and human-like. Your task is to rewrite the following text to:

1. Remove robotic or overly formal language
2. Add natural variations in sentence structure and length
3. Include conversational elements where appropriate
4. Fix any repetitive patterns common in AI text
5. Maintain the original meaning and key points
6. Match the writing style of the provided samples (if any)

IMPORTANT: Return ONLY the humanized text, no explanations or meta-commentary.${styleContext}

TEXT TO HUMANIZE:
${text}

HUMANIZED VERSION:`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  const humanizedText = data.content[0].text

  // If double-check is enabled, run AI detection
  let aiDetectionScore: number | undefined
  if (doubleCheck) {
    aiDetectionScore = await detectAI(humanizedText)

    // If score is still high, try one more pass
    if (aiDetectionScore > 60) {
      const secondPassPrompt = `The following text still reads as ${aiDetectionScore}% AI-generated. Please make it more human and natural. Focus on:
- Adding personal touches and imperfections
- Varying sentence rhythm more
- Using more casual language where appropriate

TEXT:
${humanizedText}

IMPROVED VERSION:`

      const secondResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: secondPassPrompt }],
        }),
      })

      if (secondResponse.ok) {
        const secondData = await secondResponse.json()
        const improvedText = secondData.content[0].text
        aiDetectionScore = await detectAI(improvedText)
        return { humanizedText: improvedText, aiDetectionScore }
      }
    }
  }

  return { humanizedText, aiDetectionScore }
}

/**
 * Humanize text using ChatGPT
 */
async function humanizeWithChatGPT(
  text: string,
  styleSamples: WritingStyleSample[] = []
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Build style context from samples
  let styleContext = ''
  if (styleSamples.length > 0) {
    styleContext = '\n\nWRITING STYLE SAMPLES (match this style):\n'
    styleSamples.forEach((sample, idx) => {
      styleContext += `\nSample ${idx + 1}:\n${sample.content.substring(0, 500)}\n`
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert at making AI-generated text sound natural and human-like. Rewrite text to remove robotic patterns, add natural variations, and maintain the original meaning. Return ONLY the humanized text.${styleContext}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Detect AI content (mock implementation - integrate with real AI detector)
 */
async function detectAI(text: string): Promise<number> {
  // TODO: Integrate with a real AI detection API like GPTZero or Originality.ai
  // For now, return a mock score based on text length and patterns

  // Simple heuristics (replace with real API)
  let score = 50

  // Longer uniform sentences = higher AI probability
  const sentences = text.split(/[.!?]+/)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
  if (avgSentenceLength > 100) score += 20
  if (avgSentenceLength < 50) score -= 20

  // Common AI phrases increase score
  const aiPhrases = ['in conclusion', 'furthermore', 'moreover', 'it is important to note']
  const phraseCount = aiPhrases.filter(phrase => text.toLowerCase().includes(phrase)).length
  score += phraseCount * 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Process a single humanization request
 */
async function processRequest(request: HumanizationRequest): Promise<void> {
  console.log(`Processing humanization request ${request.id} for user ${request.user_id}`)

  try {
    // Update status to processing
    await supabaseAdmin
      .from('humanization_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', request.id)

    // Check if user has writing style samples (Pro/Premium only)
    let styleSamples: WritingStyleSample[] = []
    if (request.tier === 'pro' || request.tier === 'premium') {
      const { data } = await supabaseAdmin
        .from('writing_style_samples')
        .select('content')
        .eq('user_id', request.user_id)
        .limit(5)

      if (data) {
        styleSamples = data
      }
    }

    // Determine if double-check is enabled (Premium only)
    const doubleCheck = request.tier === 'premium'

    // Humanize the text
    let humanizedText: string
    let aiDetectionScoreAfter: number | undefined

    if (request.ai_model === 'chatgpt') {
      humanizedText = await humanizeWithChatGPT(request.original_text, styleSamples)
      if (doubleCheck) {
        aiDetectionScoreAfter = await detectAI(humanizedText)
      }
    } else {
      const result = await humanizeWithClaude(request.original_text, styleSamples, doubleCheck)
      humanizedText = result.humanizedText
      aiDetectionScoreAfter = result.aiDetectionScore
    }

    // Get detection score before humanization
    const aiDetectionScoreBefore = await detectAI(request.original_text)

    // Update queue entry with results
    await supabaseAdmin
      .from('humanization_queue')
      .update({
        status: 'completed',
        humanized_text: humanizedText,
        ai_detection_score_before: aiDetectionScoreBefore,
        ai_detection_score_after: aiDetectionScoreAfter,
        completed_at: new Date().toISOString(),
      })
      .eq('id', request.id)

    // Increment usage count
    await supabaseAdmin.rpc('increment_humanization_count', { p_user_id: request.user_id })

    console.log(`Successfully processed request ${request.id}`)
  } catch (error) {
    console.error(`Error processing request ${request.id}:`, error)

    // Update queue entry with error
    await supabaseAdmin
      .from('humanization_queue')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
  }
}

/**
 * Main handler - processes queue continuously
 */
serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get next request from queue (priority: skip_queue first, then FIFO)
    const { data: requests, error } = await supabaseAdmin
      .from('humanization_queue')
      .select('*')
      .eq('status', 'queued')
      .order('skip_queue', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      throw error
    }

    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ message: 'No requests in queue' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const request = requests[0]
    await processRequest(request)

    return new Response(
      JSON.stringify({ message: 'Request processed successfully', requestId: request.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in humanization processor:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
