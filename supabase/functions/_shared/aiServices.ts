/**
 * AI Services Integration Layer
 * Unified interface for all AI APIs (OpenAI, Anthropic, etc.)
 */

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'cohere' | 'huggingface'
  apiKey: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface GenerationOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  systemPrompt?: string
}

export interface EssayGenerationRequest {
  topic: string
  type: 'argumentative' | 'narrative' | 'descriptive' | 'expository' | 'persuasive'
  length: number // word count
  academicLevel: 'high_school' | 'undergraduate' | 'graduate' | 'professional'
  additionalInstructions?: string
  outline?: string[]
  citations?: boolean
  tone?: 'formal' | 'casual' | 'academic' | 'creative'
}

export interface HumanizationRequest {
  text: string
  level: 'light' | 'moderate' | 'heavy'
  preserveKeywords?: string[]
  maintainLength?: boolean
  targetReadability?: number // Flesch reading ease score
}

export interface AIDetectionRequest {
  text: string
  provider?: 'gptzero' | 'originality' | 'copyleaks'
  detailed?: boolean
}

export interface PlagiarismCheckRequest {
  text: string
  excludeQuotes?: boolean
  excludeReferences?: boolean
}

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost?: number
  }
}

/**
 * Base AI Service Class
 */
abstract class BaseAIService {
  protected config: AIServiceConfig

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  abstract generateText(prompt: string, options?: GenerationOptions): Promise<AIResponse<string>>
  abstract generateEssay(request: EssayGenerationRequest): Promise<AIResponse<string>>
  abstract humanizeText(request: HumanizationRequest): Promise<AIResponse<string>>

  /**
   * Calculate token usage cost
   */
  protected calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, number> = {
      'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01 / 1000,
      'gpt-3.5-turbo': 0.002 / 1000,
      'claude-3-opus': 0.015 / 1000,
      'claude-3-sonnet': 0.003 / 1000,
      'claude-3-haiku': 0.00025 / 1000
    }

    return tokens * (pricing[model] || 0.001 / 1000)
  }
}

/**
 * OpenAI Service Implementation
 */
export class OpenAIService extends BaseAIService {
  private baseUrl = 'https://api.openai.com/v1'

  async generateText(prompt: string, options?: GenerationOptions): Promise<AIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4-turbo-preview',
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: options?.maxTokens || this.config.maxTokens || 1000,
          temperature: options?.temperature || this.config.temperature || 0.7,
          top_p: options?.topP || 1,
          frequency_penalty: options?.frequencyPenalty || 0,
          presence_penalty: options?.presencePenalty || 0,
          stop: options?.stopSequences
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API error')
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''
      const usage = data.usage

      return {
        success: true,
        data: content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cost: this.calculateCost(usage.total_tokens, this.config.model || 'gpt-4')
        }
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateEssay(request: EssayGenerationRequest): Promise<AIResponse<string>> {
    const systemPrompt = `You are an expert academic writer. Generate a high-quality ${request.type} essay on the given topic.

Requirements:
- Length: approximately ${request.length} words
- Academic level: ${request.academicLevel}
- Tone: ${request.tone || 'academic'}
- Include proper structure with introduction, body paragraphs, and conclusion
${request.citations ? '- Include in-text citations and references where appropriate' : ''}
${request.outline ? `- Follow this outline: ${request.outline.join(', ')}` : ''}
${request.additionalInstructions || ''}`

    const userPrompt = `Write an essay on the topic: "${request.topic}"`

    return this.generateText(userPrompt, {
      systemPrompt,
      maxTokens: Math.ceil(request.length * 1.5), // Allow some extra tokens
      temperature: 0.7
    })
  }

  async humanizeText(request: HumanizationRequest): Promise<AIResponse<string>> {
    const systemPrompt = `You are an expert at rewriting text to make it sound more natural and human-like while preserving the original meaning.

Level: ${request.level}
- Light: Minor adjustments to sentence structure and word choice
- Moderate: Significant rewording while keeping key information intact
- Heavy: Complete rewrite in a natural, conversational style

${request.preserveKeywords ? `Preserve these keywords exactly: ${request.preserveKeywords.join(', ')}` : ''}
${request.maintainLength ? 'Maintain approximately the same length as the original text.' : ''}
${request.targetReadability ? `Target readability score: ${request.targetReadability} (Flesch Reading Ease)` : ''}`

    const userPrompt = `Humanize the following text:\n\n${request.text}`

    return this.generateText(userPrompt, {
      systemPrompt,
      temperature: request.level === 'heavy' ? 0.9 : request.level === 'moderate' ? 0.7 : 0.5
    })
  }
}

