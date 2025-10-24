import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

// Tier-based model configuration
// Model selection is now handled per-request based on usage tracking
// FREE: Limited cheap (Haiku)
// BASIC: Unlimited cheap (Haiku) + Very Limited premium (Sonnet)
// PRO: Unlimited cheap (Haiku) + Expanded premium (Sonnet)
// PREMIUM: Unlimited everything (Sonnet)

const MODEL_CONFIG = {
  cheap: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 2048,
    temperature: 0.7
  },
  premium: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
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
 * Humanize AI-generated text using Claude
 * @param {string} text - AI-generated text to humanize
 * @param {array} styleSamples - Optional writing style samples for personalization
 * @param {string} tier - User subscription tier
 * @returns {Promise<string>} Humanized text
 */
export async function humanizeText(text, styleSamples = [], tier = 'free') {
  // Use premium for Pro/Premium with style matching, cheap for others
  const usePremium = (tier === 'pro' || tier === 'premium') && styleSamples.length > 0;
  const config = getTierConfig(tier, usePremium);

  let systemPrompt = `You are an expert at making AI-generated text sound natural, human, and authentic. Your goal is to:

1. Remove overly formal or robotic language
2. Add natural variations and personal voice
3. Use contractions and conversational tone where appropriate
4. Add subtle imperfections that humans naturally make
5. Vary sentence structure and length
6. Include transitions that sound natural
7. Make the writing feel genuine and relatable

Transform the text while preserving:
- The original meaning and key points
- The overall structure and flow
- Factual accuracy
- Appropriate academic or professional tone when needed`;

  // Style samples only available for Pro/Premium
  if (styleSamples.length > 0 && (tier === 'pro' || tier === 'premium')) {
    systemPrompt += `\n\nThe user has provided writing samples. Match the writing style, tone, and voice patterns from these samples:\n\n${styleSamples.map((s, i) => `Sample ${i + 1}:\n${s.content.substring(0, 500)}...\n`).join('\n')}`;
  }

  const message = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please humanize the following text, making it sound natural and authentic while preserving the meaning:\n\n${text}`
      }
    ]
  });

  return message.content[0].text;
}

/**
 * Generate an essay using Claude
 * @param {string} topic - Essay topic
 * @param {string} essayType - Type of essay
 * @param {number} wordCount - Target word count
 * @param {object} outline - Optional outline to follow
 * @param {array} sources - Optional sources to cite
 * @param {string} tier - User subscription tier
 * @returns {Promise<string>} Generated essay
 */
export async function generateEssay(topic, essayType = 'argumentative', wordCount = 1000, outline = null, sources = [], tier = 'free') {
  // Use premium for Pro/Premium, cheap for Free/Basic
  const usePremium = tier === 'pro' || tier === 'premium';
  const config = getTierConfig(tier, usePremium);

  // Tier-based word count limits
  const maxWords = tier === 'free' ? 500 : tier === 'basic' ? 1000 : tier === 'pro' ? 2000 : 3000;
  const actualWordCount = Math.min(wordCount, maxWords);

  let prompt = `Write a ${actualWordCount}-word ${essayType} essay on the following topic:\n\n"${topic}"\n\n`;

  if (outline) {
    prompt += `Follow this outline:\n${JSON.stringify(outline, null, 2)}\n\n`;
  }

  if (sources.length > 0) {
    prompt += `Include citations from these sources:\n${sources.map((s, i) => `${i + 1}. ${s.title} by ${s.author}`).join('\n')}\n\n`;
  }

  prompt += `Requirements:
- Create a compelling introduction with a clear thesis
- Develop well-structured body paragraphs with strong arguments
- Use evidence and examples to support claims
- Write a thoughtful conclusion
- Maintain academic tone while being engaging
- Target approximately ${actualWordCount} words
${sources.length > 0 ? '- Include in-text citations in APA format' : ''}`;

  const message = await anthropic.messages.create({
    model: config.model,
    max_tokens: Math.min(config.maxTokens, Math.ceil(actualWordCount * 2)),
    temperature: config.temperature,
    system: 'You are an expert academic writer. Write clear, well-structured essays with strong arguments and proper organization. Your writing should be engaging yet scholarly.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return message.content[0].text;
}

/**
 * Check grammar and spelling using Claude
 * @param {string} text - Text to check
 * @param {string} tier - User subscription tier
 * @returns {Promise<object>} Grammar analysis and corrections
 */
export async function checkGrammar(text, tier = 'free') {
  // Use premium for detailed grammar (Pro/Premium), cheap for basic
  const usePremium = tier === 'pro' || tier === 'premium';
  const config = getTierConfig(tier, usePremium);

  // Free/Basic: Simple corrections only
  // Pro/Premium: Detailed analysis with suggestions
  const includeDetailed = tier === 'pro' || tier === 'premium';

  const prompt = includeDetailed
    ? `Analyze the following text for grammar, spelling, punctuation, and style issues. Provide detailed feedback and corrections.

Text:
"""
${text}
"""

Return your analysis in JSON format:
{
  "overallScore": <number 0-100>,
  "issuesFound": <number>,
  "corrections": [
    {
      "type": "grammar|spelling|punctuation|style",
      "severity": "major|minor",
      "original": "original text",
      "corrected": "corrected text",
      "explanation": "why this is an issue",
      "position": {
        "start": <character index>,
        "end": <character index>
      }
    }
  ],
  "correctedText": "full corrected version of the text",
  "suggestions": [
    {
      "type": "style|clarity|conciseness",
      "suggestion": "improvement suggestion",
      "example": "example of improved version"
    }
  ]
}`
    : `Check the following text for basic grammar and spelling errors. Provide a simple analysis.

Text:
"""
${text}
"""

Return your analysis in JSON format:
{
  "overallScore": <number 0-100>,
  "issuesFound": <number>,
  "correctedText": "corrected version of the text"
}`;

  const message = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: 0.3,
    system: 'You are an expert grammar checker and writing coach. Identify all grammar, spelling, punctuation, and style issues. Provide clear explanations and corrections. Always return valid JSON.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Extract JSON from response
  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Fallback if JSON parsing fails
  return {
    overallScore: 85,
    issuesFound: 0,
    corrections: [],
    correctedText: text,
    suggestions: []
  };
}

export default anthropic;
