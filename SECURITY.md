# 🔒 Security Documentation

## Overview

Comprehensive security system for the Ovara writing tool application. This document outlines all security features, configurations, and best practices.

---

## 🛡️ Security Features

### 1. **Rate Limiting**
- ✅ Per-user request tracking
- ✅ Tier-based limits (free, basic, pro, premium)
- ✅ Per-minute and per-hour limits
- ✅ Automatic cleanup to prevent memory leaks
- ✅ Suspicious activity detection

### 2. **Input Validation & Sanitization**
- ✅ XSS prevention
- ✅ Script tag removal
- ✅ Event handler sanitization
- ✅ SQL injection prevention
- ✅ Prototype pollution protection

### 3. **Content Security Policy (CSP)**
- ✅ Strict CSP headers
- ✅ Whitelisted domains
- ✅ Inline script restrictions
- ✅ Frame protection

### 4. **Authentication & Session Management**
- ✅ JWT token authentication
- ✅ Session timeout
- ✅ Activity tracking
- ✅ Concurrent session limits

### 5. **Error Boundaries**
- ✅ React error catching
- ✅ Graceful degradation
- ✅ User-friendly error UI

---

## 📁 File Structure

```
src/
├── config/
│   └── security.js              # Security configuration & constants
├── utils/
│   ├── sanitize.js             # Input sanitization utilities
│   ├── validation.js           # Input validation schemas
│   └── rateLimiter.js          # Rate limiting system
├── hooks/
│   └── useSecurity.js          # Security React hook
├── components/
│   ├── ErrorBoundary.jsx       # Error boundary component
│   └── SecurityDashboard.jsx   # Security monitoring UI
```

---

## 🔧 Implementation Guide

### Basic Usage

#### 1. Using the Security Hook

```javascript
import { useSecurity } from './hooks/useSecurity'

function MyComponent({ user, userSubscription }) {
  const security = useSecurity(user, userSubscription)

  const handleSubmit = async () => {
    // Check rate limit
    const limitCheck = security.checkRateLimit('submit-action')
    if (!limitCheck.allowed) {
      showToast(limitCheck.error)
      return
    }

    // Validate input
    const validation = security.validateInput(inputText, {
      maxLength: 5000,
      checkPatterns: true,
    })

    if (!validation.isValid) {
      showToast(validation.errors.join(', '))
      return
    }

    // Make API call
    await secureApiCall(apiFunction, validation.sanitized)
  }

  return (
    <div>
      {security.isBlocked && (
        <div className="alert">
          Account blocked: {security.blockReason}
        </div>
      )}
      {/* ... */}
    </div>
  )
}
```

#### 2. Using Rate Limiter Directly

```javascript
import { rateLimiter } from './utils/rateLimiter'

const result = rateLimiter.checkLimit(userId, 'pro', 'api-call')

if (result.allowed) {
  // Proceed with request
  console.log(`Remaining: ${result.remaining}`)
} else {
  console.error(result.error)
}
```

#### 3. Validating API Requests

```javascript
import { validateApiRequest, API_SCHEMAS } from './utils/validation'

const validation = validateApiRequest(requestBody, API_SCHEMAS.toneMapper)

if (validation.isValid) {
  // Send validation.sanitized to API
  await fetch('/api/tone-mapper', {
    method: 'POST',
    body: JSON.stringify(validation.sanitized),
  })
} else {
  console.error('Validation errors:', validation.errors)
}
```

---

## 📊 Rate Limits

### Tier-based Limits

| Tier    | Requests/Min | Requests/Hour | Max Text Length |
|---------|--------------|---------------|-----------------|
| Free    | 5            | 20            | 1,000 chars     |
| Basic   | 15           | 100           | 5,000 chars     |
| Pro     | 30           | 500           | 10,000 chars    |
| Premium | 60           | 2,000         | 50,000 chars    |

### Automatic Actions

- **Warning:** User exceeds 80% of limit
- **Block:** User hits 100% of limit
- **Auto-unblock:** After cooldown period (15 minutes)
- **Suspicious Activity:** Automatic detection and logging

---

## 🔐 Input Validation

### Text Validation

```javascript
validateText(text, {
  required: true,
  minLength: 1,
  maxLength: 10000,
  allowEmpty: false,
  checkPatterns: true,
})
```

### Email Validation

```javascript
validateEmailInput(email)
// Returns: { isValid, errors, sanitized }
```

### Password Validation

```javascript
validatePasswordInput(password)
// Returns: { isValid, errors, sanitized, strength }
```

### Requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Not in common passwords list

---

## 🚫 Banned Patterns

The system automatically blocks content containing:

- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, `onerror`, etc.)
- `<iframe>`, `<embed>`, `<object>` tags
- `eval()` function calls
- CSS `expression()` calls

---

## 🎯 Content Security Policy

