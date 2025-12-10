const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('../config/env');

/**
 * Swagger/OpenAPI Configuration for AuthRPD
 * 
 * This configuration defines the OpenAPI 3.0 specification for the AuthRPD API.
 * It includes security schemes, tags, and base information for all API modules.
 * 
 * Security Considerations for Government Systems:
 * - Swagger UI is disabled in production by default (SWAGGER_ENABLED=false)
 * - Documentation can be enabled for internal documentation servers
 * - JWT security scheme is documented for API consumers
 * - Sensitive endpoints are clearly marked
 * 
 * How to Add Documentation for New Routes:
 * 1. Add JSDoc comments above your route handler in the route file
 * 2. Use @swagger annotation with OpenAPI 3.0 syntax
 * 3. Include security requirements for protected routes
 * 4. Document request/response schemas
 * 5. Add examples that match AuthRPD response format
 * 
 * Example:
 * 
 * @swagger
 * /auth/member/login:
 *   post:
 *     tags: [Auth]
 *     summary: Member login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AuthRPD API',
      version: '1.0.0',
      description: `
# AuthRPD - Central Authentication and Master Catalog System

Government-grade treasury authentication and catalog management API.

## Authentication

This API uses JWT (JSON Web Tokens) with ES256 algorithm for authentication.

### How to Authenticate:

1. **Login**: POST to \`/auth/member/login\` or \`/auth/client/login\` with credentials
2. **Receive Tokens**: Response includes \`access_token\` and \`refresh_token\`
3. **Use Access Token**: Include in \`Authorization: Bearer <token>\` header for protected endpoints
4. **Refresh Token**: Use \`/auth/refresh\` endpoint when access token expires

### Token Security:

- **Algorithm**: ES256 (ECDSA P-256, asymmetric signing)
- **Access Token TTL**: 20 minutes (1200 seconds)
- **Refresh Token TTL**: 60 days
- **Key Rotation**: Monthly rotation with \`kid=YYYY-MM\` format
- **Verification**: Tokens are verified using public keys from \`/.well-known/jwks.json\`
- **Claims**: Tokens include \`iss\` (issuer), \`aud\` (audience), \`exp\` (expiration), \`nbf\` (not before)

### JWKS Endpoint:

Public keys for token verification are available at:
\`GET /.well-known/jwks.json\`

This endpoint is public and does not require authentication.

## Response Format

All API responses follow a consistent format:

### Success Response:
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Error Response:
\`\`\`json
{
  "success": false,
  "data": {
    "error_code": 400,
    "error_msg": "Error message",
    "field": "field_name" // Optional, for validation errors
  }
}
\`\`\`

## Rate Limiting

- **Global**: 100 requests per 15 minutes
- **Auth Endpoints**: 20 requests per 15 minutes
- **Login**: 5 attempts per 15 minutes
- **Refresh**: 10 attempts per 15 minutes

Rate limit information is included in response headers:
- \`RateLimit-Limit\`: Maximum requests allowed
- \`RateLimit-Remaining\`: Remaining requests in window
- \`RateLimit-Reset\`: Time when limit resets (Unix timestamp)
      `,
      contact: {
        name: 'AuthRPD Support',
        email: 'support@authrpd.gov',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.authrpd.gov',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints for members and clients',
      },
      {
        name: 'Members',
        description: 'Member user management',
      },
      {
        name: 'Clients',
        description: 'Client application management',
      },
      {
        name: 'RBAC',
        description: 'Role-Based Access Control - roles, permissions, and assignments',
      },
      {
        name: 'Catalogs',
        description: 'Master catalog management - regions, ministries, organizations, classifiers',
      },
      {
        name: 'Sync',
        description: 'Catalog synchronization endpoints for regional RPD systems',
      },
      {
        name: 'Security',
        description: 'Security-related endpoints - JWKS, key management',
      },
      {
        name: 'Audit',
        description: 'Audit log endpoints for security monitoring',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: `
JWT authentication using ES256 algorithm.

**How it works:**
1. Obtain access token via login endpoint
2. Include token in Authorization header: \`Authorization: Bearer <token>\`
3. Token is verified using public keys from JWKS endpoint
4. Token must be valid (not expired, correct issuer/audience)

**Token Format:**
- Algorithm: ES256 (ECDSA P-256, asymmetric)
- Key ID: kid=YYYY-MM (monthly rotation)
- Claims: iss, aud, exp, nbf, sub, role, permissions

**Security:**
- Tokens expire after 20 minutes (access) or 60 days (refresh)
- Keys rotate monthly
- Tokens are verified against JWKS endpoint
          `,
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data (structure varies by endpoint)',
            },
          },
          required: ['success', 'data'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            data: {
              type: 'object',
              properties: {
                error_code: {
                  type: 'integer',
                  description: 'HTTP status code or custom error code',
                  example: 400,
                },
                error_msg: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'Invalid request',
                },
                field: {
                  type: 'string',
                  description: 'Field name (for validation errors)',
                  example: 'username',
                },
              },
              required: ['error_code', 'error_msg'],
            },
          },
          required: ['success', 'data'],
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username or email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'SecurePassword123!',
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: {
              type: 'string',
              description: 'Refresh token obtained from login',
              example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                access_token: {
                  type: 'string',
                  description: 'JWT access token (expires in 20 minutes)',
                  example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refresh_token: {
                  type: 'string',
                  description: 'JWT refresh token (expires in 60 days)',
                  example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  type: 'object',
                  description: 'User information',
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                data: {
                  error_code: 401,
                  error_msg: 'Unauthorized - valid JWT token required',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                data: {
                  error_code: 422,
                  error_msg: 'Validation failed',
                  field: 'username',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                data: {
                  error_code: 429,
                  error_msg: 'Too many requests, please try again later',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.js'), // Scan route files for Swagger annotations
    path.join(__dirname, '../app.js'), // Include app.js for root-level endpoints
  ],
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

