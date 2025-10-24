/**
 * Text sanitization utilities
 * Prevents XSS and ensures safe text handling
 */

/**
 * Sanitize user input text
 * Removes potentially dangerous characters and patterns
 * @param {string} text - Input text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return ''
  }

  // Remove null bytes
  let sanitized = text.replace(/\0/g, '')

  // Remove potential script tags (case-insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize email addresses
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return ''
  }

  // Basic email sanitization
  return email.toLowerCase().trim()
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 5000) {
  if (typeof text !== 'string') {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength)
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {string|null} - Valid URL or null
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null
  }

  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return null
  } catch (e) {
    return null
  }
}

/**
 * Remove excessive whitespace
 * @param {string} text - Input text
 * @returns {string} - Cleaned text
 */
export function normalizeWhitespace(text) {
  if (typeof text !== 'string') {
    return ''
  }

  return text.replace(/\s+/g, ' ').trim()
}
