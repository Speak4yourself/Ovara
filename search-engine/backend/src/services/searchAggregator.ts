import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
  thumbnail?: string;
  source: 'brave' | 'serpapi' | 'google';
}

export interface AggregatedSearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  sources: string[];
}

class SearchAggregator {
  private braveApiKey: string;
  private serpApiKey: string;

  constructor() {
    this.braveApiKey = process.env.BRAVE_API_KEY || '';
    this.serpApiKey = process.env.SERPAPI_KEY || '';
  }

  async searchSerpAPI(query: string, count: number = 10): Promise<SearchResult[]> {
    if (!this.serpApiKey) {
      console.warn('SerpAPI key not configured, skipping SerpAPI search');
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          num: count,
          api_key: this.serpApiKey,
          engine: 'google'
        },
        timeout: 5000
      });

      const organicResults = response.data.organic_results || [];

      return organicResults.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || '',
        displayUrl: item.displayed_link || new URL(item.link).hostname,
        thumbnail: item.thumbnail,
        source: 'serpapi' as const
      }));
    } catch (error: any) {
      console.error('SerpAPI search error:', error.message);
      return [];
    }
  }

  async searchBrave(query: string, count: number = 10): Promise<SearchResult[]> {
    if (!this.braveApiKey) {
      console.warn('Brave API key not configured, skipping Brave search');
      return [];
    }

    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: count
        },
        headers: {
          'X-Subscription-Token': this.braveApiKey,
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      const results = response.data.web?.results || [];

      return results.map((item: any) => ({
        title: item.title,
        url: item.url,
        snippet: item.description,
        displayUrl: new URL(item.url).hostname,
        source: 'brave' as const
      }));
    } catch (error: any) {
      console.error('Brave search error:', error.message);
      return [];
    }
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const deduplicated: SearchResult[] = [];

    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.url);

      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove www, trailing slashes, and query params for deduplication
      return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  async aggregateSearch(query: string, count: number = 10): Promise<AggregatedSearchResponse> {
    const startTime = Date.now();
    const sources: string[] = [];

    // SMART HYBRID STRATEGY:
    // 1. Always try Brave first (cheap - $0.50/1K searches)
    // 2. Only use SerpAPI if Brave fails or returns poor results

    console.log(`🔍 Searching: "${query}"`);

    // Step 1: Try Brave first
    let braveResults: SearchResult[] = [];
    try {
      braveResults = await this.searchBrave(query, count);
      if (braveResults.length > 0) {
        sources.push('brave');
        console.log(`✅ Brave returned ${braveResults.length} results`);
      }
    } catch (error: any) {
      console.error('❌ Brave search failed:', error.message);
    }

    // Step 2: Decide if we need SerpAPI backup
    const needsSerpAPI = this.shouldUseSerpAPI(query, braveResults);

    let serpResults: SearchResult[] = [];
    if (needsSerpAPI) {
      console.log(`🔄 Using SerpAPI backup (Brave insufficient)`);
      try {
        serpResults = await this.searchSerpAPI(query, count);
        if (serpResults.length > 0) {
          sources.push('serpapi');
          console.log(`✅ SerpAPI returned ${serpResults.length} results`);
        }
      } catch (error: any) {
        console.error('❌ SerpAPI search failed:', error.message);
      }
    } else {
      console.log(`💰 Skipping SerpAPI - Brave results sufficient`);
    }

    // Combine results - Brave first (prioritize cheaper source)
    const allResults: SearchResult[] = [
      ...braveResults,
      ...serpResults
    ];

    if (allResults.length === 0) {
      throw new AppError('No search results found from any provider', 503);
    }

    // Deduplicate and limit
    const deduplicated = this.deduplicateResults(allResults);
    const limitedResults = deduplicated.slice(0, count);

    const searchTime = Date.now() - startTime;

    return {
      results: limitedResults,
      totalResults: limitedResults.length,
      searchTime,
      sources
    };
  }

  // Smart decision: when to use expensive SerpAPI
  private shouldUseSerpAPI(query: string, braveResults: SearchResult[]): boolean {
    // Don't use SerpAPI if we don't have the key
    if (!this.serpApiKey) {
      return false;
    }

    // Use SerpAPI if Brave returned too few results
    if (braveResults.length < 3) {
      console.log(`📊 Low results from Brave (${braveResults.length}), using SerpAPI`);
      return true;
    }

    // Use SerpAPI for very long/complex queries
    if (query.length > 100) {
      console.log(`📝 Long query (${query.length} chars), using SerpAPI for better results`);
      return true;
    }

    // Use SerpAPI for certain query patterns that need Google quality
    const needsGoogleQuality = [
      /^how to/i,           // "how to" questions
      /^what is/i,          // definitions
      /^who is/i,           // people searches
      /^where is/i,         // location searches
      /tutorial$/i,         // tutorials
      /guide$/i,            // guides
    ];

    for (const pattern of needsGoogleQuality) {
      if (pattern.test(query)) {
        console.log(`🎯 Query pattern matches complex search, using SerpAPI`);
        return true;
      }
    }

    // Otherwise, Brave is good enough
    return false;
  }
}

export const searchAggregator = new SearchAggregator();
