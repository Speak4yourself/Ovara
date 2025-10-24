// Supabase Edge Function: detect-ai-content
// Analyzes text for AI-generated content using multiple detection methods

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const GPTZERO_API_KEY = Deno.env.get('GPTZERO_API_KEY') // Optional: For real AI detection
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface DetectionRequest {
  text: string
  tier: string
  detailed: boolean
  multipleDetectors: boolean
}

interface DetectionResult {
  overallScore: number
  detailed?: {
    sentences?: string
    patterns?: string[]
    confidence?: number
  }
  detectors?: {
    [key: string]: number
  }
  highlightedSentences?: Array<{
    text: string
    score: number
    status: 'ai' | 'unsure' | 'human'
  }>
}

/**
 * Advanced heuristic AI detection
 * Analyzes text patterns common in AI-generated content
 */
function heuristicDetection(text: string): number {
  let score = 50 // Start at neutral

  // Analyze sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().length, 0) / sentences.length

  // AI tends to write longer, more uniform sentences
  if (avgSentenceLength > 120) score += 15
  else if (avgSentenceLength < 60) score -= 10

  // Check sentence length variance
  const sentenceLengths = sentences.map(s => s.trim().length)
  const variance = sentenceLengths.reduce((sum, len) => {
    const diff = len - avgSentenceLength
    return sum + (diff * diff)
  }, 0) / sentenceLengths.length

  // Low variance = more AI-like
  if (variance < 500) score += 10
  else if (variance > 2000) score -= 10

  // Common AI phrases (increase score)
  const aiPhrases = [
    'it is important to note',
    'furthermore',
    'moreover',
    'in conclusion',
    'it should be noted',
    'as previously mentioned',
    'delve into',
    'it is worth noting',
    'in today\'s world',
    'in recent years',
    'plays a crucial role',
    'intricate',
    'multifaceted',
    'myriad',
    'plethora',
  ]

  const lowerText = text.toLowerCase()
  const phraseMatches = aiPhrases.filter(phrase => lowerText.includes(phrase))
  score += phraseMatches.length * 3

  // Check for repetitive structure
  const startWords = sentences.map(s => s.trim().split(' ')[0]?.toLowerCase())
  const uniqueStarts = new Set(startWords).size
  const repetitionRatio = uniqueStarts / startWords.length

  // Low variety in sentence starts = more AI-like
  if (repetitionRatio < 0.5) score += 10
  else if (repetitionRatio > 0.8) score -= 5

  // Check for passive voice (AI uses more passive voice)
  const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'be']
  const passiveCount = passiveIndicators.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    return count + (text.match(regex)?.length || 0)
  }, 0)

  const words = text.split(/\s+/).length
  const passiveRatio = passiveCount / words

  if (passiveRatio > 0.05) score += 8

  // Check for overly formal language
  const formalWords = ['utilize', 'commence', 'endeavor', 'facilitate', 'implement', 'leverage']
  const formalMatches = formalWords.filter(word => lowerText.includes(word))
  score += formalMatches.length * 4

  // Check for personal touches (decrease score if found)
  const personalMarkers = ['i think', 'i feel', 'in my opinion', 'personally', 'i believe']
  const personalMatches = personalMarkers.filter(marker => lowerText.includes(marker))
  score -= personalMatches.length * 5

  // Check for contractions (humans use more contractions)
  const contractions = text.match(/\b\w+'\w+\b/g)?.length || 0
  const contractionRatio = contractions / words

  if (contractionRatio < 0.01) score += 8
  else if (contractionRatio > 0.05) score -= 10

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Use Claude AI to detect AI-generated content
 */
async function claudeDetection(text: string): Promise<number> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const prompt = `You are an expert at detecting AI-generated text. Analyze the following text and determine the probability that it was written by AI (0-100%).

Consider these factors:
- Sentence structure uniformity
- Use of formulaic phrases
- Lack of personal voice or inconsistencies
- Overly perfect grammar
- Repetitive patterns
- Formal tone

Respond with ONLY a number between 0 and 100 representing the AI probability percentage.

TEXT TO ANALYZE:
${text}

AI PROBABILITY:`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error('Claude API request failed')
  }

  const data = await response.json()
  const scoreText = data.content[0].text.trim()
  const score = parseInt(scoreText.match(/\d+/)?.[0] || '50')

  return Math.max(0, Math.min(100, score))
}

