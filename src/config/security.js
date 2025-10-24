/**
 * Security Configuration for Ovara
 * Comprehensive security settings and constants
 */

export const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimits: {
    // Per user, per hour
    free: {
      apiCalls: 20,
      textLength: 1000,
      requestsPerMinute: 5,
    },
    basic: {
      apiCalls: 100,
      textLength: 5000,
      requestsPerMinute: 15,
    },
    pro: {
      apiCalls: 500,
      textLength: 10000,
      requestsPerMinute: 30,
    },
    premium: {
      apiCalls: 2000,
      textLength: 50000,
      requestsPerMinute: 60,
    },
  },

  // Input Validation
  validation: {
    maxTextLength: 50000,
    maxEmailLength: 254,
    maxPasswordLength: 128,
    minPasswordLength: 8,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['txt', 'pdf', 'docx', 'doc'],
  },

  // Session Management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    renewBeforeExpiry: 5 * 60 * 1000, // Renew 5 min before expiry
    maxConcurrentSessions: 3,
  },

  // Content Security
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.stripe.com',
    ],
    frameSrc: ["'self'", 'https://js.stripe.com'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: true,
  },

  // Allowed domains for external resources
  allowedDomains: {
    apis: ['supabase.co', 'stripe.com'],
    cdn: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    preventCommon: true,
    preventReuse: 5, // Don't allow last 5 passwords
  },

  // Banned patterns (potential XSS/injection)
  bannedPatterns: [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
  ],

  // Suspicious activities threshold
  suspiciousActivity: {
    maxFailedLogins: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    maxPasswordResets: 3,
    resetLockout: 60 * 60 * 1000, // 1 hour
  },
}

// Common passwords list (top 100 most common)
export const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  '123123',
  'baseball',
  'iloveyou',
  'trustno1',
  '1234567890',
  'sunshine',
  'master',
  '123321',
  '666666',
  'photoshop',
  '1qaz2wsx',
  'qwertyuiop',
  'ashley',
  'mustang',
  'password1',
  // Add more as needed
])

// Generate CSP header string
export function generateCSPHeader() {
  const csp = SECURITY_CONFIG.csp
  const policies = []

  for (const [directive, sources] of Object.entries(csp)) {
    if (directive === 'upgradeInsecureRequests') {
      if (sources) policies.push('upgrade-insecure-requests')
    } else {
      const kebabDirective = directive.replace(
        /[A-Z]/g,
        (m) => `-${m.toLowerCase()}`
      )
      policies.push(`${kebabDirective} ${sources.join(' ')}`)
    }
  }

  return policies.join('; ')
}

// Check if domain is allowed
export function isDomainAllowed(url, category = 'apis') {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const allowed = SECURITY_CONFIG.allowedDomains[category] || []
    return allowed.some((domain) => hostname.endsWith(domain))
  } catch (e) {
    return false
  }
}

// Validate password strength
export function validatePassword(password) {
  const config = SECURITY_CONFIG.password
  const errors = []

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters`)
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  if (config.preventCommon && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password')
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  }
}

// Calculate password strength score (0-100)
function calculatePasswordStrength(password) {
  let score = 0

  // Length
  score += Math.min(password.length * 4, 40)

  // Uppercase
  if (/[A-Z]/.test(password)) score += 10

  // Lowercase
  if (/[a-z]/.test(password)) score += 10

  // Numbers
  if (/\d/.test(password)) score += 10

  // Special chars
  if (/[^A-Za-z0-9]/.test(password)) score += 15

  // Variety
  const variety = new Set(password.split('')).size
  score += Math.min(variety * 2, 15)

  return Math.min(score, 100)
}

// Check for suspicious patterns
export function hasSuspiciousPatterns(text) {
  return SECURITY_CONFIG.bannedPatterns.some((pattern) => pattern.test(text))
}
