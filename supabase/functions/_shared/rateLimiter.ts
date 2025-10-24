/**
 * Rate Limiting Middleware for Supabase Edge Functions
 * Implements token bucket algorithm with Redis/Supabase storage
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

/**
 * Token Bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity
    this.tokens = capacity
    this.refillRate = refillRatePerSecond
    this.lastRefill = Date.now()
  }

  /**
   * Try to consume tokens from the bucket
   */
  tryConsume(count: number = 1): boolean {
    this.refill()

    if (this.tokens >= count) {
      this.tokens -= count
      return true
    }

    return false
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  /**
   * Get current bucket state
   */
  getInfo(): { tokens: number; capacity: number } {
    this.refill()
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.capacity
    }
  }

  /**
   * Calculate retry after in seconds
   */
  getRetryAfter(): number {
    if (this.tokens >= 1) return 0
    return Math.ceil((1 - this.tokens) / this.refillRate)
  }
}

/**
 * Rate Limiter using Supabase for storage
 */
export class RateLimiter {
  private supabase: any
  private config: RateLimitConfig
  private buckets: Map<string, TokenBucket> = new Map()

  constructor(supabaseUrl: string, supabaseKey: string, config: RateLimitConfig) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.config = {
      keyPrefix: 'rate_limit:',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  /**
   * Generate rate limit key for a request
   */
  private getKey(identifier: string): string {
    return `${this.config.keyPrefix}${identifier}`
  }

  /**
   * Check if request should be rate limited
   */
  async isRateLimited(identifier: string): Promise<{ limited: boolean; info: RateLimitInfo }> {
    const key = this.getKey(identifier)

    // Try to get from in-memory cache first
    let bucket = this.buckets.get(key)

    if (!bucket) {
      // Load from database or create new
      const { data } = await this.supabase
        .from('rate_limit_buckets')
        .select('tokens, last_refill')
        .eq('key', key)
        .single()

      if (data) {
        bucket = new TokenBucket(
          this.config.maxRequests,
          this.config.maxRequests / (this.config.windowMs / 1000)
        )
        // Restore state from database
        bucket.tokens = data.tokens
        bucket.lastRefill = new Date(data.last_refill).getTime()
      } else {
        // Create new bucket
        bucket = new TokenBucket(
          this.config.maxRequests,
          this.config.maxRequests / (this.config.windowMs / 1000)
        )
      }

      this.buckets.set(key, bucket)
    }

    const consumed = bucket.tryConsume(1)
    const bucketInfo = bucket.getInfo()

    // Persist to database
    await this.persistBucket(key, bucket)

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining: Math.floor(bucketInfo.tokens),
      reset: new Date(Date.now() + this.config.windowMs),
      retryAfter: consumed ? undefined : bucket.getRetryAfter()
    }

    return {
      limited: !consumed,
      info
    }
  }

