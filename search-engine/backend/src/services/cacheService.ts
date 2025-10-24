import Redis from 'ioredis';

export interface CachedSearchResult {
  results: any[];
  aiAnswer: any;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private memoryCache: Map<string, CachedSearchResult> = new Map();

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('Redis connection failed, falling back to memory cache');
              return null;
            }
            return Math.min(times * 100, 2000);
          }
        });

        this.redis.on('connect', () => {
          console.log('✅ Redis cache connected');
          this.enabled = true;
        });

        this.redis.on('error', (err) => {
          console.error('Redis error:', err.message);
          this.enabled = false;
        });
      } catch (error: any) {
        console.warn('Redis initialization failed:', error.message);
        this.redis = null;
      }
    } else {
      console.warn('REDIS_URL not configured - using memory cache only');
    }
  }

  private getCacheKey(query: string, type: string = 'web'): string {
    return `search:${type}:${query.toLowerCase().trim()}`;
  }

  async get(query: string, type: string = 'web'): Promise<CachedSearchResult | null> {
    const key = this.getCacheKey(query, type);

    // Try Redis first
    if (this.enabled && this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          console.log(`✅ Cache HIT (Redis): ${query}`);
          return JSON.parse(cached);
        }
      } catch (error: any) {
        console.error('Redis get error:', error.message);
      }
    }

    // Fallback to memory cache
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached) {
      const age = Date.now() - memoryCached.timestamp;
      if (age < memoryCached.ttl * 1000) {
        console.log(`✅ Cache HIT (Memory): ${query}`);
        return memoryCached;
      } else {
        this.memoryCache.delete(key);
      }
    }

    console.log(`❌ Cache MISS: ${query}`);
    return null;
  }

  async set(
    query: string,
    data: { results: any[]; aiAnswer: any },
    ttl: number = 3600,
    type: string = 'web'
  ): Promise<void> {
    const key = this.getCacheKey(query, type);
    const cacheData: CachedSearchResult = {
      ...data,
      timestamp: Date.now(),
      ttl
    };

    // Store in Redis
    if (this.enabled && this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(cacheData));
        console.log(`💾 Cached to Redis: ${query} (TTL: ${ttl}s)`);
      } catch (error: any) {
        console.error('Redis set error:', error.message);
      }
    }

    // Always store in memory cache as fallback
    this.memoryCache.set(key, cacheData);

    // Limit memory cache size (keep last 100 queries)
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
  }

  async invalidate(query: string, type: string = 'web'): Promise<void> {
    const key = this.getCacheKey(query, type);

    if (this.enabled && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error: any) {
        console.error('Redis delete error:', error.message);
      }
    }

    this.memoryCache.delete(key);
  }

  async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    // Simple stats (could be enhanced with Redis counters)
    return {
      hits: 0,
      misses: 0,
      size: this.memoryCache.size
    };
  }
}

export const cacheService = new CacheService();
