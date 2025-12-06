const cors = require('cors');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * CORS Configuration for AuthRPD API
 * 
 * Cross-Origin Resource Sharing (CORS) allows controlled access to resources
 * from different origins. This configuration supports:
 * 
 * 1. Public Clients: Budget organization users accessing from various domains
 * 2. Internal Admin UI: Administrative interface for managing AuthRPD
 * 3. Allowlist-based Origins: Only explicitly allowed origins can access the API
 * 
 * Security Considerations:
 * - Credentials are only allowed for trusted origins
 * - Wildcard origins are NOT used (security risk)
 * - All origins must be explicitly listed in CORS_ORIGINS
 * - Preflight requests are handled automatically
 * 
 * @returns {Function} CORS middleware configured for AuthRPD
 */
function configureCors() {
  // Parse allowed origins from environment variable
  // Format: "https://example.com,https://admin.example.com,http://localhost:3000"
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  // In development, allow localhost by default if no origins specified
  if (config.env === 'development' && allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
    logger.warn('CORS: Using default localhost origins for development. Set CORS_ORIGINS in production!');
  }

  // Determine if credentials should be allowed
  // Credentials (cookies, authorization headers) should only be allowed for trusted origins
  const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';

  // Allowed HTTP methods for CORS requests
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

  // Allowed HTTP headers in CORS requests
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-Correlation-ID',
    'Accept',
    'Origin',
  ];

  // Exposed headers that clients can access
  const exposedHeaders = ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];

  /**
   * Origin validation function
   * Checks if the request origin is in the allowlist
   * 
   * @param {string} origin - The origin of the request
   * @param {Function} callback - Callback function (error, allow)
   */
  function originCallback(origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, Postman, curl)
    // This is safe because we still validate authentication via JWT
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in the allowlist
    if (allowedOrigins.includes(origin)) {
      logger.debug(`CORS: Allowed origin: ${origin}`);
      return callback(null, true);
    }

    // Log blocked origin attempts (security monitoring)
    logger.warn(`CORS: Blocked origin: ${origin}`, {
      allowed_origins: allowedOrigins,
      request_origin: origin,
    });

    // Reject origin not in allowlist
    return callback(new Error(`CORS: Origin ${origin} is not allowed`), false);
  }

  // Configure CORS middleware
  const corsOptions = {
    origin: originCallback,
    methods: allowedMethods,
    allowedHeaders: allowedHeaders,
    exposedHeaders: exposedHeaders,
    credentials: allowCredentials,
    maxAge: 86400, // 24 hours - how long browsers can cache preflight responses
    optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
  };

  return cors(corsOptions);
}

module.exports = configureCors;

