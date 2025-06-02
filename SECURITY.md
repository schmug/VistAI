# Security Guidelines for VistAI

This document outlines security considerations, best practices, and procedures for the VistAI application.

## Table of Contents
- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Deployment Security](#deployment-security)
- [Client-Side Security](#client-side-security)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

## Security Overview

VistAI handles sensitive data including user credentials, API keys, and search queries. This document provides comprehensive security guidelines for developers, administrators, and users.

### Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for users and components
3. **Zero Trust**: Verify every request regardless of source
4. **Data Minimization**: Collect and store only necessary data
5. **Transparency**: Clear data handling and privacy practices

## Authentication & Authorization

### Current Implementation Issues ⚠️

**CRITICAL SECURITY VULNERABILITIES** that need immediate attention:

#### 1. Weak JWT Secret Configuration
```javascript
// VULNERABLE: worker/worker.js
const secret = env.JWT_SECRET || 'secret';
```

**Risk**: Hardcoded fallback enables JWT forgery  
**Fix**: Enforce strong secrets and fail if not provided
```javascript
const secret = env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
```

#### 2. Insecure Password Hashing
```javascript
// VULNERABLE: worker/db.js
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
```

**Risk**: Rainbow table attacks, no salt protection  
**Fix**: Use bcrypt with proper salt rounds
```javascript
import bcrypt from 'bcrypt';

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

#### 3. Insecure JWT Storage
```typescript
// VULNERABLE: client/src/contexts/AuthContext.tsx
localStorage.setItem("token", newToken);
```

**Risk**: XSS attacks can steal tokens  
**Fix**: Use HttpOnly cookies (requires backend changes)
```typescript
// Server-side (preferred)
res.setHeader('Set-Cookie', 
  `token=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
);

// OR client-side with secure storage
const secureStorage = {
  setToken: (token: string) => {
    // Use secure cookie library or encrypted storage
  }
};
```

### Secure Authentication Best Practices

#### Password Requirements
- **Minimum length**: 8 characters
- **Complexity**: Mix of letters, numbers, and symbols
- **Common password blocking**: Reject top 10,000 common passwords
- **Rate limiting**: Max 5 login attempts per minute per IP

#### JWT Security
- **Short expiration**: 15-30 minutes for access tokens
- **Refresh tokens**: Longer-lived, HttpOnly cookies
- **Algorithm**: Use RS256 or ES256 for production
- **Claims validation**: Verify issuer, audience, expiration

#### Session Management
```typescript
// Recommended JWT payload
{
  "iss": "vistai",
  "sub": "user_id",
  "aud": "vistai-frontend", 
  "exp": Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
  "iat": Math.floor(Date.now() / 1000),
  "jti": "unique_token_id" // For revocation
}
```

## Data Protection

### Sensitive Data Classification

| Data Type | Classification | Storage | Encryption |
|-----------|---------------|---------|------------|
| User passwords | Critical | Database | Bcrypt hashed |
| JWT tokens | Critical | HttpOnly cookies | N/A |
| OpenRouter API keys | Critical | Environment/encrypted DB | AES-256 |
| Search queries | Sensitive | Database | Consider encryption |
| User emails | Sensitive | Database | Optional encryption |
| Analytics data | Internal | Database | No encryption needed |

### Data Storage Security

#### Database Security
```sql
-- Add these indexes for security and performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_searches_created_at ON searches(created_at);
CREATE INDEX idx_results_search_id ON results(search_id);

-- Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;

-- Set secure timeout
PRAGMA busy_timeout=30000;
```

#### API Key Management
**Current Issue**: API keys stored in localStorage
```typescript
// VULNERABLE
window.localStorage.setItem("openrouter_api_key", apiKey);
```

**Secure Solution**: Server-side encrypted storage
```typescript
// Server-side API key encryption
import crypto from 'crypto';

export function encryptApiKey(apiKey: string, userSecret: string): string {
  const cipher = crypto.createCipher('aes-256-gcm', userSecret);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptApiKey(encryptedKey: string, userSecret: string): string {
  const decipher = crypto.createDecipher('aes-256-gcm', userSecret);
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Privacy Considerations
- **Data retention**: Automatically delete old searches after 90 days
- **User consent**: Clear consent for analytics data collection
- **Data export**: Provide user data export functionality
- **Right to deletion**: Allow users to delete their accounts and data

## API Security

### CORS Configuration
**Current Issue**: Overly permissive CORS
```javascript
// VULNERABLE
const cfg = env.ACCESS_CONTROL_ALLOW_ORIGIN || '*';
```

**Secure Solution**: Explicit origin whitelist
```javascript
// SECURE
const allowedOrigins = [
  'https://vistai.pages.dev',
  'https://your-domain.com'
];

function createCorsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-XSS-Protection': '1; mode=block'
  };
}
```

### Input Validation
```typescript
// Comprehensive input validation
export const validators = {
  username: (value: string) => {
    if (!value || value.length < 3 || value.length > 20) {
      throw new Error('Username must be 3-20 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
    return value.toLowerCase();
  },

  password: (value: string) => {
    if (!value || value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      throw new Error('Password must contain uppercase, lowercase, and number');
    }
    return value;
  },

  searchQuery: (value: string) => {
    if (!value || value.length > 1000) {
      throw new Error('Query must be 1-1000 characters');
    }
    // Sanitize potential HTML/script injection
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
};
```

### Rate Limiting
```javascript
// Implement rate limiting middleware
const rateLimits = new Map();

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, []);
  }
  
  const requests = rateLimits.get(key).filter(time => time > windowStart);
  
  if (requests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  requests.push(now);
  rateLimits.set(key, requests);
}

// Usage in endpoints
rateLimit(`auth:${clientIP}`, 5, 60000); // 5 auth attempts per minute
rateLimit(`search:${userId}`, 20, 60000); // 20 searches per minute per user
```

## Deployment Security

### Environment Variables
```bash
# Required secure environment variables
JWT_SECRET="<256-bit-random-string>"
OPENROUTER_API_KEY="<your-openrouter-key>"
DATABASE_ENCRYPTION_KEY="<256-bit-random-string>"

# Optional security configurations
ACCESS_CONTROL_ALLOW_ORIGIN="https://your-domain.com"
RATE_LIMIT_ENABLED=true
ANALYTICS_ENABLED=true
```

### Cloudflare Worker Security
```toml
# wrangler.toml security settings
[env.production]
name = "vistai-worker-prod"
vars = { 
  NODE_ENV = "production",
  ACCESS_CONTROL_ALLOW_ORIGIN = "https://vistai.pages.dev"
}

# Security headers
compatibility_flags = ["nodejs_compat"]
```

### Database Security
- **Access control**: Restrict D1 database access to specific workers
- **Backup encryption**: Ensure database backups are encrypted
- **Audit logging**: Enable CloudFlare audit logs for database access

## Client-Side Security

### Content Security Policy (CSP)
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://your-worker.workers.dev;
  frame-ancestors 'none';
">
```

### XSS Prevention
```typescript
// Sanitize user inputs before rendering
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Use in components
<div dangerouslySetInnerHTML={{
  __html: sanitizeHtml(userInput)
}} />
```

### Secure Data Storage
```typescript
// Replace localStorage for sensitive data
class SecureStorage {
  private readonly prefix = 'vistai_';
  
  setItem(key: string, value: string): void {
    // Use sessionStorage for sensitive data
    sessionStorage.setItem(this.prefix + key, value);
  }
  
  getItem(key: string): string | null {
    return sessionStorage.getItem(this.prefix + key);
  }
  
  removeItem(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }
}
```

## Incident Response

### Security Incident Procedures

1. **Immediate Response** (0-4 hours):
   - Identify and contain the incident
   - Assess impact and affected systems
   - Notify key stakeholders
   - Document all actions taken

2. **Investigation** (4-24 hours):
   - Collect evidence and logs
   - Determine root cause
   - Assess data breach scope
   - Coordinate with security team

3. **Recovery** (24-72 hours):
   - Implement fixes and patches
   - Restore services safely
   - Monitor for additional threats
   - Update security measures

4. **Post-Incident** (1-2 weeks):
   - Complete incident report
   - Update security procedures
   - Implement lessons learned
   - Notify affected users if required

### Contact Information
- **Security Team**: security@your-domain.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Incident Reporting**: [Security Issue Template](link-to-template)

## Security Checklist

### Pre-Deployment Security Checklist

#### Backend Security
- [ ] JWT secret is randomly generated and secure (32+ characters)
- [ ] Passwords use bcrypt with salt rounds ≥ 12
- [ ] API endpoints have proper input validation
- [ ] Rate limiting is implemented and tested
- [ ] CORS is configured with specific origins
- [ ] Security headers are set correctly
- [ ] Database queries use parameterized statements
- [ ] Sensitive data is encrypted at rest
- [ ] Error messages don't expose sensitive information
- [ ] All dependencies are up to date and scanned for vulnerabilities

#### Frontend Security  
- [ ] JWT tokens are stored securely (HttpOnly cookies preferred)
- [ ] API keys are not exposed in client-side code
- [ ] XSS protection is implemented for user inputs
- [ ] Content Security Policy is configured
- [ ] Third-party scripts are minimized and trusted
- [ ] Sensitive operations require re-authentication
- [ ] Session timeout is implemented
- [ ] HTTPS is enforced in production

#### Infrastructure Security
- [ ] All secrets are stored in environment variables
- [ ] Production environment uses different credentials
- [ ] Database access is restricted to authorized workers
- [ ] Monitoring and alerting is configured
- [ ] Backup and recovery procedures are tested
- [ ] Security headers are configured at CDN level

### Regular Security Maintenance

#### Weekly
- [ ] Review access logs for suspicious activity
- [ ] Check for new dependency vulnerabilities
- [ ] Monitor error rates and unusual patterns

#### Monthly  
- [ ] Update dependencies to latest secure versions
- [ ] Review and rotate API keys
- [ ] Audit user accounts and permissions
- [ ] Test backup and recovery procedures

#### Quarterly
- [ ] Conduct security assessment
- [ ] Review and update security policies
- [ ] Penetration testing (if applicable)
- [ ] Security awareness training

## Vulnerability Reporting

If you discover a security vulnerability in VistAI, please report it responsibly:

1. **Do not** disclose the vulnerability publicly
2. Email details to: security@your-domain.com
3. Include steps to reproduce the issue
4. Allow 90 days for investigation and fix
5. We will acknowledge receipt within 24 hours

### Responsible Disclosure Timeline
- **Day 0**: Vulnerability reported
- **Day 1**: Acknowledgment sent
- **Day 7**: Initial assessment completed  
- **Day 30**: Fix developed and tested
- **Day 45**: Fix deployed to production
- **Day 90**: Public disclosure (if appropriate)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Documentation](https://developers.cloudflare.com/workers/platform/security/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Last Updated**: January 2025  
**Next Review**: April 2025