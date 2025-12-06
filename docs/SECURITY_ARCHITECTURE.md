# AuthRPD Security Architecture - Why Each Layer Matters

## Executive Summary

This document explains why each security layer in AuthRPD is critical for a government-grade treasury authentication service. Each layer addresses specific threats and vulnerabilities.

## Security Layers Explained

### 1. Helmet - HTTP Security Headers

**Why It's Needed:**
- **HSTS**: Prevents man-in-the-middle attacks by forcing HTTPS. Critical for treasury systems handling sensitive financial data.
- **X-Content-Type-Options**: Prevents MIME type confusion attacks where malicious files are served as safe content types.
- **X-Frame-Options**: Prevents clickjacking attacks where malicious sites embed your API responses in iframes.
- **Referrer-Policy**: Prevents sensitive information leakage through referrer headers.
- **X-Powered-By Removal**: Hides technology stack information from attackers (security through obscurity).

**Treasury Context**: Government systems are high-value targets. Hiding implementation details and enforcing HTTPS reduces attack surface.

### 2. CORS - Cross-Origin Resource Sharing

**Why It's Needed:**
- **Allowlist-based Origins**: Prevents unauthorized domains from accessing your API. Wildcard origins would allow any website to make requests.
- **Credential Control**: Only trusted origins can send credentials (cookies, auth headers). Prevents credential theft via malicious sites.
- **Preflight Handling**: Validates cross-origin requests before they reach your application logic.

**Treasury Context**: Budget organizations may access the API from various domains. CORS ensures only approved domains can access sensitive authentication endpoints.

### 3. Rate Limiting

**Why It's Needed:**
- **Brute-Force Protection**: Login rate limiting (5 attempts/15min) prevents password guessing attacks.
- **DDoS Mitigation**: Global rate limiting (100 requests/15min) prevents resource exhaustion attacks.
- **API Abuse Prevention**: Prevents automated scripts from overwhelming the API.
- **Distributed Limiting**: Redis-based limiting works across multiple server instances (critical for scalability).

**Treasury Context**: Authentication services are prime targets for brute-force attacks. Rate limiting is the first line of defense against credential theft.

### 4. Request Size Limits

**Why It's Needed:**
- **Memory Protection**: Prevents DoS attacks via large payloads that exhaust server memory.
- **Buffer Overflow Prevention**: Limits input size to prevent buffer overflow vulnerabilities.
- **Resource Management**: Ensures fair resource allocation across all API consumers.

**Treasury Context**: Large organizations may send bulk operations. Size limits ensure one client cannot monopolize server resources.

### 5. Input Validation (Joi)

**Why It's Needed:**
- **Injection Prevention**: Type validation prevents SQL/NoSQL injection attacks.
- **Data Integrity**: Ensures data conforms to expected formats before processing.
- **Parameter Pollution Prevention**: Strips unknown fields to prevent parameter pollution attacks.
- **Type Safety**: Automatic type conversion prevents type confusion vulnerabilities.

**Treasury Context**: Financial data must be validated strictly. Incorrect data types or formats could lead to calculation errors or security vulnerabilities.

### 6. JWT Token Security

**Why It's Needed:**
- **RS256 Algorithm**: Asymmetric signing allows public key distribution without exposing secrets. More secure than symmetric HS256.
- **Short Access TTL**: 20-minute tokens reduce exposure window if tokens are stolen.
- **Refresh Token Hashing**: Stored as hashes, so database compromise doesn't expose usable tokens.
- **Claims Validation**: Validates issuer, audience, expiration, and not-before claims to prevent token misuse.
- **Key Rotation**: Monthly rotation limits impact of key compromise.
- **JWKS Endpoint**: Public key distribution without exposing private keys.

**Treasury Context**: Authentication tokens are high-value targets. Short TTLs and key rotation minimize damage from token theft.

### 7. Security Logging

**Why It's Needed:**
- **Incident Detection**: Logs help identify security incidents (brute-force attempts, suspicious patterns).
- **Forensics**: Detailed logs enable post-incident analysis.
- **Compliance**: Government systems often require audit trails for compliance.
- **Monitoring**: Real-time log analysis can trigger alerts for suspicious activity.

**Treasury Context**: Government systems require comprehensive audit trails for compliance and security monitoring.

### 8. Trust Proxy Configuration

**Why It's Needed:**
- **Correct IP Detection**: When behind reverse proxy (nginx, load balancer), client IPs come from X-Forwarded-For header.
- **Rate Limiting Accuracy**: Correct IPs ensure rate limiting works per actual client, not per proxy.
- **Security Logging**: Accurate IPs in logs enable proper incident response.

**Treasury Context**: Production deployments typically use reverse proxies. Trust proxy ensures security features work correctly.

## Threat Model

### Threats Addressed:

1. **Brute-Force Attacks**: Rate limiting + security logging
2. **DDoS Attacks**: Rate limiting + request size limits
3. **Injection Attacks**: Input validation (Joi)
4. **Token Theft**: Short TTLs + refresh token hashing
5. **Man-in-the-Middle**: HSTS + HTTPS enforcement
6. **Clickjacking**: X-Frame-Options
7. **MIME Confusion**: X-Content-Type-Options
8. **Information Disclosure**: X-Powered-By removal + referrer policy
9. **Unauthorized Access**: CORS allowlist
10. **Credential Theft**: CORS credentials control

## Defense in Depth

Each security layer provides defense in depth:

- **Layer 1 (Network)**: HTTPS, HSTS, CORS
- **Layer 2 (Application)**: Rate limiting, size limits
- **Layer 3 (Data)**: Input validation, type checking
- **Layer 4 (Authentication)**: JWT security, token rotation
- **Layer 5 (Monitoring)**: Security logging, audit trails

If one layer fails, others provide protection.

## Compliance Considerations

Government treasury systems often require:

- **Audit Trails**: Security logging provides comprehensive audit trails
- **Access Controls**: CORS + authentication ensure only authorized access
- **Data Protection**: Input validation + encryption protect sensitive data
- **Incident Response**: Logging enables rapid incident detection and response

## Best Practices Implemented

1. ✅ **Principle of Least Privilege**: CORS allowlist, strict rate limits
2. ✅ **Defense in Depth**: Multiple security layers
3. ✅ **Fail Secure**: Rate limiting fails closed (blocks requests)
4. ✅ **Security by Design**: Security built into architecture, not bolted on
5. ✅ **Audit and Monitoring**: Comprehensive logging
6. ✅ **Regular Updates**: Key rotation, dependency updates
7. ✅ **Configuration Management**: Environment-based configuration

## Conclusion

Each security layer in AuthRPD addresses specific threats relevant to a government-grade treasury authentication service. Together, they provide comprehensive protection against common attack vectors while maintaining usability and performance.