/**
 * Anthropic Claude Service Implementation
 */
export class AnthropicService extends BaseAIService {
  private baseUrl = 'https://api.anthropic.com/v1'

  async generateText(prompt: string, options?: GenerationOptions): Promise<AIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-opus-20240229',
          messages: [
            { role: 'user', content: prompt }
          ],
          system: options?.systemPrompt,
          max_tokens: options?.maxTokens || this.config.maxTokens || 1000,
          temperature: options?.temperature || this.config.temperature || 0.7,
          top_p: options?.topP || 1,
          stop_sequences: options?.stopSequences
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Anthropic API error')
      }

      const data = await response.json()
      const content = data.content[0]?.text || ''
      const usage = data.usage

      return {
        success: true,
        data: content,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
          cost: this.calculateCost(usage.input_tokens + usage.output_tokens, this.config.model || 'claude-3-opus')
        }
      }
    } catch (error: any) {
      console.error('Anthropic API error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateEssay(request: EssayGenerationRequest): Promise<AIResponse<string>> {
    // Similar implementation to OpenAI
    const systemPrompt = `You are Claude, an expert academic writer. Generate a high-quality ${request.type} essay.

Requirements:
- Length: approximately ${request.length} words
- Academic level: ${request.academicLevel}
- Tone: ${request.tone || 'academic'}
- Structure: introduction, body paragraphs with clear topic sentences, and conclusion
${request.citations ? '- Include proper citations' : ''}
${request.outline ? `- Follow outline: ${request.outline.join(', ')}` : ''}`

    return this.generateText(
      `Write a ${request.type} essay on: "${request.topic}"\n\n${request.additionalInstructions || ''}`,
      { systemPrompt, maxTokens: Math.ceil(request.length * 1.5), temperature: 0.7 }
    )
  }

  async humanizeText(request: HumanizationRequest): Promise<AIResponse<string>> {
    const systemPrompt = `You are Claude, an expert at making text sound natural and human-like.

Humanization level: ${request.level}
${request.preserveKeywords ? `Preserve keywords: ${request.preserveKeywords.join(', ')}` : ''}
${request.maintainLength ? 'Keep similar length to original.' : ''}

Make the text flow naturally while preserving core meaning.`

    return this.generateText(
      `Humanize this text (${request.level} level):\n\n${request.text}`,
      { systemPrompt, temperature: request.level === 'heavy' ? 0.9 : 0.7 }
    )
  }
}

/**
 * AI Detection Service (GPTZero, Originality.ai, etc.)
 */
export class AIDetectionService {
  private providers: Record<string, AIDetectionProvider> = {}

  constructor() {
    // Initialize providers based on available API keys
    if (Deno.env.get('GPTZERO_API_KEY')) {
      this.providers.gptzero = new GPTZeroProvider(Deno.env.get('GPTZERO_API_KEY')!)
    }
    if (Deno.env.get('ORIGINALITY_API_KEY')) {
      this.providers.originality = new OriginalityProvider(Deno.env.get('ORIGINALITY_API_KEY')!)
    }
  }

  async detectAI(request: AIDetectionRequest): Promise<AIResponse<any>> {
    const provider = request.provider || Object.keys(this.providers)[0]

    if (!this.providers[provider]) {
      return {
        success: false,
        error: `AI detection provider '${provider}' not configured`
      }
    }

    return this.providers[provider].detect(request.text, request.detailed)
  }
}

/**
 * Base AI Detection Provider
 */
abstract class AIDetectionProvider {
  protected apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  abstract detect(text: string, detailed?: boolean): Promise<AIResponse<any>>
}

/**
 * GPTZero Provider
 */
class GPTZeroProvider extends AIDetectionProvider {
  private baseUrl = 'https://api.gptzero.me/v2'

