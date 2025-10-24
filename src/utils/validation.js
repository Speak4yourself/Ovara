/**
 * Input Validation Utilities
 * Comprehensive validation for all user inputs
 */

import { SECURITY_CONFIG, hasSuspiciousPatterns, validatePassword } from '../config/security'
import { sanitizeText, sanitizeEmail, sanitizeUrl } from './sanitize'

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether input is valid
 * @property {Array<string>} errors - List of validation errors
 * @property {any} sanitized - Sanitized value (if valid)
 */

/**
 * Validate text input
 * @param {string} text - Text to validate
 * @param {object} options - Validation options
 * @returns {ValidationResult}
 */
export function validateText(text, options = {}) {
  const {
    required = true,
    minLength = 1,
    maxLength = SECURITY_CONFIG.validation.maxTextLength,
    allowEmpty = false,
    checkPatterns = true,
  } = options

  const errors = []

  // Type check
  if (typeof text !== 'string') {
    return { isValid: false, errors: ['Text must be a string'], sanitized: '' }
  }

  // Required check
  if (required && !allowEmpty && text.trim().length === 0) {
    errors.push('This field is required')
  }

  // Length checks
  if (text.length < minLength) {
    errors.push(`Text must be at least ${minLength} characters`)
  }

  if (text.length > maxLength) {
    errors.push(`Text must not exceed ${maxLength} characters`)
  }

  // Check for suspicious patterns
  if (checkPatterns && hasSuspiciousPatterns(text)) {
    errors.push('Text contains potentially dangerous content')
  }

  // Sanitize
  const sanitized = sanitizeText(text)

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : text,
  }
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {ValidationResult}
 */
export function validateEmailInput(email) {
  const errors = []

  // Type check
  if (typeof email !== 'string') {
    return { isValid: false, errors: ['Email must be a string'], sanitized: '' }
  }

  // Empty check
  if (email.trim().length === 0) {
    errors.push('Email is required')
  }

  // Length check
  if (email.length > SECURITY_CONFIG.validation.maxEmailLength) {
    errors.push(`Email must not exceed ${SECURITY_CONFIG.validation.maxEmailLength} characters`)
  }

  // Format check (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address')
  }

  // Check for suspicious characters
  if (/[<>()[\]\\,;:\s@"']/.test(email.split('@')[0])) {
    errors.push('Email contains invalid characters')
  }

  const sanitized = sanitizeEmail(email)

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Validate password with strength checking
 * @param {string} password - Password to validate
 * @param {object} options - Options
 * @returns {ValidationResult}
 */
export function validatePasswordInput(password, options = {}) {
  const { requireStrength = true } = options

  // Type check
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password must be a string'],
      sanitized: '',
      strength: 0,
    }
  }

  const result = validatePassword(password)

  return {
    isValid: result.isValid,
    errors: result.errors,
    sanitized: result.isValid ? password : '',
    strength: result.strength,
  }
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {object} options - Options
 * @returns {ValidationResult}
 */
export function validateUrlInput(url, options = {}) {
  const { required = true, allowedProtocols = ['http:', 'https:'] } = options

  const errors = []

  // Type check
  if (typeof url !== 'string') {
    return { isValid: false, errors: ['URL must be a string'], sanitized: null }
  }

  // Empty check
  if (required && url.trim().length === 0) {
    errors.push('URL is required')
  }

  // Try to parse URL
  let parsed
  try {
    parsed = new URL(url)
  } catch (e) {
    errors.push('Invalid URL format')
    return { isValid: false, errors, sanitized: null }
  }

  // Check protocol
  if (!allowedProtocols.includes(parsed.protocol)) {
    errors.push(`URL must use ${allowedProtocols.join(' or ')} protocol`)
  }

  const sanitized = sanitizeUrl(url)

  return {
    isValid: errors.length === 0 && sanitized !== null,
    errors,
    sanitized,
  }
}

/**
 * Validate tier value
 * @param {string} tier - Tier to validate
 * @returns {ValidationResult}
 */
