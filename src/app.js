const express = require('express');
const config = require('./config/env');
const logger = require('./config/logger');

// Security middleware
const configureHelmet = require('./security/helmet.config');
const configureCors = require('./security/cors.config');
const { globalLimiter, authLimiter } = require('./middlewares/rate.limit');

// Request tracking and logging
const requestIdMiddleware = require('./middlewares/request.id');
const requestLoggerMiddleware = require('./middlewares/request.logger');

// Error handling
const errorHandler = require('./middlewares/error.handler');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const rbacRoutes = require('./modules/rbac/rbac.routes');
const catalogRoutes = require('./modules/catalogs/catalog.routes');
const syncRoutes = require('./modules/sync/sync.routes');

// Swagger documentation (must be imported before routes)
const initializeSwagger = require('./docs/swagger.init');

const app = express();

/**
 * ============================================================================
 * MIDDLEWARE ORDER FOR AUTHRPD
 * ============================================================================
 * 
 * The order of middleware is critical for security and functionality.
 * This order follows security best practices for a government-grade API:
 * 
 * 1. Trust Proxy (if behind reverse proxy)
 *    - Must be first to correctly identify client IPs
 * 
 * 2. Request ID Middleware
 *    - Generates correlation IDs for request tracking
 *    - Must be early to include in all logs
 * 
 * 3. Security Headers (Helmet)
 *    - Sets security headers (HSTS, X-Frame-Options, etc.)
 *    - Should be early to protect all responses
 * 
 * 4. CORS
 *    - Handles cross-origin requests
 *    - Must be before routes that need CORS
 * 
 * 5. Body Parsers (with size limits)
 *    - Parses JSON and URL-encoded bodies
 *    - Size limits prevent DoS via large payloads
 *    - Must be before routes that read req.body
 * 
 * 6. Global Rate Limiter
 *    - Protects all routes from abuse
 *    - Should be after body parsing but before routes
 * 
 * 7. Request Logger
 *    - Logs all HTTP requests
 *    - Should be after request ID is set
 * 
 * 8. Routes
 *    - Application routes with specific rate limiters
 * 
 * 9. 404 Handler
 *    - Handles unknown routes
 * 
 * 10. Error Handler
 *     - Must be last to catch all errors
 * 
 * ============================================================================
 */

// 1. Trust Proxy Configuration
// Required when behind reverse proxy (nginx, load balancer) to get correct client IPs
if (config.security.trustProxy) {
  app.set('trust proxy', 1); // Trust first proxy
  logger.info('Trust proxy enabled - client IPs will be read from X-Forwarded-For header');
}

// 2. Request ID Middleware (must be first for correlation tracking)
app.use(requestIdMiddleware);

// 3. Security Headers (Helmet)
// Sets security headers: HSTS, X-Content-Type-Options, X-Frame-Options, etc.
app.use(configureHelmet());

// 4. CORS Configuration
// Handles cross-origin requests with allowlist-based origins
app.use(configureCors());

// 5. Body Parsers with Size Limits
// Prevents DoS attacks via large request bodies
app.use(express.json({ 
  limit: config.security.bodyParser.jsonLimit,
  // Strict JSON parsing - reject malformed JSON
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: config.security.bodyParser.urlencodedLimit,
  // Limit parameter nesting depth
  parameterLimit: 100,
}));

// 6. Global Rate Limiter
// Protects all routes from abuse (applies to all routes below)
app.use(globalLimiter);

// 7. Request Logger Middleware
// Logs all HTTP requests with correlation ID
app.use(requestLoggerMiddleware);

// 8. Swagger Documentation (before routes, after security middleware)
// Swagger UI and OpenAPI JSON endpoints
// Disabled in production by default (set SWAGGER_ENABLED=true to enable)
initializeSwagger(app);

// Health check endpoint (bypasses some middleware for fast response)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: config.logging.serviceName,
  });
});

/**
 * @swagger
 * /.well-known/jwks.json:
 *   get:
 *     tags: [Security]
 *     summary: JSON Web Key Set (JWKS)
 *     description: |
 *       Public endpoint that provides JSON Web Key Set for JWT token verification.
 *       
 *       **How it works:**
 *       - Returns public keys used to verify JWT tokens signed with RS256
 *       - Keys are rotated monthly with format kid=YYYY-MM
 *       - Clients use these keys to verify token signatures
 *       - No authentication required (public endpoint)
 *     security: []
 *     responses:
 *       200:
 *         description: JWKS successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kty:
 *                         type: string
 *                         example: RSA
 *                       kid:
 *                         type: string
 *                         example: 2024-01
 *                       use:
 *                         type: string
 *                         example: sig
 *                       n:
 *                         type: string
 *                         description: RSA modulus
 *                       e:
 *                         type: string
 *                         description: RSA exponent
 *             example:
 *               keys:
 *                 - kty: RSA
 *                   kid: 2024-01
 *                   use: sig
 *                   n: "0vx7agoebGcQSuuPiLJXZptN9nndrQmb..."
 *                   e: AQAB
 */
// JWKS endpoint (public, no authentication required)
app.get('/.well-known/jwks.json', async (req, res, next) => {
  try {
    const { getJwks } = require('./modules/security/keys/jwks.service');
    const jwks = await getJwks();
    res.json(jwks);
  } catch (error) {
    next(error);
  }
});

// 9. API Routes with Authentication Rate Limiting
// Auth routes have stricter rate limiting to prevent brute-force attacks
app.use('/auth', authLimiter, authRoutes);
app.use('/admin', rbacRoutes);
app.use('/rbac', rbacRoutes); // RBAC routes also available at /rbac
app.use('/catalogs', catalogRoutes);
app.use('/catalog-sync', syncRoutes); // Sync routes also use /catalogs prefix

// 10. 404 Handler
// Returns standardized error response for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: {
      error_code: 404,
      error_msg: 'Route not found',
    },
  });
});

// 11. Error Handler (must be last)
// Centralized error handling with security-aware logging
app.use(errorHandler);

module.exports = app;
