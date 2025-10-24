import OpenAI from 'openai';
import { SearchResult } from './searchAggregator';

export interface AIAnswer {
  answer: string;
  sources: Array<{ title: string; url: string }>;
  confidence: 'high' | 'medium' | 'low';
}

export interface EnhancedQuery {
  enhancedQuery: string;
  intent: 'informational' | 'navigational' | 'transactional';
  keywords: string[];
}

class AIEnhancer {
  private openai: OpenAI;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('OpenAI API key not configured - AI features disabled');
      // Create a dummy instance to avoid null checks
      this.openai = null as any;
    }
  }

  async enhanceQuery(userQuery: string): Promise<EnhancedQuery> {
    if (!this.enabled) {
      return {
        enhancedQuery: userQuery,
        intent: 'informational',
        keywords: userQuery.split(' ').filter(w => w.length > 2)
      };
    }

    try {
      const prompt = `User search query: "${userQuery}"

Task: Improve this search query to get better results.
- Identify the core intent
- Add relevant keywords if helpful
- Fix spelling/grammar if needed
- Expand abbreviations

Return ONLY a valid JSON object with this structure:
{
  "enhancedQuery": "improved query here",
  "intent": "informational or navigational or transactional",
  "keywords": ["key", "words", "here"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      });

      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);

      return {
        enhancedQuery: parsed.enhancedQuery || userQuery,
        intent: parsed.intent || 'informational',
        keywords: parsed.keywords || []
      };
    } catch (error: any) {
      console.error('Query enhancement error:', error.message);
      return {
        enhancedQuery: userQuery,
        intent: 'informational',
        keywords: userQuery.split(' ').filter(w => w.length > 2)
      };
    }
  }

  async generateAnswer(query: string, searchResults: SearchResult[]): Promise<AIAnswer> {
    if (!this.enabled) {
      return {
        answer: 'AI answers are currently unavailable. Please review the search results below.',
        sources: [],
        confidence: 'low'
      };
    }

    try {
      const topResults = searchResults.slice(0, 8);
      const context = topResults.map((r, i) =>
        `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`
      ).join('\n\n');

      const prompt = `User question: "${query}"

Search results:
${context}

Task: Provide a comprehensive, accurate answer to the user's question based on the search results above.

Requirements:
- Be concise but thorough (2-4 sentences maximum)
- Cite sources using [1], [2] notation where the information came from
- If results are contradictory or unclear, mention that
- If you cannot answer confidently based on the results, say so
- Use natural, conversational language
- DO NOT make up information not in the search results

Answer:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      });

      const answer = response.choices[0].message.content || 'Unable to generate answer.';

      // Determine confidence based on answer content
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (answer.toLowerCase().includes("cannot") || answer.toLowerCase().includes("unclear")) {
        confidence = 'low';
      } else if (answer.match(/\[\d+\]/g)?.length || 0 >= 2) {
        confidence = 'high';
      }

      return {
        answer,
        sources: topResults.slice(0, 5).map(r => ({ title: r.title, url: r.url })),
        confidence
      };
    } catch (error: any) {
      console.error('AI answer generation error:', error.message);

      // Fallback to simple extraction
      const firstSnippet = searchResults[0]?.snippet || 'No information available.';
      return {
        answer: `Based on the search results: ${firstSnippet} [1]`,
        sources: searchResults.slice(0, 3).map(r => ({ title: r.title, url: r.url })),
        confidence: 'low'
      };
    }
  }

  async rankResults(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    // For now, return results as-is (can add AI ranking later for cost optimization)
    // AI ranking would use GPT-3.5 to reorder by relevance
    return results;
  }
}

export const aiEnhancer = new AIEnhancer();