export function validateTier(tier) {
  const validTiers = ['free', 'basic', 'pro', 'premium']
  const errors = []

  if (typeof tier !== 'string') {
    errors.push('Tier must be a string')
  } else if (!validTiers.includes(tier.toLowerCase())) {
    errors.push(`Tier must be one of: ${validTiers.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? tier.toLowerCase() : 'free',
  }
}

/**
 * Validate file upload
 * @param {File} file - File object
 * @param {object} options - Options
 * @returns {ValidationResult}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = SECURITY_CONFIG.validation.maxFileSize,
    allowedTypes = SECURITY_CONFIG.validation.allowedFileTypes,
  } = options

  const errors = []

  // Type check
  if (!(file instanceof File)) {
    return { isValid: false, errors: ['Invalid file object'], sanitized: null }
  }

  // Size check
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2)
    errors.push(`File size must not exceed ${maxSizeMB}MB`)
  }

  // Type check
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }

  // Check file name for suspicious characters
  if (/[<>:"|?*\\]/.test(file.name)) {
    errors.push('File name contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: file,
  }
}

/**
 * Validate object keys to prevent prototype pollution
 * @param {object} obj - Object to validate
 * @param {Array<string>} allowedKeys - Allowed keys
 * @returns {ValidationResult}
 */
export function validateObject(obj, allowedKeys = []) {
  const errors = []

  // Type check
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { isValid: false, errors: ['Must be an object'], sanitized: {} }
  }

  // Check for prototype pollution attempts
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  for (const key of Object.keys(obj)) {
    if (dangerousKeys.includes(key.toLowerCase())) {
      errors.push(`Dangerous key detected: ${key}`)
    }
  }

  // Check allowed keys
  if (allowedKeys.length > 0) {
    for (const key of Object.keys(obj)) {
      if (!allowedKeys.includes(key)) {
        errors.push(`Unexpected key: ${key}`)
      }
    }
  }

  // Create sanitized copy
  const sanitized = {}
  for (const key of Object.keys(obj)) {
    if (!dangerousKeys.includes(key.toLowerCase())) {
      if (allowedKeys.length === 0 || allowedKeys.includes(key)) {
        sanitized[key] = obj[key]
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Validate API request body
 * @param {object} body - Request body
 * @param {object} schema - Validation schema
 * @returns {ValidationResult}
 */
export function validateApiRequest(body, schema) {
  const errors = []
  const sanitized = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field]

    // Required check
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip if not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`)
        continue
      }
    }

    // Custom validation function
    if (rules.validate) {
      const result = rules.validate(value)
      if (!result.isValid) {
        errors.push(...result.errors.map((e) => `${field}: ${e}`))
        continue
      }
      sanitized[field] = result.sanitized
    } else {
      sanitized[field] = value
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Common validation schemas for API endpoints
 */
export const API_SCHEMAS = {
  toneMapper: {
    text: {
      required: true,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 10000 }),
    },
    targetTone: {
      required: true,
      type: 'string',
      validate: (val) => {
        const validTones = [
          'professional',
          'casual',
          'academic',
          'friendly',
          'confident',
          'empathetic',
          'persuasive',
          'concise',
        ]
        return {
          isValid: validTones.includes(val),
          errors: validTones.includes(val) ? [] : ['Invalid tone'],
          sanitized: val,
        }
      },
    },
    tier: {
      required: true,
      type: 'string',
      validate: validateTier,
    },
  },

  readabilitySculptor: {
    text: {
      required: true,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 10000 }),
    },
    targetLevel: {
      required: true,
      type: 'string',
      validate: (val) => {
        const validLevels = [
          'elementary',
          'middle-school',
          'high-school',
          'college',
          'graduate',
          'professional',
        ]
        return {
          isValid: validLevels.includes(val),
          errors: validLevels.includes(val) ? [] : ['Invalid level'],
          sanitized: val,
        }
      },
    },
    tier: {
      required: true,
      type: 'string',
      validate: validateTier,
    },
  },

  ideaToOutline: {
    idea: {
      required: true,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 5000 }),
    },
    outlineType: {
      required: true,
      type: 'string',
      validate: (val) => {
        const validTypes = [
          'essay',
          'research-paper',
          'presentation',
          'article',
          'speech',
          'story',
        ]
        return {
          isValid: validTypes.includes(val),
          errors: validTypes.includes(val) ? [] : ['Invalid outline type'],
          sanitized: val,
        }
      },
    },
    detailLevel: {
      required: true,
      type: 'string',
      validate: (val) => {
        const validLevels = ['brief', 'medium', 'detailed']
        return {
          isValid: validLevels.includes(val),
          errors: validLevels.includes(val) ? [] : ['Invalid detail level'],
          sanitized: val,
        }
      },
    },
    tier: {
      required: true,
      type: 'string',
      validate: validateTier,
    },
  },

  gradePredictor: {
    essayText: {
      required: true,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 20000 }),
    },
    rubric: {
      required: false,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 5000, required: false }),
    },
    gradeLevel: {
      required: true,
      type: 'string',
      validate: (val) => {
        const validLevels = ['middle-school', 'high-school', 'college', 'graduate']
        return {
          isValid: validLevels.includes(val),
          errors: validLevels.includes(val) ? [] : ['Invalid grade level'],
          sanitized: val,
        }
      },
    },
    tier: {
      required: true,
      type: 'string',
      validate: validateTier,
    },
  },

  argumentHeatmap: {
    essayText: {
      required: true,
      type: 'string',
      validate: (val) => validateText(val, { maxLength: 20000 }),
    },
    tier: {
      required: true,
      type: 'string',
      validate: validateTier,
    },
  },
}
