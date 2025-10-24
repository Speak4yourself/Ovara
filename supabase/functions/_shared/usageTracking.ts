/**
 * Usage Tracking System
 * Monitors and enforces tier-based usage limits
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface TierLimits {
  words: number
  aiScans: number
  essays: number
  humanizations: number
  plagiarismScans: number
  citations: number
  savedEssays: number
}

export interface UsageData {
  wordsUsed: number
  aiScansUsed: number
  essaysGenerated: number
  humanizationsUsed: number
  plagiarismScansUsed: number
  citationsGenerated: number
  savedEssays: number
  periodStart: string
  periodEnd: string
  lastResetAt: string
}

export interface UsageCheckResult {
  allowed: boolean
  currentUsage: number
  limit: number
  remaining: number
  percentUsed: number
  willExceedLimit: boolean
  suggestedUpgrade?: string
}

/**
 * Tier limits configuration
 */
export const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    words: 10000,
    aiScans: 5,
    essays: 3,
    humanizations: 3,
    plagiarismScans: 0,
    citations: 10,
    savedEssays: 5
  },
  basic: {
    words: 50000,
    aiScans: 20,
    essays: 10,
    humanizations: 15,
    plagiarismScans: 5,
    citations: 50,
    savedEssays: 25
  },
  pro: {
    words: 150000,
    aiScans: 100,
    essays: 50,
    humanizations: 75,
    plagiarismScans: 50,
    citations: 200,
    savedEssays: 100
  },
  premium: {
    words: 300000,
    aiScans: 999999,
    essays: 999999,
    humanizations: 999999,
    plagiarismScans: 999999,
    citations: 999999,
    savedEssays: 999999
  }
}

/**
 * Usage Tracking Manager
 */
export class UsageTracker {
  private supabase: any
  private cacheTimeout = 60000 // 1 minute cache
  private cache: Map<string, { data: UsageData; timestamp: number }> = new Map()

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Get current billing period dates
   */
  private getBillingPeriod(subscriptionData?: any): { start: string; end: string } {
    const now = new Date()

    if (subscriptionData?.current_period_end) {
      const endDate = new Date(subscriptionData.current_period_end)
      const startDate = new Date(endDate)

      // Calculate start date based on billing period
      if (subscriptionData.billing_period === 'yearly') {
        startDate.setFullYear(startDate.getFullYear() - 1)
      } else {
        startDate.setMonth(startDate.getMonth() - 1)
      }

      return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }

    // Default to monthly period from current date
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  }

  /**
   * Get or create usage record for user
   */
  async getUsageData(userId: string, forceRefresh = false): Promise<UsageData | null> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(userId)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      // Get user subscription data
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      const period = this.getBillingPeriod(subscription)

      // Get or create usage tracking record
      let { data: usage, error } = await this.supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', period.start.slice(0, 7)) // YYYY-MM format
        .single()

      if (error || !usage) {
        // Create new usage record for this period
        const newUsage = {
          user_id: userId,
          period_start: period.start.slice(0, 7),
          period_end: period.end.slice(0, 7),
          words_used: 0,
          ai_scans_used: 0,
          essays_generated: 0,
          humanizations_used: 0,
          plagiarism_scans_used: 0,
          citations_generated: 0,
          saved_essays_count: 0,
          last_reset_at: period.start,
          created_at: new Date().toISOString()
        }

        const { data: inserted } = await this.supabase
          .from('usage_tracking')
          .insert(newUsage)
          .select()
          .single()

        usage = inserted
      }

      // Transform database fields to camelCase
      const usageData: UsageData = {
        wordsUsed: usage.words_used,
        aiScansUsed: usage.ai_scans_used,
        essaysGenerated: usage.essays_generated,
        humanizationsUsed: usage.humanizations_used,
        plagiarismScansUsed: usage.plagiarism_scans_used,
        citationsGenerated: usage.citations_generated,
        savedEssays: usage.saved_essays_count,
        periodStart: usage.period_start,
        periodEnd: usage.period_end,
        lastResetAt: usage.last_reset_at
      }

      // Cache the result
      this.cache.set(userId, {
        data: usageData,
        timestamp: Date.now()
      })