### CSP Headers

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
frame-src 'self' https://js.stripe.com;
object-src 'none';
upgrade-insecure-requests;
```

### Whitelisted Domains

**APIs:**
- `*.supabase.co` - Database & authentication
- `stripe.com` - Payment processing

**CDN:**
- `fonts.googleapis.com` - Google Fonts
- `fonts.gstatic.com` - Font assets

---

## 🔒 Security Headers

### Applied Headers

| Header                        | Value                                     |
|-------------------------------|-------------------------------------------|
| X-Frame-Options               | DENY                                      |
| X-Content-Type-Options        | nosniff                                   |
| X-XSS-Protection              | 1; mode=block                             |
| Referrer-Policy               | strict-origin-when-cross-origin           |
| Permissions-Policy            | geolocation=(), microphone=(), camera=()  |
| Strict-Transport-Security     | max-age=31536000; includeSubDomains       |

---

## 🚨 Suspicious Activity Detection

### Triggers

1. **Excessive Requests:** >30 requests/minute
2. **Rapid-Fire:** >10 requests with <100ms intervals
3. **Pattern Matching:** Consistent timing (possible bot)
4. **Failed Auth:** >5 failed login attempts
5. **Unusual Behavior:** Out-of-pattern usage

### Responses

1. **Warning:** Log suspicious activity
2. **Slowdown:** Increase rate limit strictness
3. **Block:** Temporary account suspension (15 min)
4. **Alert:** Notify administrators (production)

---

## 📈 Monitoring & Analytics

### User Dashboard

The Security Dashboard (`/security`) provides:
- Real-time rate limit status
- Usage statistics
- Recent activity log
- Account security status
- System-wide stats (admin only)

### Metrics Tracked

- Request count (per minute, per hour)
- Failed attempts
- Blocked users
- Active users
- System load

---

## 🛠️ Backend Integration

### Edge Function Security

When implementing Edge Functions, add security checks:

```javascript
// Example Edge Function with security
export default async (req) => {
  try {
    // 1. Verify authentication
    const token = req.headers.get('Authorization')
    const { user } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    // 2. Validate request body
    const body = await req.json()
    const validation = validateApiRequest(body, schema)

    if (!validation.isValid) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: validation.errors,
      }), { status: 400 })
    }

    // 3. Check rate limit (backend side)
    const rateLimitCheck = await checkBackendRateLimit(user.id)

    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
      }), { status: 429 })
    }

    // 4. Process request with sanitized data
    const result = await processRequest(validation.sanitized)

    return new Response(JSON.stringify(result), {
      status: 200,
    })

  } catch (error) {
    // Log error securely (don't expose details)
    console.error('Edge function error:', error)

    return new Response(JSON.stringify({
      error: 'Internal server error',
    }), { status: 500 })
  }
}
```

---

## 🔍 Security Audit Checklist

### Frontend Security
- [x] Input sanitization on all user inputs
- [x] XSS prevention
- [x] Rate limiting
- [x] Error boundaries
- [x] Secure password validation
- [x] Session timeout
- [x] CSRF protection (via Supabase)

### Backend Security (To Implement)
- [ ] Server-side rate limiting
- [ ] Request validation
- [ ] SQL injection prevention
- [ ] Authentication verification
- [ ] Secure error handling
- [ ] Audit logging
- [ ] IP-based rate limiting

### Infrastructure
- [ ] HTTPS enforcement
- [ ] CSP headers configured
- [ ] Security headers set
- [ ] DDoS protection
- [ ] Regular security updates
- [ ] Vulnerability scanning

---

## 📞 Security Incident Response

### If Suspicious Activity Detected:

1. **Immediate Actions:**
   - Block affected user account
   - Log all relevant details
   - Notify administrators

2. **Investigation:**
   - Review activity logs
   - Check for data breaches
   - Identify attack vector

3. **Mitigation:**
   - Patch vulnerabilities
   - Update security rules
   - Notify affected users

4. **Prevention:**
   - Improve detection systems
   - Update documentation
   - Train team on new threats

---

## 🎓 Best Practices

### For Developers

1. **Always Validate Input**
   ```javascript
   const validation = validateText(userInput)
   if (!validation.isValid) {
     return { error: validation.errors }
   }
   ```

2. **Use Security Hook**
   ```javascript
   const security = useSecurity(user, subscription)
   const result = security.checkRateLimit()
   ```

3. **Sanitize Before Display**
   ```javascript
   const safe = sanitizeText(userInput)
   ```

4. **Never Trust Client Data**
   - Always validate on backend
   - Don't rely on frontend validation alone

5. **Log Security Events**
   - Track failed attempts
   - Monitor suspicious patterns
   - Alert on anomalies

### For Users

1. Use strong, unique passwords
2. Don't share account credentials
3. Log out on shared devices
4. Report suspicious activity
5. Monitor usage dashboard

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional (production)
VITE_ENABLE_SECURITY_LOGS=true
VITE_SECURITY_ALERT_EMAIL=security@ovara.com
```

### Deploy Checklist

1. ✅ Set all security headers
2. ✅ Configure CSP
3. ✅ Enable HTTPS
4. ✅ Test rate limiting
5. ✅ Verify input sanitization
6. ✅ Test error boundaries
7. ✅ Set up monitoring
8. ✅ Configure logging
9. ✅ Test suspicious activity detection
10. ✅ Document security procedures

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Input Validation Guide](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

## 📝 Updates & Changelog

### Version 1.0.0 (2025-10-16)
- ✅ Initial security system implementation
- ✅ Rate limiting with tier support
- ✅ Input validation and sanitization
- ✅ CSP configuration
- ✅ Security dashboard
- ✅ Error boundaries
- ✅ Suspicious activity detection

---

**Last Updated:** 2025-10-16
**Maintained By:** Ovara Security Team
**Contact:** security@ovara.com