  /**
   * Persist bucket state to database
   */
  private async persistBucket(key: string, bucket: TokenBucket): Promise<void> {
    const info = bucket.getInfo()

    await this.supabase
      .from('rate_limit_buckets')
      .upsert({
        key,
        tokens: info.tokens,
        capacity: info.capacity,
        last_refill: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = this.getKey(identifier)
    this.buckets.delete(key)

    await this.supabase
      .from('rate_limit_buckets')
      .delete()
      .eq('key', key)
  }

  /**
   * Clean up expired buckets
   */
  async cleanup(): Promise<void> {
    const expiryTime = new Date(Date.now() - this.config.windowMs * 2).toISOString()

    await this.supabase
      .from('rate_limit_buckets')
      .delete()
      .lt('updated_at', expiryTime)

    // Clean in-memory cache
    for (const [key, bucket] of this.buckets.entries()) {
      const info = bucket.getInfo()
      if (info.tokens >= info.capacity) {
        this.buckets.delete(key)
      }
    }
  }
}

/**
 * Tier-based rate limiting
 */
export class TierRateLimiter extends RateLimiter {
  private tierLimits: Record<string, RateLimitConfig> = {
    free: {
      maxRequests: 100,
      windowMs: 60 * 1000 // 100 requests per minute
    },
    basic: {
      maxRequests: 200,
      windowMs: 60 * 1000 // 200 requests per minute
    },
    pro: {
      maxRequests: 500,
      windowMs: 60 * 1000 // 500 requests per minute
    },
    premium: {
      maxRequests: 1000,
      windowMs: 60 * 1000 // 1000 requests per minute
    }
  }

  constructor(supabaseUrl: string, supabaseKey: string) {
    super(supabaseUrl, supabaseKey, {
      maxRequests: 100,
      windowMs: 60000
    })
  }

  /**
   * Check rate limit based on user tier
   */
  async checkTierLimit(userId: string, tier: string = 'free'): Promise<{ limited: boolean; info: RateLimitInfo }> {
    const tierConfig = this.tierLimits[tier] || this.tierLimits.free
    this.config = tierConfig

    return this.isRateLimited(`user:${userId}`)
  }

  /**
   * Check API endpoint rate limit
   */
  async checkEndpointLimit(
    userId: string,
    endpoint: string,
    tier: string = 'free'
  ): Promise<{ limited: boolean; info: RateLimitInfo }> {
    // Different limits for different endpoints
    const endpointLimits: Record<string, Record<string, RateLimitConfig>> = {
      'ai-detection': {
        free: { maxRequests: 20, windowMs: 3600000 }, // 20 per hour
        basic: { maxRequests: 50, windowMs: 3600000 }, // 50 per hour
        pro: { maxRequests: 200, windowMs: 3600000 }, // 200 per hour
        premium: { maxRequests: 1000, windowMs: 3600000 } // 1000 per hour
      },
      'humanization': {
        free: { maxRequests: 10, windowMs: 3600000 }, // 10 per hour
        basic: { maxRequests: 30, windowMs: 3600000 }, // 30 per hour
        pro: { maxRequests: 100, windowMs: 3600000 }, // 100 per hour
        premium: { maxRequests: 500, windowMs: 3600000 } // 500 per hour
      },
      'essay-generation': {
        free: { maxRequests: 5, windowMs: 86400000 }, // 5 per day
        basic: { maxRequests: 20, windowMs: 86400000 }, // 20 per day
        pro: { maxRequests: 50, windowMs: 86400000 }, // 50 per day
        premium: { maxRequests: 200, windowMs: 86400000 } // 200 per day
      }
    }

    const limits = endpointLimits[endpoint]?.[tier] || this.tierLimits[tier]
    this.config = limits

    return this.isRateLimited(`user:${userId}:endpoint:${endpoint}`)
  }
}

/**
 * Express-style middleware for rate limiting
 */
export function rateLimitMiddleware(limiter: RateLimiter | TierRateLimiter) {
  return async (req: Request, context: any, next: Function) => {
    // Extract user ID from JWT or session
    const userId = context.user?.id || req.headers.get('x-client-id') || 'anonymous'
    const userTier = context.user?.tier || 'free'

    // Check if using tier-based limiter
    const result = limiter instanceof TierRateLimiter
      ? await limiter.checkTierLimit(userId, userTier)
      : await limiter.isRateLimited(userId)

    // Set rate limit headers
    const headers = new Headers({
      'X-RateLimit-Limit': result.info.limit.toString(),
      'X-RateLimit-Remaining': result.info.remaining.toString(),
      'X-RateLimit-Reset': result.info.reset.toISOString()
    })

    if (result.limited) {
      headers.set('Retry-After', result.info.retryAfter?.toString() || '60')

      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.info.retryAfter
        }),
        {
          status: 429,
          headers
        }
      )
    }

    // Continue to next middleware
    const response = await next()

    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Usage example in Edge Function:
 *
 * import { TierRateLimiter, rateLimitMiddleware } from './_shared/rateLimiter.ts'
 *
 * const limiter = new TierRateLimiter(
 *   Deno.env.get('SUPABASE_URL')!,
 *   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 * )
 *
 * serve(async (req, context) => {
 *   // Apply rate limiting
 *   const rateLimitResponse = await rateLimitMiddleware(limiter)(req, context, async () => {
 *     // Your actual handler logic here
 *     return new Response('Success', { status: 200 })
 *   })
 *
 *   return rateLimitResponse
 * })
 */