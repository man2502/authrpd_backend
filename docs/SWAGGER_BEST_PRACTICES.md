# Swagger Best Practices for Security-Sensitive Government Systems

## Overview

This document outlines best practices for using Swagger/OpenAPI documentation in government-grade treasury systems like AuthRPD.

## Security Considerations

### 1. Production Default: Disabled

**Why**: Swagger UI exposes API structure, endpoints, and request/response formats. In production, this information can be valuable to attackers.

**Implementation**:
- Swagger is disabled by default in production
- Set `SWAGGER_ENABLED=true` only when explicitly needed
- Use separate documentation servers for production docs

### 2. Access Control

**Recommendations**:
- **IP Whitelisting**: Restrict `/docs` endpoint to internal networks only
- **Authentication**: Add authentication middleware before Swagger initialization
- **VPN Access**: Require VPN connection for documentation access
- **Separate Server**: Run documentation on separate internal server

**Example nginx configuration**:
```nginx
location /docs {
    allow 10.0.0.0/8;      # Internal network
    allow 192.168.0.0/16;  # Internal network
    deny all;
    proxy_pass http://authrpd_api:3000;
}
```

### 3. Information Disclosure

**What to Avoid**:
- ❌ Don't document internal endpoints
- ❌ Don't include sensitive default values
- ❌ Don't expose error messages that reveal system internals
- ❌ Don't document admin-only endpoints in public docs

**What to Include**:
- ✅ Public API endpoints only
- ✅ Generic error messages
- ✅ Standard response formats
- ✅ Authentication requirements

### 4. Token Security

**Best Practices**:
- Document JWT authentication clearly
- Explain token expiration and refresh flow
- Warn users not to share tokens
- Use `persistAuthorization: false` in production (or require re-auth)

### 5. Rate Limiting Documentation

**Include**:
- Document rate limits in endpoint descriptions
- Explain rate limit headers
- Provide guidance on handling 429 responses
- Document different limits for different endpoints

## Documentation Quality

### 1. Completeness

**Requirements**:
- Document all public endpoints
- Include request/response schemas
- Provide examples for common use cases
- Document error responses

### 2. Accuracy

**Maintenance**:
- Keep documentation in sync with code
- Review documentation during code reviews
- Update examples when API changes
- Test examples regularly

### 3. Clarity

**Guidelines**:
- Use clear, concise descriptions
- Explain business logic, not just technical details
- Include use case examples
- Document required vs optional fields

## Government-Specific Considerations

### 1. Compliance

**Requirements**:
- Document security controls
- Explain authentication mechanisms
- Document audit logging
- Include compliance-related endpoints

### 2. Multi-Tenancy

**Documentation**:
- Explain tenant isolation
- Document tenant-specific endpoints
- Clarify data access rules
- Include tenant context in examples

### 3. Audit Trails

**Documentation**:
- Explain audit logging
- Document audit endpoints
- Include audit-related headers
- Explain retention policies

## Implementation Checklist

- [ ] Swagger disabled in production by default
- [ ] Environment variable for enabling/disabling
- [ ] IP whitelisting configured (if enabled in production)
- [ ] Authentication added (if needed)
- [ ] All public endpoints documented
- [ ] Security schemes documented
- [ ] Examples match actual API behavior
- [ ] Error responses documented
- [ ] Rate limiting explained
- [ ] Token security documented
- [ ] Documentation reviewed for information disclosure
- [ ] Examples tested and verified

## Monitoring

**Track**:
- Access to `/docs` endpoint
- Failed authentication attempts
- Unusual access patterns
- Documentation server performance

**Alerts**:
- Unauthorized access attempts
- High traffic to documentation endpoints
- Documentation server errors

## Incident Response

**If Documentation is Compromised**:
1. Immediately disable Swagger (`SWAGGER_ENABLED=false`)
2. Review access logs
3. Rotate any exposed credentials
4. Assess information disclosure
5. Update security controls
6. Document incident

## Alternative Approaches

### 1. Separate Documentation Server

Run Swagger UI on separate internal server:
- Isolated from production API
- Better access control
- Reduced attack surface

### 2. Static Documentation

Generate static OpenAPI spec:
- Export `/docs.json`
- Serve as static file
- No runtime overhead
- Better security

### 3. Internal Wiki

Use internal wiki for documentation:
- Better access control
- More flexible formatting
- Version control
- Collaboration features

## Conclusion

Swagger documentation is valuable for API consumers but must be carefully managed in security-sensitive government systems. Follow these best practices to balance usability and security.