  async detect(text: string, detailed?: boolean): Promise<AIResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/predict/text`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document: text,
          version: '2024'
        })
      })

      if (!response.ok) {
        throw new Error('GPTZero API error')
      }

      const data = await response.json()

      return {
        success: true,
        data: {
          isAI: data.documents[0].completely_generated_prob > 0.65,
          aiProbability: data.documents[0].completely_generated_prob,
          humanProbability: 1 - data.documents[0].completely_generated_prob,
          sentences: detailed ? data.documents[0].sentences : undefined,
          averagePerplexity: data.documents[0].average_generated_prob,
          perplexity: data.documents[0].overall_burstiness
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * Originality.ai Provider
 */
class OriginalityProvider extends AIDetectionProvider {
  private baseUrl = 'https://api.originality.ai/api/v1'

  async detect(text: string, detailed?: boolean): Promise<AIResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/ai`, {
        method: 'POST',
        headers: {
          'X-OAI-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: text,
          aiModelVersion: '1',
          storeScan: false
        })
      })

      if (!response.ok) {
        throw new Error('Originality.ai API error')
      }

      const data = await response.json()

      return {
        success: true,
        data: {
          isAI: data.score.ai > 0.5,
          aiProbability: data.score.ai,
          humanProbability: data.score.original,
          confidence: data.score.confidence,
          sentences: detailed ? data.sentences : undefined
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * Plagiarism Detection Service
 */
export class PlagiarismDetectionService {
  private copyscapeUsername: string
  private copyscapeApiKey: string

  constructor() {
    this.copyscapeUsername = Deno.env.get('COPYSCAPE_USERNAME') || ''
    this.copyscapeApiKey = Deno.env.get('COPYSCAPE_API_KEY') || ''
  }

  async checkPlagiarism(request: PlagiarismCheckRequest): Promise<AIResponse<any>> {
    if (!this.copyscapeUsername || !this.copyscapeApiKey) {
      return {
        success: false,
        error: 'Copyscape not configured'
      }
    }

    try {
      const params = new URLSearchParams({
        u: this.copyscapeUsername,
        k: this.copyscapeApiKey,
        t: request.text,
        e: 'UTF-8',
        c: '3', // Return up to 3 results
        f: 'json'
      })

      const response = await fetch(`https://www.copyscape.com/api/?${params}`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Copyscape API error')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const results = data.result || []
      const plagiarismFound = results.length > 0
      const percentPlagiarized = results.reduce((sum: number, r: any) => sum + (r.percentmatched || 0), 0) / results.length || 0

      return {
        success: true,
        data: {
          plagiarismDetected: plagiarismFound,
          percentPlagiarized,
          sources: results.map((r: any) => ({
            url: r.url,
            title: r.title,
            percentMatched: r.percentmatched,
            wordsMatched: r.wordsmatched,
            excerpt: r.htmlsnippet
          }))
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * Grammar and Style Checking Service
 */
export class GrammarCheckService {
  private languageToolApiKey: string

  constructor() {
    this.languageToolApiKey = Deno.env.get('LANGUAGETOOL_API_KEY') || ''
  }

  async checkGrammar(text: string, language: string = 'en-US'): Promise<AIResponse<any>> {
    try {
      const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${this.languageToolApiKey}`
        },
        body: new URLSearchParams({
          text,
          language,
          enabledRules: '',
          disabledRules: ''
        })
      })

      if (!response.ok) {
        throw new Error('LanguageTool API error')
      }

      const data = await response.json()

      return {
        success: true,
        data: {
          errors: data.matches.filter((m: any) => m.rule.issueType === 'grammar'),
          warnings: data.matches.filter((m: any) => m.rule.issueType === 'style'),
          suggestions: data.matches.map((m: any) => ({
            message: m.message,
            offset: m.offset,
            length: m.length,
            replacements: m.replacements.map((r: any) => r.value),
            type: m.rule.issueType,
            category: m.rule.category.name
          }))
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * AI Service Factory
 */
export class AIServiceFactory {
  static createEssayService(provider: 'openai' | 'anthropic' = 'openai'): BaseAIService {
    if (provider === 'anthropic') {
      return new AnthropicService({
        provider: 'anthropic',
        apiKey: Deno.env.get('VITE_ANTHROPIC_API_KEY')!,
        model: 'claude-3-opus-20240229'
      })
    }

    return new OpenAIService({
      provider: 'openai',
      apiKey: Deno.env.get('VITE_OPENAI_API_KEY')!,
      model: 'gpt-4-turbo-preview'
    })
  }

  static createHumanizationService(): BaseAIService {
    // Prefer Claude for humanization
    if (Deno.env.get('VITE_ANTHROPIC_API_KEY')) {
      return new AnthropicService({
        provider: 'anthropic',
        apiKey: Deno.env.get('VITE_ANTHROPIC_API_KEY')!,
        model: 'claude-3-opus-20240229'
      })
    }

    return new OpenAIService({
      provider: 'openai',
      apiKey: Deno.env.get('VITE_OPENAI_API_KEY')!,
      model: 'gpt-4-turbo-preview'
    })
  }

  static createDetectionService(): AIDetectionService {
    return new AIDetectionService()
  }

  static createPlagiarismService(): PlagiarismDetectionService {
    return new PlagiarismDetectionService()
  }

  static createGrammarService(): GrammarCheckService {
    return new GrammarCheckService()
  }
}