# AuthRPD Security Architecture

## Overview

This document describes the security architecture and best practices implemented in the AuthRPD system for a government-grade treasury environment.

## Security Layers

### 1. Helmet - HTTP Security Headers

**Purpose**: Protects against common web vulnerabilities by setting security headers.

**Configuration**:
- **HSTS (HTTP Strict Transport Security)**: Forces HTTPS connections for 1 year
- **X-Content-Type-Options: nosniff**: Prevents MIME type sniffing
- **X-Frame-Options: DENY**: Prevents clickjacking attacks
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Restricts browser features (disabled for APIs)
- **X-Powered-By**: Removed to hide Express version

**Why CSP is Disabled**:
- Content Security Policy is designed for HTML pages, not JSON APIs
- APIs return JSON, not HTML/CSS/JS, so CSP provides minimal benefit
- CSP can interfere with API clients and CORS
- For APIs, focus on authentication, rate limiting, and input validation

**Configuration File**: `src/security/helmet.config.js`

### 2. CORS - Cross-Origin Resource Sharing

**Purpose**: Controls which origins can access the API.

**Configuration**:
- **Allowlist-based Origins**: Only explicitly allowed origins can access the API
- **Credentials Support**: Configurable for trusted origins only
- **Preflight Handling**: Automatic handling of OPTIONS requests

**Security Considerations**:
- Wildcard origins are NOT used (security risk)
- All origins must be explicitly listed in `CORS_ORIGINS`
- Credentials are only allowed for trusted origins
- Blocked origin attempts are logged for security monitoring

**Configuration File**: `src/security/cors.config.js`

**Environment Variables**:
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `CORS_ALLOW_CREDENTIALS`: Enable credentials for CORS requests

### 3. Rate Limiting

**Purpose**: Protects against brute-force attacks, DDoS, and API abuse.

**Layers**:
1. **Global Rate Limiter**: 100 requests per 15 minutes (all routes)
2. **Auth Rate Limiter**: 20 requests per 15 minutes (`/auth/*` routes)
3. **Login Rate Limiter**: 5 attempts per 15 minutes (login endpoint)
4. **Refresh Rate Limiter**: 10 attempts per 15 minutes (refresh endpoint)

**Features**:
- **Redis-based**: Distributed rate limiting across multiple server instances
- **IP-based Keying**: Rate limits are per IP address
- **Security Logging**: Login failures and suspicious bursts are logged
- **Graceful Degradation**: Falls back to in-memory store if Redis unavailable

**Configuration File**: `src/middlewares/rate.limit.js`

**Environment Variables**:
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)
- `AUTH_RATE_LIMIT_MAX`: Maximum auth requests per window (default: 20)

### 4. Request Size Limits

**Purpose**: Prevents DoS attacks via large request bodies.

**Configuration**:
- **JSON Limit**: 10MB (configurable via `BODY_JSON_LIMIT`)
- **URL-encoded Limit**: 10MB (configurable via `BODY_URLENC_LIMIT`)
- **Parameter Limit**: Maximum 100 nested parameters

**Why It Matters**:
- Prevents memory exhaustion from large payloads
- Protects against buffer overflow attacks
- Limits resource consumption per request

**Configuration**: `src/app.js` (body parser middleware)

### 5. Input Validation (Joi)

**Purpose**: Prevents injection attacks and ensures data integrity.

**Features**:
- **Schema Validation**: All request bodies validated against Joi schemas
- **Type Conversion**: Automatic type conversion (e.g., "123" → 123)
- **Unknown Field Stripping**: Removes unknown fields (prevents parameter pollution)
- **Reusable Validators**: Common validators for ID, code, pagination

**Reusable Validators**:
- `idValidator`: Validates database IDs (integer, positive)
- `codeValidator`: Validates catalog codes (uppercase, alphanumeric)
- `paginationValidator`: Validates pagination parameters

**Configuration File**: `src/middlewares/schema.validator.js`

**Why It's Critical**:
- Prevents SQL injection (via type validation)
- Prevents NoSQL injection (via schema validation)
- Prevents command injection (via input sanitization)
- Ensures data integrity and type safety

### 6. JWT Token Security

**Purpose**: Secure authentication and authorization.

