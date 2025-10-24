import OpenAI from 'openai';

// Initialize OpenAI client only if API key is provided
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
}) : null;

// Tier-based model configuration
// Model selection is now handled per-request based on usage tracking
// FREE: Limited cheap (GPT-3.5)
// BASIC: Unlimited cheap (GPT-3.5) + Very Limited premium (GPT-4o-mini)
// PRO: Unlimited cheap (GPT-3.5) + Expanded premium (GPT-4o-mini)
// PREMIUM: Unlimited everything (GPT-4o-mini)

const MODEL_CONFIG = {
  cheap: {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },
  premium: {
    model: 'gpt-4o-mini',
    maxTokens: 4000,
    temperature: 0.8
  }
};

// Get configuration based on tier and model type
function getTierConfig(tier = 'free', usePremium = false) {
  // For now, return cheap by default
  // Premium model selection will be handled by usage tracking
  return usePremium ? MODEL_CONFIG.premium : MODEL_CONFIG.cheap;
}

/**
 * Generate a citation using ChatGPT
 * @param {string} style - Citation style (APA, MLA, Chicago, etc.)
 * @param {string} sourceType - Type of source (website, book, journal, video)
 * @param {object} data - Source data (title, author, etc.)
 * @param {string} tier - User subscription tier
 * @returns {Promise<string>} Formatted citation
 */
export async function generateCitation(style, sourceType, data, tier = 'free') {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  // Use cheap model for all tiers (premium not needed for citations)
  const config = getTierConfig(tier, false);

  const prompt = `Generate a ${style} citation for a ${sourceType} with the following information:
${JSON.stringify(data, null, 2)}

Provide only the formatted citation, nothing else. Ensure it follows ${style} 7th edition guidelines exactly.`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert academic citation generator. Generate accurate citations following the specified style guide exactly. Return only the citation text, no explanations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: Math.min(config.maxTokens, 500)
  });

  return response.choices[0].message.content.trim();
}

/**
 * Detect AI-generated content using ChatGPT
 * @param {string} text - Text to analyze
 * @param {boolean} detailed - Whether to provide detailed analysis
 * @param {string} tier - User subscription tier
 * @returns {Promise<object>} Detection results with score and analysis
 */
export async function detectAIContent(text, detailed = false, tier = 'free') {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  // Use premium for detailed analysis (Pro/Premium) or cheap for basic
  const usePremium = detailed && (tier === 'pro' || tier === 'premium');
  const config = getTierConfig(tier, usePremium);

  // Free tier: basic detection only
  // Basic tier: basic detection with simple analysis
  // Pro tier: detailed sentence analysis
  // Premium tier: multiple detector comparison + detailed analysis

  const isDetailed = detailed && (tier === 'pro' || tier === 'premium');

  const prompt = isDetailed
    ? `Analyze the following text and determine if it was written by AI or a human. Provide:
1. A percentage score (0-100) where 0 = definitely human, 100 = definitely AI
2. Specific patterns that suggest AI or human writing
3. Sentence-by-sentence analysis with scores
4. Overall confidence level

Text to analyze:
"""
${text}
"""

Respond in JSON format:
{
  "overallScore": <number 0-100>,
  "confidence": <number 0-100>,
  "patterns": ["pattern1", "pattern2", ...],
  "highlightedSentences": [
    {"text": "sentence", "score": <number 0-100>, "status": "ai|human|unsure"}
  ]
}`
    : `Analyze the following text and determine if it was written by AI or a human. Provide only a percentage score (0-100) where 0 = definitely human, 100 = definitely AI.

Text to analyze:
"""
${text}
"""

Respond in JSON format: {"overallScore": <number>}`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI content detector. Analyze text carefully for signs of AI generation such as repetitive patterns, lack of personal voice, overly formal structure, and generic phrasing. Respond only with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: isDetailed ? config.maxTokens : Math.min(config.maxTokens, 200),
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result;
}

/**
 * Generate an outline from an idea using ChatGPT
 * @param {string} idea - Main idea or topic
 * @param {string} essayType - Type of essay (argumentative, expository, etc.)
 * @param {number} length - Target length in words
 * @param {string} tier - User subscription tier
 * @returns {Promise<object>} Outline with sections
 */
export async function generateOutline(idea, essayType = 'general', length = 1000, tier = 'free') {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  // Use cheap model for all tiers
  const config = getTierConfig(tier, false);

  // Adjust outline complexity based on tier
  const bodyPoints = tier === 'free' ? 3 : tier === 'basic' ? 4 : 5;

  const prompt = `Create a detailed essay outline for the following topic:

Topic: ${idea}
Essay Type: ${essayType}
Target Length: ~${length} words

Provide a structured outline with:
- Introduction (with thesis statement)
- Body paragraphs (${bodyPoints} main points with sub-points)
- Conclusion

Return the outline in JSON format:
{
  "title": "suggested title",
  "thesis": "thesis statement",
  "introduction": {
    "hook": "opening hook",
    "background": "background info",
    "thesis": "thesis statement"
  },
  "body": [
    {
      "mainPoint": "main argument",
      "subPoints": ["supporting point 1", "supporting point 2"],
      "evidence": "suggested evidence or examples"
    }
  ],
  "conclusion": {
    "summary": "summary of main points",
    "finalThought": "closing thought or call to action"
  }
}`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert essay planning assistant. Create detailed, well-structured outlines that help students organize their ideas effectively. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result;
}

/**
 * Analyze essay quality using ChatGPT
 * @param {string} essay - Essay text to analyze
 * @param {string} tier - User subscription tier
 * @returns {Promise<object>} Analysis with grades and feedback
 */
export async function analyzeEssay(essay, tier = 'free') {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  // Use premium for Pro/Premium, cheap for Free/Basic
  const usePremium = tier === 'pro' || tier === 'premium';
  const config = getTierConfig(tier, usePremium);

  // Tier-based analysis depth
  const includeDetailed = tier === 'pro' || tier === 'premium';

  const prompt = `Analyze the following essay and provide a comprehensive evaluation:

Essay:
"""
${essay}
"""

Provide analysis in JSON format:
{
  "overallGrade": <string A-F>,
  "predictedScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "readabilityLevel": <string like "High School", "College", etc.>,
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "argumentStrength": <number 0-100>,
  "thesis": {
    "found": <boolean>,
    "text": "thesis statement or null",
    "clarity": <number 0-100>
  },
  "structure": {
    "score": <number 0-100>,
    "feedback": "structural feedback"
  },
  "grammar": {
    "score": <number 0-100>,
    "majorIssues": <number>,
    "minorIssues": <number>
  },
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert essay grader and writing coach. Analyze essays comprehensively, providing constructive feedback on thesis, structure, argument strength, grammar, and overall quality. Be fair but thorough. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: includeDetailed ? config.maxTokens : Math.min(config.maxTokens, 1500),
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result;
}

export default openai;
