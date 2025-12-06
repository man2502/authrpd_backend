# Swagger/OpenAPI Documentation for AuthRPD

## Overview

AuthRPD uses Swagger/OpenAPI 3.0 for API documentation. The documentation is generated from JSDoc annotations in route files and served via Swagger UI.

## Endpoints

- **Swagger UI**: `GET /docs` - Interactive API documentation interface
- **OpenAPI JSON**: `GET /docs.json` - Raw OpenAPI 3.0 specification

## Configuration

### Environment Variables

- `SWAGGER_ENABLED`: Enable/disable Swagger documentation
  - Development: Enabled by default (set to `false` to disable)
  - Production: Disabled by default (set to `true` to enable)
- `API_BASE_URL`: Base URL for API (used in OpenAPI spec)
  - Development: `http://localhost:3000`
  - Production: `https://api.authrpd.gov`

### Security Considerations

**For Government Systems:**

1. **Production Default**: Swagger UI is disabled in production by default
   - Prevents information disclosure to unauthorized users
   - Reduces attack surface

2. **Enable When Needed**: Set `SWAGGER_ENABLED=true` only when:
   - Running internal documentation server
   - Need API documentation for developers
   - Documentation server is behind authentication

3. **IP Whitelisting**: Consider adding IP whitelisting for `/docs` endpoint in production
   - Use nginx/load balancer rules
   - Restrict access to internal networks only

4. **Authentication**: Consider protecting `/docs` endpoint with authentication
   - Add auth middleware before Swagger initialization
   - Use API key or JWT authentication

## Adding Documentation to Routes

### Basic Example

Add JSDoc comments with `@swagger` annotation above your route:

```javascript
/**
 * @swagger
 * /auth/member/login:
 *   post:
 *     tags: [Auth]
 *     summary: Member login
 *     description: Authenticate a member user
 *     security: []  # Public endpoint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */
router.post('/member/login', ...);
```

### Protected Endpoint Example

For endpoints requiring authentication:

```javascript
/**
 * @swagger
 * /rbac/roles/{id}/permissions:
 *   get:
 *     tags: [RBAC]
 *     summary: Get role permissions
 *     security:
 *       - bearerAuth: []  # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/roles/:id/permissions', authGuard, ...);
```

### Using Schema References

Reusable schemas are defined in `swagger.config.js`. Use them with `$ref`:

- `#/components/schemas/LoginRequest`
- `#/components/schemas/LoginResponse`
- `#/components/schemas/SuccessResponse`
- `#/components/schemas/ErrorResponse`

### Using Response References

Common error responses:

- `#/components/responses/UnauthorizedError`
- `#/components/responses/ValidationError`
- `#/components/responses/RateLimitError`

## Available Tags

- `Auth` - Authentication endpoints
- `Members` - Member user management
- `Clients` - Client application management
- `RBAC` - Role-Based Access Control
- `Catalogs` - Master catalog management
- `Sync` - Catalog synchronization
- `Security` - Security endpoints (JWKS, etc.)
- `Audit` - Audit log endpoints

## Response Format

All responses follow AuthRPD format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "data": {
    "error_code": 400,
    "error_msg": "Error message",
    "field": "field_name"  // Optional
  }
}
```

## Authentication in Swagger UI

1. Click "Authorize" button in Swagger UI
2. Enter JWT token: `Bearer <your-token>`
3. Token will be persisted for all requests
4. Use login endpoint to obtain token first

## Best Practices

1. **Document All Endpoints**: Add Swagger annotations to all routes
2. **Use Tags**: Group related endpoints with tags
3. **Include Examples**: Add examples for request/response
4. **Document Security**: Mark public vs protected endpoints
5. **Update Regularly**: Keep documentation in sync with code
6. **Test Examples**: Ensure examples in docs match actual API behavior

## File Structure

```
src/
  docs/
    swagger.config.js    # OpenAPI configuration
    swagger.init.js      # Swagger initialization
  modules/
    auth/
      auth.routes.js     # Routes with Swagger annotations
    ...
```

## Troubleshooting

### Swagger UI Not Loading

1. Check `SWAGGER_ENABLED` environment variable
2. Verify middleware order in `app.js`
3. Check browser console for errors
4. Verify route files are scanned (check `apis` in `swagger.config.js`)

### Annotations Not Appearing

1. Ensure JSDoc comments use `@swagger` annotation
2. Check file paths in `swagger.config.js` `apis` array
3. Verify OpenAPI 3.0 syntax is correct
4. Check for syntax errors in annotations

### Authentication Not Working

1. Verify JWT token format: `Bearer <token>`
2. Check token expiration
3. Verify JWKS endpoint is accessible
4. Check token claims (iss, aud, exp)

## References

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)