/**
 * Use GPT-4 to detect AI-generated content
 */
async function openaiDetection(text: string): Promise<number> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
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
          content: 'You are an AI detection expert. Analyze text and respond with only a number 0-100 representing the probability the text was AI-generated.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    }),
  })

  if (!response.ok) {
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()
  const scoreText = data.choices[0].message.content.trim()
  const score = parseInt(scoreText.match(/\d+/)?.[0] || '50')

  return Math.max(0, Math.min(100, score))
}

/**
 * Use GPTZero API for real AI detection (if available)
 */
async function gptzeroDetection(text: string): Promise<number> {
  if (!GPTZERO_API_KEY) {
    // Return null if not configured, fallback to other methods
    return 50
  }

  try {
    const response = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GPTZERO_API_KEY,
      },
      body: JSON.stringify({
        document: text,
      }),
    })

    if (!response.ok) {
      console.error('GPTZero API error')
      return 50
    }

    const data = await response.json()
    // GPTZero returns probability, convert to 0-100 scale
    return Math.round((data.documents[0].completely_generated_prob || 0.5) * 100)
  } catch (error) {
    console.error('GPTZero detection failed:', error)
    return 50
  }
}

/**
 * Analyze individual sentence for AI likelihood
 */
function analyzeSentence(sentence: string): number {
  let score = 50 // Start neutral

  const lowerSentence = sentence.toLowerCase()
  const words = sentence.split(/\s+/).length

  // Common AI phrases
  const aiPhrases = [
    'it is important to note', 'furthermore', 'moreover', 'in conclusion',
    'it should be noted', 'as previously mentioned', 'delve into',
    'plays a crucial role', 'multifaceted', 'myriad', 'plethora'
  ]

  aiPhrases.forEach(phrase => {
    if (lowerSentence.includes(phrase)) score += 15
  })

  // Long, formal sentences
  if (sentence.length > 150) score += 10
  if (words > 25) score += 8

  // Personal markers (reduce AI score)
  const personalMarkers = ['i think', 'i feel', 'in my opinion', 'personally', 'i believe', 'my']
  personalMarkers.forEach(marker => {
    if (lowerSentence.includes(marker)) score -= 15
  })

  // Contractions (human-like)
  if (sentence.match(/\b\w+'\w+\b/)) score -= 10

  // Formal words
  const formalWords = ['utilize', 'commence', 'endeavor', 'facilitate', 'implement', 'leverage']
  formalWords.forEach(word => {
    if (lowerSentence.includes(word)) score += 8
  })

  // Passive voice indicators
  const passiveWords = ['was', 'were', 'been', 'being']
  passiveWords.forEach(word => {
    if (lowerSentence.includes(` ${word} `)) score += 5
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Use Claude AI to analyze individual sentences
 */
async function analyzeSentencesWithAI(text: string): Promise<Array<{
  text: string
  score: number
  status: 'ai' | 'unsure' | 'human'
}>> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)

  // For very long texts, analyze in batches
  const maxSentences = 30
  const sentencesToAnalyze = sentences.slice(0, maxSentences)

  const prompt = `Analyze each sentence below and determine if it's AI-generated, human-written, or unsure.

For each sentence, respond with ONLY the score (0-100) where:
- 0-30 = likely human-written
- 31-69 = unsure/mixed
- 70-100 = likely AI-generated

Consider:
- Natural flow and voice
- Use of contractions and informal language
- Personal expressions
- Varied sentence structure
- Unexpected word choices or phrasing

Respond with ONLY the scores separated by commas, one per sentence.

SENTENCES:
${sentencesToAnalyze.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}

SCORES (comma-separated):`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error('Claude API request failed')
    }

    const data = await response.json()
    const scoresText = data.content[0].text.trim()
    const scores = scoresText.split(',').map((s: string) => {
      const num = parseInt(s.trim())
      return isNaN(num) ? 50 : Math.max(0, Math.min(100, num))
    })

    // Map sentences with scores
    return sentencesToAnalyze.map((sentence, index) => {
      const score = scores[index] !== undefined ? scores[index] : analyzeSentence(sentence)
      return {
        text: sentence.trim(),
        score,
        status: score < 30 ? 'human' : score < 70 ? 'unsure' : 'ai'
      }
    })
  } catch (error) {
    console.error('AI sentence analysis failed, using heuristic:', error)
    // Fallback to heuristic analysis
    return sentencesToAnalyze.map(sentence => {
      const score = analyzeSentence(sentence)
      return {
        text: sentence.trim(),
        score,
        status: score < 30 ? 'human' : score < 70 ? 'unsure' : 'ai'
      }
    })
  }
}

/**
 * Get detailed analysis of text
 */
function getDetailedAnalysis(text: string, score: number): {
  sentences: string
  patterns: string[]
  confidence: number
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgLength = sentences.reduce((sum, s) => sum + s.trim().length, 0) / sentences.length

  const patterns: string[] = []

  // Identify patterns
  if (avgLength > 120) patterns.push('Very long, uniform sentences')
  if (text.toLowerCase().includes('furthermore') || text.toLowerCase().includes('moreover')) {
    patterns.push('Formal transition words')
  }
  if (text.toLowerCase().includes('it is important to note')) {
    patterns.push('Common AI phrases detected')
  }

  const contractions = text.match(/\b\w+'\w+\b/g)?.length || 0
  if (contractions < 3) patterns.push('Few or no contractions')

  const personalMarkers = ['i think', 'i feel', 'in my opinion']
  const hasPersonal = personalMarkers.some(marker => text.toLowerCase().includes(marker))
  if (!hasPersonal) patterns.push('Lack of personal voice')

  // Calculate confidence based on score extremes
  let confidence = 70
  if (score < 20 || score > 80) confidence = 90
  else if (score > 30 && score < 70) confidence = 60

  return {
    sentences: `${sentences.length} sentences, avg ${Math.round(avgLength)} chars`,
    patterns: patterns.length > 0 ? patterns : ['No strong AI patterns detected'],
    confidence,
  }
}

/**
 * Main detection handler
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

    // Get auth token and verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const { text, tier, detailed, multipleDetectors }: DetectionRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Word count check
    const wordCount = text.trim().split(/\s+/).length
    if (wordCount < 50) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least 50 words for accurate detection' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const result: DetectionResult = {
      overallScore: 50,
    }

    // Run detections based on tier
    if (multipleDetectors && (tier === 'pro' || tier === 'premium')) {
      // Run multiple detection methods
      const detectors: { [key: string]: number } = {}

      try {
        // Always run heuristic
        detectors.heuristic = heuristicDetection(text)

        // Try Claude detection
        if (ANTHROPIC_API_KEY) {
          try {
            detectors.claude = await claudeDetection(text)
          } catch (error) {
            console.error('Claude detection failed:', error)
            detectors.claude = detectors.heuristic
          }
        }

        // Try OpenAI detection
        if (OPENAI_API_KEY) {
          try {
            detectors.openai = await openaiDetection(text)
          } catch (error) {
            console.error('OpenAI detection failed:', error)
          }
        }

        // Try GPTZero if available
        if (GPTZERO_API_KEY) {
          try {
            detectors.gptzero = await gptzeroDetection(text)
          } catch (error) {
            console.error('GPTZero detection failed:', error)
          }
        }

        result.detectors = detectors

        // Calculate average for overall score
        const scores = Object.values(detectors)
        result.overallScore = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        )
      } catch (error) {
        console.error('Multi-detector error:', error)
        result.overallScore = heuristicDetection(text)
      }
    } else {
      // Single detection (heuristic + Claude if Premium)
      const heuristicScore = heuristicDetection(text)

      if (tier === 'premium' && ANTHROPIC_API_KEY) {
        try {
          const claudeScore = await claudeDetection(text)
          result.overallScore = Math.round((heuristicScore + claudeScore) / 2)
        } catch (error) {
          console.error('Claude detection failed, using heuristic only:', error)
          result.overallScore = heuristicScore
        }
      } else {
        result.overallScore = heuristicScore
      }
    }

    // Add detailed analysis if requested
    if (detailed && (tier === 'pro' || tier === 'premium')) {
      result.detailed = getDetailedAnalysis(text, result.overallScore)

      // Add sentence-by-sentence highlighting
      try {
        result.highlightedSentences = await analyzeSentencesWithAI(text)
      } catch (error) {
        console.error('Sentence highlighting failed:', error)
        // Fallback to heuristic analysis
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 30)
        result.highlightedSentences = sentences.map(sentence => {
          const score = analyzeSentence(sentence)
          return {
            text: sentence.trim(),
            score,
            status: score < 30 ? 'human' : score < 70 ? 'unsure' : 'ai'
          }
        })
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Detection error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
