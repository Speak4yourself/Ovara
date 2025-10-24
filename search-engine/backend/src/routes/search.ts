import { Router, Request, Response, NextFunction } from 'express';
import { searchAggregator } from '../services/searchAggregator';
import { aiEnhancer } from '../services/aiEnhancer';
import { cacheService } from '../services/cacheService';
import { searchRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schema
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(['web', 'images', 'videos', 'news']).optional().default('web'),
  page: z.number().int().min(1).max(10).optional().default(1),
  count: z.number().int().min(1).max(50).optional().default(10),
  aiEnabled: z.boolean().optional().default(true)
});

// POST /api/search - Main search endpoint
router.post('/', searchRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, type, count, aiEnabled } = searchSchema.parse(req.body);

    // Check cache first
    const cached = await cacheService.get(query, type);
    if (cached) {
      return res.json({
        results: cached.results,
        aiAnswer: cached.aiAnswer,
        totalResults: cached.results.length,
        searchTime: 0,
        sources: ['cache'],
        fromCache: true
      });
    }

    // Step 1: Optionally enhance query with AI
    let searchQuery = query;
    if (aiEnabled) {
      const enhanced = await aiEnhancer.enhanceQuery(query);
      searchQuery = enhanced.enhancedQuery;
      console.log(`🔍 Original: "${query}" → Enhanced: "${searchQuery}"`);
    }

    // Step 2: Aggregate search results
    const searchResponse = await searchAggregator.aggregateSearch(searchQuery, count);

    // Step 3: Generate AI answer
    let aiAnswer = null;
    if (aiEnabled && searchResponse.results.length > 0) {
      aiAnswer = await aiEnhancer.generateAnswer(query, searchResponse.results);
    }

    // Step 4: Cache the results
    await cacheService.set(
      query,
      { results: searchResponse.results, aiAnswer },
      parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
      type
    );

    // Step 5: Return response
    res.json({
      results: searchResponse.results,
      aiAnswer,
      totalResults: searchResponse.totalResults,
      searchTime: searchResponse.searchTime,
      sources: searchResponse.sources,
      fromCache: false
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Invalid search parameters', 400));
    }
    next(error);
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    // For now, return empty (could integrate with Bing Autosuggest API)
    return res.json({
      suggestions: [
        `${query} tutorial`,
        `${query} guide`,
        `${query} examples`,
        `best ${query}`,
        `how to ${query}`
      ]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/trending - Get trending searches
router.get('/trending', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock trending queries (could be pulled from database)
    return res.json({
      trending: [
        'AI tools 2025',
        'ChatGPT alternatives',
        'Best coding practices',
        'React 19 features',
        'TypeScript tips'
      ]
    });
  } catch (error) {
    next(error);
  }
});

export { router as searchRouter };