**Best Practices Implemented**:
- **RS256 Algorithm**: Asymmetric signing (more secure than HS256)
- **Short Access TTL**: 20 minutes (1200 seconds) - reduces token exposure window
- **Refresh Token Hashing**: Refresh tokens stored as hashes in database
- **Token Revocation**: Refresh tokens can be revoked
- **Claims Validation**: Validates `iss`, `aud`, `exp`, `nbf` claims
- **Key Rotation**: Monthly key rotation with `kid=YYYY-MM` format
- **JWKS Endpoint**: Public key distribution via `/.well-known/jwks.json`

**Configuration**: `src/modules/security/tokens/`

**Environment Variables**:
- `ACCESS_TTL_SECONDS`: Access token lifetime (default: 1200 = 20 minutes)
- `REFRESH_TTL_DAYS`: Refresh token lifetime (default: 60 days)
- `AUDIENCE`: JWT audience claim (default: "RPD")
- `ISSUER`: JWT issuer claim (default: "AUTHRPD")

### 7. Security Logging

**Purpose**: Monitor and detect security incidents.

**Logged Events**:
- **Login Failures**: All failed login attempts
- **Rate Limit Exceeded**: When rate limits are hit
- **Suspicious Bursts**: Unusual request patterns
- **CORS Violations**: Blocked origin attempts
- **Authentication Errors**: Token validation failures

**Log Format**: Structured JSON logs with correlation IDs

**Configuration**: `src/config/logger.js`

### 8. File Upload Security (Guidelines)

**Note**: File upload implementation is in RPD, but guidelines are provided here.

**Best Practices**:
- **Allowed MIME Types**: Whitelist specific MIME types (e.g., `application/pdf`, `image/jpeg`)
- **Max File Size**: Limit file size (e.g., 10MB for documents, 5MB for images)
- **AV Scanning**: Scan uploaded files with antivirus software
- **File Type Validation**: Validate file type by content, not extension
- **Quarantine**: Store uploaded files in quarantine before processing
- **Virus Scanning Placeholder**: Implement virus scanning before file processing

**Example Implementation**:
```javascript
// In RPD service
const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Validate MIME type
if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new Error('File type not allowed');
}

// Validate file size
if (file.size > maxFileSize) {
  throw new Error('File size exceeds limit');
}

// Scan for viruses (placeholder)
await scanFileForViruses(file);
```

## Middleware Order

The order of middleware is critical for security. The recommended order in `src/app.js`:

1. **Trust Proxy** (if behind reverse proxy)
2. **Request ID Middleware** (correlation tracking)
3. **Helmet** (security headers)
4. **CORS** (cross-origin handling)
5. **Body Parsers** (with size limits)
6. **Global Rate Limiter** (abuse protection)
7. **Request Logger** (audit trail)
8. **Routes** (with specific rate limiters)
9. **404 Handler** (unknown routes)
10. **Error Handler** (centralized error handling)

## Environment Variables

All security-related environment variables are documented in `.env.example`.

### Required for Production:
- `CORS_ORIGINS`: Must be set with production origins
- `TRUST_PROXY`: Set to `true` if behind reverse proxy
- `HSTS_MAX_AGE`: Set to 31536000 (1 year) for production
- `RATE_LIMIT_MAX`: Adjust based on expected traffic
- `AUTH_RATE_LIMIT_MAX`: Adjust based on authentication load

### Recommended for Production:
- `GRAYLOG_ENABLED=true`: Enable centralized logging
- `LOG_LEVEL=info`: Use info level in production
- `ACCESS_TTL_SECONDS`: Keep short (1200 seconds = 20 minutes)
- `REFRESH_TTL_DAYS`: Balance security and UX (60 days recommended)

## Security Checklist

- [x] Helmet security headers configured
- [x] CORS with allowlist-based origins
- [x] Rate limiting (global + auth-specific)
- [x] Request size limits
- [x] Input validation with Joi
- [x] JWT with RS256 and short TTL
- [x] Refresh token hashing
- [x] Security logging
- [x] Trust proxy configuration
- [x] Request correlation IDs
- [x] Error handling with security-aware logging

## Additional Security Considerations

1. **HTTPS**: Always use HTTPS in production (enforced by HSTS)
2. **Secrets Management**: Use environment variables or secret management services
3. **Database Security**: Use parameterized queries (Sequelize does this automatically)
4. **Redis Security**: Use password authentication for Redis
5. **Regular Updates**: Keep dependencies updated for security patches
6. **Security Audits**: Regular security audits and penetration testing
7. **Monitoring**: Monitor logs for suspicious activity
8. **Incident Response**: Have a plan for security incidents

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

