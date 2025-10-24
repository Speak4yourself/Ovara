/**
 * Client-side Rate Limiter
 * Prevents abuse by limiting requests per user
 */

import { SECURITY_CONFIG } from '../config/security'

class RateLimiter {
  constructor() {
    this.requests = new Map() // userId -> { count, resetTime, history }
    this.cleanupInterval = null
    this.startCleanup()
  }

  /**
   * Check if request is allowed
   * @param {string} userId - User ID
   * @param {string} tier - User tier (free, basic, pro, premium)
   * @param {string} action - Action type (optional, for specific limits)
   * @returns {object} - { allowed, remaining, resetIn }
   */
  checkLimit(userId, tier = 'free', action = 'default') {
    const now = Date.now()
    const limits = SECURITY_CONFIG.rateLimits[tier]

    if (!limits) {
      console.error('Invalid tier:', tier)
      return { allowed: false, remaining: 0, resetIn: 0, error: 'Invalid tier' }
    }

    // Get or create user record
    if (!this.requests.has(userId)) {
      this.requests.set(userId, {
        minute: { count: 0, resetTime: now + 60 * 1000 },
        hour: { count: 0, resetTime: now + 60 * 60 * 1000 },
        history: [],
      })
    }

    const userRecord = this.requests.get(userId)

    // Reset counters if time has passed
    if (now >= userRecord.minute.resetTime) {
      userRecord.minute = { count: 0, resetTime: now + 60 * 1000 }
    }
    if (now >= userRecord.hour.resetTime) {
      userRecord.hour = { count: 0, resetTime: now + 60 * 60 * 1000 }
    }

    // Check minute limit
    if (userRecord.minute.count >= limits.requestsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: userRecord.minute.resetTime - now,
        error: `Rate limit exceeded. Try again in ${Math.ceil((userRecord.minute.resetTime - now) / 1000)} seconds`,
      }
    }

    // Check hourly limit
    if (userRecord.hour.count >= limits.apiCalls) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: userRecord.hour.resetTime - now,
        error: `Hourly limit reached. Resets in ${Math.ceil((userRecord.hour.resetTime - now) / 60000)} minutes`,
      }
    }

    // Increment counters
    userRecord.minute.count++
    userRecord.hour.count++

    // Add to history
    userRecord.history.push({ timestamp: now, action })
    if (userRecord.history.length > 100) {
      userRecord.history.shift()
    }

    return {
      allowed: true,
      remaining: limits.apiCalls - userRecord.hour.count,
      resetIn: userRecord.hour.resetTime - now,
      minuteRemaining: limits.requestsPerMinute - userRecord.minute.count,
    }
  }

  /**
   * Check text length limit
   * @param {number} length - Text length
   * @param {string} tier - User tier
   * @returns {object} - { allowed, maxLength }
   */
  checkTextLength(length, tier = 'free') {
    const limits = SECURITY_CONFIG.rateLimits[tier]
    const maxLength = limits?.textLength || 1000

    return {
      allowed: length <= maxLength,
      maxLength,
      exceeded: Math.max(0, length - maxLength),
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {object} - Usage statistics
   */
  getUserStats(userId) {
    const userRecord = this.requests.get(userId)
    if (!userRecord) {
      return {
        minuteCount: 0,
        hourCount: 0,
        history: [],
      }
    }

    const now = Date.now()
    return {
      minuteCount: userRecord.minute.count,
      hourCount: userRecord.hour.count,
      minuteResetIn: Math.max(0, userRecord.minute.resetTime - now),
      hourResetIn: Math.max(0, userRecord.hour.resetTime - now),
      history: userRecord.history.slice(-10), // Last 10 requests
    }
  }

  /**
   * Detect suspicious activity
   * @param {string} userId - User ID
   * @returns {object} - { suspicious, reasons }
   */
  detectSuspiciousActivity(userId) {
    const userRecord = this.requests.get(userId)
    if (!userRecord) return { suspicious: false, reasons: [] }

    const now = Date.now()
    const reasons = []
    const recentHistory = userRecord.history.filter(
      (h) => now - h.timestamp < 60000
    ) // Last minute

    // Too many requests in short time
    if (recentHistory.length > 30) {
      reasons.push('Excessive requests per minute')
    }

    // Rapid-fire requests (< 100ms apart)
    const rapidRequests = recentHistory.filter((h, i) => {
      if (i === 0) return false
      return h.timestamp - recentHistory[i - 1].timestamp < 100
    })
    if (rapidRequests.length > 10) {
      reasons.push('Automated bot-like behavior detected')
    }

    // Consistent timing pattern (possible bot)
    if (recentHistory.length > 10) {
      const intervals = []
      for (let i = 1; i < recentHistory.length; i++) {
        intervals.push(recentHistory[i].timestamp - recentHistory[i - 1].timestamp)
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2)
      }, 0) / intervals.length

      // If variance is very low, might be automated
      if (variance < 100 && recentHistory.length > 15) {
        reasons.push('Consistent timing pattern (possible automation)')
      }
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
      requestCount: recentHistory.length,
    }
  }

  /**
   * Block user temporarily
   * @param {string} userId - User ID
   * @param {number} duration - Block duration in ms
   */
  blockUser(userId, duration = 15 * 60 * 1000) {
    const userRecord = this.requests.get(userId) || {
      minute: { count: 0, resetTime: Date.now() },
      hour: { count: 0, resetTime: Date.now() },
      history: [],
    }

    userRecord.blocked = true
    userRecord.blockUntil = Date.now() + duration
    this.requests.set(userId, userRecord)
  }

  /**
   * Check if user is blocked
   * @param {string} userId - User ID
   * @returns {object} - { blocked, until, reason }
   */
  isBlocked(userId) {
    const userRecord = this.requests.get(userId)
    if (!userRecord || !userRecord.blocked) {
      return { blocked: false }
    }

    const now = Date.now()
    if (now >= userRecord.blockUntil) {
      // Unblock user
      userRecord.blocked = false
      userRecord.blockUntil = null
      return { blocked: false }
    }

    return {
      blocked: true,
      until: userRecord.blockUntil,
      remainingMs: userRecord.blockUntil - now,
      reason: 'Suspicious activity detected',
    }
  }

  /**
   * Clear user data
   * @param {string} userId - User ID
   */
  clearUser(userId) {
    this.requests.delete(userId)
  }

  /**
   * Start cleanup interval to prevent memory leaks
   */
  startCleanup() {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      for (const [userId, record] of this.requests.entries()) {
        // Remove old history
        record.history = record.history.filter(
          (h) => h.timestamp > oneHourAgo
        )

        // Remove inactive users (no activity in 1 hour)
        if (
          record.history.length === 0 &&
          record.hour.resetTime < now &&
          !record.blocked
        ) {
          this.requests.delete(userId)
        }
      }
    }, 5 * 60 * 1000) // Run every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get system statistics
   * @returns {object} - System-wide stats
   */
  getSystemStats() {
    const now = Date.now()
    let totalUsers = this.requests.size
    let activeUsers = 0
    let blockedUsers = 0
    let totalRequests = 0

    for (const [userId, record] of this.requests.entries()) {
      totalRequests += record.hour.count
      if (record.blocked) {
        blockedUsers++
      }
      if (record.history.some((h) => now - h.timestamp < 5 * 60 * 1000)) {
        activeUsers++
      }
    }

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      totalRequests,
      memoryUsage: this.requests.size,
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()

// Export class for testing
export default RateLimiter