      return usageData
    } catch (error) {
      console.error('Error fetching usage data:', error)
      return null
    }
  }

  /**
   * Check if user can perform an action based on their usage limits
   */
  async checkUsageLimit(
    userId: string,
    usageType: keyof TierLimits,
    amount: number = 1,
    userTier?: string
  ): Promise<UsageCheckResult> {
    try {
      // Get user tier if not provided
      if (!userTier) {
        const { data: subscription } = await this.supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', userId)
          .single()

        userTier = subscription?.tier || 'free'
      }

      const limits = TIER_LIMITS[userTier] || TIER_LIMITS.free
      const usage = await this.getUsageData(userId)

      if (!usage) {
        throw new Error('Could not fetch usage data')
      }

      // Map usage type to usage data field
      const usageFieldMap: Record<string, keyof UsageData> = {
        words: 'wordsUsed',
        aiScans: 'aiScansUsed',
        essays: 'essaysGenerated',
        humanizations: 'humanizationsUsed',
        plagiarismScans: 'plagiarismScansUsed',
        citations: 'citationsGenerated',
        savedEssays: 'savedEssays'
      }

      const currentUsage = usage[usageFieldMap[usageType]] as number || 0
      const limit = limits[usageType]
      const projectedUsage = currentUsage + amount
      const remaining = Math.max(0, limit - currentUsage)
      const percentUsed = limit > 0 ? (currentUsage / limit) * 100 : 0

      // Determine if upgrade is needed
      let suggestedUpgrade: string | undefined
      if (projectedUsage > limit) {
        const tierOrder = ['free', 'basic', 'pro', 'premium']
        const currentTierIndex = tierOrder.indexOf(userTier)

        for (let i = currentTierIndex + 1; i < tierOrder.length; i++) {
          const nextTier = tierOrder[i]
          if (TIER_LIMITS[nextTier][usageType] >= projectedUsage) {
            suggestedUpgrade = nextTier
            break
          }
        }
      }

      return {
        allowed: projectedUsage <= limit,
        currentUsage,
        limit,
        remaining,
        percentUsed,
        willExceedLimit: projectedUsage > limit,
        suggestedUpgrade
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)

      // Default to denying access on error
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        percentUsed: 100,
        willExceedLimit: true
      }
    }
  }

  /**
   * Increment usage for a specific type
   */
  async incrementUsage(
    userId: string,
    usageType: keyof TierLimits,
    amount: number = 1
  ): Promise<boolean> {
    try {
      // First check if usage is allowed
      const check = await this.checkUsageLimit(userId, usageType, amount)

      if (!check.allowed) {
        console.warn(`Usage limit exceeded for user ${userId}, type: ${usageType}`)
        return false
      }

      // Get current period
      const usage = await this.getUsageData(userId)
      if (!usage) {
        throw new Error('Could not fetch usage data')
      }

      // Map usage type to database field
      const dbFieldMap: Record<string, string> = {
        words: 'words_used',
        aiScans: 'ai_scans_used',
        essays: 'essays_generated',
        humanizations: 'humanizations_used',
        plagiarismScans: 'plagiarism_scans_used',
        citations: 'citations_generated',
        savedEssays: 'saved_essays_count'
      }

      const field = dbFieldMap[usageType]

      // Increment usage in database
      const { error } = await this.supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_period: usage.periodStart,
        p_field: field,
        p_amount: amount
      })

      if (error) {
        console.error('Error incrementing usage:', error)
        return false
      }

      // Invalidate cache
      this.cache.delete(userId)

      // Log usage event
      await this.logUsageEvent(userId, usageType, amount)

      return true
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return false
    }
  }

  /**
   * Log usage event for analytics
   */
  private async logUsageEvent(
    userId: string,
    usageType: string,
    amount: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('usage_events')
        .insert({
          user_id: userId,
          event_type: usageType,
          amount,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging usage event:', error)
    }
  }

  /**
   * Get usage summary for user
   */
  async getUsageSummary(userId: string, userTier?: string): Promise<any> {
    try {
      const usage = await this.getUsageData(userId)

      if (!usage) {
        throw new Error('Could not fetch usage data')
      }

      // Get user tier if not provided
      if (!userTier) {
        const { data: subscription } = await this.supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', userId)
          .single()

        userTier = subscription?.tier || 'free'
      }

      const limits = TIER_LIMITS[userTier] || TIER_LIMITS.free

      return {
        tier: userTier,
        period: {
          start: usage.periodStart,
          end: usage.periodEnd
        },
        usage: {
          words: {
            used: usage.wordsUsed,
            limit: limits.words,
            remaining: Math.max(0, limits.words - usage.wordsUsed),
            percentUsed: limits.words > 0 ? (usage.wordsUsed / limits.words) * 100 : 0
          },
          aiScans: {
            used: usage.aiScansUsed,
            limit: limits.aiScans,
            remaining: Math.max(0, limits.aiScans - usage.aiScansUsed),
            percentUsed: limits.aiScans > 0 ? (usage.aiScansUsed / limits.aiScans) * 100 : 0
          },
          essays: {
            used: usage.essaysGenerated,
            limit: limits.essays,
            remaining: Math.max(0, limits.essays - usage.essaysGenerated),
            percentUsed: limits.essays > 0 ? (usage.essaysGenerated / limits.essays) * 100 : 0
          },
          humanizations: {
            used: usage.humanizationsUsed,
            limit: limits.humanizations,
            remaining: Math.max(0, limits.humanizations - usage.humanizationsUsed),
            percentUsed: limits.humanizations > 0 ? (usage.humanizationsUsed / limits.humanizations) * 100 : 0
          },
          plagiarismScans: {
            used: usage.plagiarismScansUsed,
            limit: limits.plagiarismScans,
            remaining: Math.max(0, limits.plagiarismScans - usage.plagiarismScansUsed),
            percentUsed: limits.plagiarismScans > 0 ? (usage.plagiarismScansUsed / limits.plagiarismScans) * 100 : 0
          },
          citations: {
            used: usage.citationsGenerated,
            limit: limits.citations,
            remaining: Math.max(0, limits.citations - usage.citationsGenerated),
            percentUsed: limits.citations > 0 ? (usage.citationsGenerated / limits.citations) * 100 : 0
          },
          savedEssays: {
            used: usage.savedEssays,
            limit: limits.savedEssays,
            remaining: Math.max(0, limits.savedEssays - usage.savedEssays),
            percentUsed: limits.savedEssays > 0 ? (usage.savedEssays / limits.savedEssays) * 100 : 0
          }
        },
        lastResetAt: usage.lastResetAt
      }
    } catch (error) {
      console.error('Error getting usage summary:', error)
      return null
    }
  }

  /**
   * Reset usage for a new billing period
   */
  async resetUsage(userId: string): Promise<boolean> {
    try {
      const period = this.getBillingPeriod()

      const { error } = await this.supabase
        .from('usage_tracking')
        .update({
          words_used: 0,
          ai_scans_used: 0,
          essays_generated: 0,
          humanizations_used: 0,
          plagiarism_scans_used: 0,
          citations_generated: 0,
          last_reset_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('period_start', period.start.slice(0, 7))

      if (error) {
        console.error('Error resetting usage:', error)
        return false
      }

      // Invalidate cache
      this.cache.delete(userId)

      return true
    } catch (error) {
      console.error('Error resetting usage:', error)
      return false
    }
  }

  /**
   * Bulk check multiple usage types at once
   */
  async checkMultipleUsageLimits(
    userId: string,
    checks: Array<{ type: keyof TierLimits; amount: number }>,
    userTier?: string
  ): Promise<Record<string, UsageCheckResult>> {
    const results: Record<string, UsageCheckResult> = {}

    for (const check of checks) {
      results[check.type] = await this.checkUsageLimit(userId, check.type, check.amount, userTier)
    }

    return results
  }
}

/**
 * Create RPC function in Supabase for atomic increment:
 *
 * CREATE OR REPLACE FUNCTION increment_usage(
 *   p_user_id UUID,
 *   p_period TEXT,
 *   p_field TEXT,
 *   p_amount INTEGER
 * )
 * RETURNS VOID AS $$
 * BEGIN
 *   EXECUTE format('
 *     UPDATE usage_tracking
 *     SET %I = %I + $1,
 *         updated_at = NOW()
 *     WHERE user_id = $2
 *     AND period_start = $3',
 *     p_field, p_field)
 *   USING p_amount, p_user_id, p_period;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */