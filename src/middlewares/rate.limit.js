const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Rate Limiting Configuration for AuthRPD API
 * 
 * Rate limiting protects the API from:
 * - Brute-force attacks (login attempts)
 * - DDoS attacks (too many requests)
 * - Resource exhaustion (API abuse)
 * 
 * This module provides:
 * 1. Global rate limiter: Applies to all routes
 * 2. Auth rate limiter: Stricter limits for authentication endpoints
 * 3. Login limiter: Very strict limits for login attempts
 * 4. Refresh limiter: Moderate limits for token refresh
 * 
 * All limiters use Redis for distributed rate limiting across multiple server instances.
 * 
 * Security Logging:
 * - Login failures are logged for security monitoring
 * - Suspicious bursts are detected and logged
 */

// Redis store configuration for distributed rate limiting
// This ensures rate limits work across multiple server instances
const createRedisStore = (prefix = 'rl:') => {
  try {
    return new RedisStore({
      client: redis,
      prefix, // Redis key prefix for rate limit data
      // Send a ping to test the connection
      sendCommand: (...args) => redis.call(...args),
    });
  } catch (error) {
    logger.warn('Redis store for rate limiting unavailable, using in-memory store', {
      error: error.message,
    });
    return undefined; // Fallback to in-memory store
  }
};

/**
 * Global Rate Limiter
 * 
 * Applies to all routes to prevent general API abuse.
 * Configurable via environment variables:
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 15 minutes)
 * - RATE_LIMIT_MAX: Maximum requests per window (default: 100)
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  store: createRedisStore('rl:global:'),
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    data: {
      error_code: 429,
      error_msg: 'Too many requests, please try again later',
    },
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      request_id: req.request_id || req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      data: {
        error_code: 429,
        error_msg: 'Too many requests, please try again later',
      },
    });
  },
  // Skip rate limiting for health checks and JWKS endpoint
  skip: (req) => {
    return req.path === '/health' || req.path === '/.well-known/jwks.json';
  },
});

/**
 * Authentication Rate Limiter
 * 
 * Stricter rate limiting for all /auth/* endpoints.
 * This protects authentication endpoints from brute-force attacks.
 * 
 * Configurable via:
 * - AUTH_RATE_LIMIT_MAX: Maximum requests per window (default: 20)
 * - Uses same window as global limiter
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10), // 20 requests per window
  store: createRedisStore('rl:auth:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: {
      error_code: 429,
      error_msg: 'Too many authentication attempts, please try again later',
    },
  },
  handler: (req, res) => {
    // Log suspicious authentication bursts
    logger.warn('Authentication rate limit exceeded - possible brute force attack', {
      request_id: req.request_id || req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      user_agent: req.headers['user-agent'],
    });
    res.status(429).json({
      success: false,
      data: {
        error_code: 429,
        error_msg: 'Too many authentication attempts, please try again later',
      },
    });
  },
  // Key generator: use IP + path for more granular limiting
  keyGenerator: (req) => {
    return `${req.ip}:${req.path}`;
  },
});

/**
 * Login Rate Limiter
 * 
 * Very strict rate limiting specifically for login attempts.
 * This is the first line of defense against brute-force password attacks.
 * 
 * Limits: 5 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 login attempts per window
  store: createRedisStore('rl:login:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: {
      error_code: 429,
      error_msg: 'Too many login attempts, please try again later',
    },
  },
  handler: (req, res) => {
    // Log login failure attempts for security monitoring
    logger.warn('Login rate limit exceeded - possible brute force attack', {
      request_id: req.request_id || req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      user_agent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      data: {
        error_code: 429,
        error_msg: 'Too many login attempts, please try again later',
      },
    });
  },
  // Key generator: use IP address for login attempts
  keyGenerator: (req) => {
    return `login:${req.ip}`;
  },
});

/**
 * Refresh Token Rate Limiter
 * 
 * Moderate rate limiting for token refresh endpoints.
 * Prevents abuse of refresh token mechanism.
 * 
 * Limits: 10 refresh attempts per 15 minutes per IP
 */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 refresh attempts per window
  store: createRedisStore('rl:refresh:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: {
      error_code: 429,
      error_msg: 'Too many refresh attempts, please try again later',
    },
  },
  handler: (req, res) => {
    logger.warn('Refresh token rate limit exceeded', {
      request_id: req.request_id || req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      data: {
        error_code: 429,
        error_msg: 'Too many refresh attempts, please try again later',
      },
    });
  },
  // Key generator: use IP address for refresh attempts
  keyGenerator: (req) => {
    return `refresh:${req.ip}`;
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  refreshLimiter,
};
