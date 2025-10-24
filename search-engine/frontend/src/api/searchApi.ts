import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
  thumbnail?: string;
  source: 'bing' | 'brave' | 'google';
}

export interface AIAnswer {
  answer: string;
  sources: Array<{ title: string; url: string }>;
  confidence: 'high' | 'medium' | 'low';
}

export interface SearchResponse {
  results: SearchResult[];
  aiAnswer: AIAnswer | null;
  totalResults: number;
  searchTime: number;
  sources: string[];
  fromCache: boolean;
}

export const searchApi = {
  async search(query: string, aiEnabled: boolean = true): Promise<SearchResponse> {
    const response = await axios.post(`${API_BASE_URL}/search`, {
      query,
      type: 'web',
      page: 1,
      count: 10,
      aiEnabled
    });

    return response.data;
  },

  async getSuggestions(query: string): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/search/suggestions`, {
      params: { q: query }
    });

    return response.data.suggestions;
  },

  async getTrending(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/search/trending`);
    return response.data.trending;
  }
};
