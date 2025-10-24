/**
 * Security Hook
 * Centralized security utilities for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { rateLimiter } from '../utils/rateLimiter'
import { validateText, validateApiRequest } from '../utils/validation'
import { sanitizeText } from '../utils/sanitize'

/**
 * Security hook with rate limiting, validation, and sanitization
 * @param {object} user - Current user object
 * @param {object} userSubscription - User subscription info
 * @returns {object} - Security utilities
 */
export function useSecurity(user, userSubscription) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState(null)
  const [rateLimitInfo, setRateLimitInfo] = useState(null)
  const requestCount = useRef(0)

  const userId = user?.id
  const tier = userSubscription?.tier?.toLowerCase() || 'free'

  // Check if user is blocked on mount and periodically
  useEffect(() => {
    if (!userId) return

    const checkBlockStatus = () => {
      const blockStatus = rateLimiter.isBlocked(userId)
      setIsBlocked(blockStatus.blocked)
      if (blockStatus.blocked) {
        setBlockReason(blockStatus.reason)
      }
    }

    checkBlockStatus()
    const interval = setInterval(checkBlockStatus, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [userId])

  /**
   * Check rate limit before making API call
   * @param {string} action - Action name
   * @returns {object} - { allowed, error, remaining }
   */
  const checkRateLimit = useCallback(
    (action = 'default') => {
      if (!userId) {
        return {
          allowed: false,
          error: 'User not authenticated',
        }
      }

      // Check if blocked
      const blockStatus = rateLimiter.isBlocked(userId)
      if (blockStatus.blocked) {
        return {
          allowed: false,
          error: `Account temporarily blocked. Try again in ${Math.ceil(blockStatus.remainingMs / 60000)} minutes`,
          blocked: true,
        }
      }

      // Check rate limit
      const result = rateLimiter.checkLimit(userId, tier, action)
      setRateLimitInfo(result)

      return result
    },
    [userId, tier]
  )

  /**
   * Validate and sanitize text input
   * @param {string} text - Text to validate
   * @param {object} options - Validation options
   * @returns {object} - Validation result
   */
  const validateInput = useCallback((text, options = {}) => {
    return validateText(text, options)
  }, [])

  /**
   * Secure API call wrapper with rate limiting and validation
   * @param {Function} apiFunction - API function to call
   * @param {object} requestData - Request data
   * @param {object} schema - Validation schema
   * @returns {Promise} - API response
   */
  const secureApiCall = useCallback(
    async (apiFunction, requestData, schema = null) => {
      // Check rate limit
      const limitCheck = checkRateLimit(apiFunction.name || 'api-call')
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.error)
      }

      // Validate request data if schema provided
      if (schema) {
        const validation = validateApiRequest(requestData, schema)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
        requestData = validation.sanitized
      }

      // Increment request count
      requestCount.current++

      try {
        // Make API call
        const response = await apiFunction(requestData)

        // Check for suspicious activity
        const suspiciousCheck = rateLimiter.detectSuspiciousActivity(userId)
        if (suspiciousCheck.suspicious) {
          console.warn('Suspicious activity detected:', suspiciousCheck.reasons)
          // Could trigger additional security measures here
        }

        return response
      } catch (error) {
        // Log failed attempt
        console.error('API call failed:', error)
        throw error
      }
    },
    [userId, checkRateLimit]
  )

  /**
   * Get current rate limit status
   * @returns {object} - Rate limit info
   */
  const getRateLimitStatus = useCallback(() => {
    if (!userId) return null
    return rateLimiter.getUserStats(userId)
  }, [userId])

  /**
   * Sanitize user input safely
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  const sanitize = useCallback((text) => {
    return sanitizeText(text)
  }, [])

  /**
   * Report suspicious activity
   * @param {string} reason - Reason for report
   */
  const reportSuspiciousActivity = useCallback(
    (reason) => {
      if (!userId) return

      console.warn(`Suspicious activity reported for user ${userId}:`, reason)

      // Could send to backend logging service
      // In production, this would trigger alerts
    },
    [userId]
  )

  /**
   * Clear user rate limit data (for logout)
   */
  const clearSecurityData = useCallback(() => {
    if (!userId) return
    rateLimiter.clearUser(userId)
    setRateLimitInfo(null)
    setIsBlocked(false)
    setBlockReason(null)
    requestCount.current = 0
  }, [userId])

  return {
    // State
    isBlocked,
    blockReason,
    rateLimitInfo,
    requestCount: requestCount.current,

    // Functions
    checkRateLimit,
    validateInput,
    secureApiCall,
    getRateLimitStatus,
    sanitize,
    reportSuspiciousActivity,
    clearSecurityData,

    // Utils
    tier,
    userId,
  }
}

/**
 * Hook for detecting and preventing rapid submissions (button mashing)
 * @param {number} cooldown - Cooldown period in ms
 * @returns {object} - { canSubmit, submit }
 */
export function useSubmitCooldown(cooldown = 1000) {
  const [canSubmit, setCanSubmit] = useState(true)
  const lastSubmit = useRef(0)

  const submit = useCallback(
    (callback) => {
      const now = Date.now()
      if (now - lastSubmit.current < cooldown) {
        return false // Still in cooldown
      }

      lastSubmit.current = now
      setCanSubmit(false)

      // Re-enable after cooldown
      setTimeout(() => setCanSubmit(true), cooldown)

      if (callback) callback()
      return true
    },
    [cooldown]
  )

  return { canSubmit, submit }
}

/**
 * Hook for detecting copy-paste behavior (potential plagiarism)
 * @returns {object} - { pasteCount, resetCount }
 */
export function usePasteDetection() {
  const [pasteCount, setPasteCount] = useState(0)
  const pasteHistory = useRef([])

  useEffect(() => {
    const handlePaste = (e) => {
      const now = Date.now()
      pasteHistory.current.push(now)

      // Keep only last hour of pastes
      const oneHourAgo = now - 60 * 60 * 1000
      pasteHistory.current = pasteHistory.current.filter((time) => time > oneHourAgo)

      setPasteCount(pasteHistory.current.length)

      // Alert if too many pastes
      if (pasteHistory.current.length > 10) {
        console.warn('Excessive paste operations detected')
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const resetCount = useCallback(() => {
    setPasteCount(0)
    pasteHistory.current = []
  }, [])

  return { pasteCount, resetCount }
}

/**
 * Hook for session timeout management
 * @param {number} timeout - Timeout in ms
 * @param {Function} onTimeout - Callback when timeout occurs
 */
export function useSessionTimeout(timeout = 30 * 60 * 1000, onTimeout) {
  const timeoutRef = useRef(null)
  const lastActivity = useRef(Date.now())

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (onTimeout) onTimeout()
    }, timeout)
  }, [timeout, onTimeout])

  useEffect(() => {
    // Activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [resetTimer])

  return {
    lastActivity: lastActivity.current,
    resetTimer,
  }
}
