/**
 * Example RPD Verification Middleware
 * 
 * This middleware should be used in each RPD deployment to verify tokens issued by AuthRPD.
 * 
 * Security Explanation:
 * - Each RPD deployment has a configured audience (RPD_AUDIENCE env var)
 * - Tokens are issued with aud claim matching the RPD instance's audience
 * - This middleware validates:
 *   1. Token signature (RS256 with public key from JWKS)
 *   2. Token expiration
 *   3. Token issuer (must match AuthRPD issuer)
 *   4. Token audience (must match this RPD's configured audience)
 * - If aud doesn't match, the token is rejected, preventing cross-region token misuse
 * 
 * Usage in RPD app:
 * ```javascript
 * const { verifyRpdToken } = require('./middlewares/rpd-verification.middleware');
 * 
 * app.get('/api/protected', verifyRpdToken, (req, res) => {
 *   // req.user contains decoded token payload
 *   res.json({ message: 'Access granted', user: req.user });
 * });
 * ```
 */

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const ApiError = require('../helpers/api.error');

// JWKS client configuration
// Point this to AuthRPD's JWKS endpoint: https://authrpd.example.com/.well-known/jwks.json
const jwksUri = process.env.AUTHRPD_JWKS_URI || 'http://localhost:3000/.well-known/jwks.json';
const issuer = process.env.AUTHRPD_ISSUER || 'AUTHRPD';
const expectedAudience = process.env.RPD_AUDIENCE; // e.g., "rpd:ahal", "rpd:balkan"

if (!expectedAudience) {
  throw new Error('RPD_AUDIENCE environment variable is required');
}

// Create JWKS client
const client = jwksClient({
  jwksUri: jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Gets the signing key from JWKS
 * @param {Object} header - JWT header
 * @returns {Promise<string>} - Public key
 */
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Express middleware to verify RPD access tokens
 * 
 * Validates:
 * - Signature using JWKS
 * - Issuer matches AuthRPD
 * - Audience matches this RPD's configured audience
 * - Token is not expired
 * 
 * On success, attaches decoded payload to req.user
 */
function verifyRpdToken(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: {
        error_code: 401,
        error_msg: 'Missing or invalid Authorization header',
      },
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: issuer,
      audience: expectedAudience, // CRITICAL: Must match this RPD's audience
    },
    (err, decoded) => {
      if (err) {
        // Log error details for debugging
        if (err.name === 'JsonWebTokenError') {
          console.error('JWT verification error:', err.message);
          return res.status(401).json({
            success: false,
            data: {
              error_code: 401,
              error_msg: 'Invalid token',
            },
          });
        }
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            data: {
              error_code: 401,
              error_msg: 'Token expired',
            },
          });
        }
        if (err.name === 'JsonWebTokenIssuerError') {
          return res.status(401).json({
            success: false,
            data: {
              error_code: 401,
              error_msg: 'Invalid token issuer',
            },
          });
        }
        if (err.name === 'JsonWebTokenAudienceError') {
          // This is the key security check - token from wrong RPD instance
          console.warn('Token audience mismatch:', {
            expected: expectedAudience,
            received: decoded?.aud,
            token_issuer: decoded?.iss,
          });
          return res.status(403).json({
            success: false,
            data: {
              error_code: 403,
              error_msg: 'Token not valid for this RPD instance',
            },
          });
        }
        return res.status(401).json({
          success: false,
          data: {
            error_code: 401,
            error_msg: 'Token verification failed',
          },
        });
      }

      // Attach decoded payload to request
      req.user = {
        id: decoded.sub.split(':')[1], // Extract user ID from "MEMBER:123" or "CLIENT:456"
        userType: decoded.sub.split(':')[0], // "MEMBER" or "CLIENT"
        role_id: decoded.role_id,
        region_id: decoded.region_id, // Top region ID
        sub_region_id: decoded.sub_region_id || null, // Sub-region ID if applicable
        aud: decoded.aud, // Audience (should match expectedAudience)
        iss: decoded.iss, // Issuer
        exp: decoded.exp,
        iat: decoded.iat,
        jti: decoded.jti,
      };

      next();
    }
  );
}

/**
 * Alternative synchronous version using cached public key
 * More efficient for high-traffic scenarios
 */
function verifyRpdTokenSync(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: {
        error_code: 401,
        error_msg: 'Missing or invalid Authorization header',
      },
    });
  }

  const token = authHeader.substring(7);

  try {
    // Decode to get header first
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      return res.status(401).json({
        success: false,
        data: {
          error_code: 401,
          error_msg: 'Invalid token format',
        },
      });
    }

    // Get signing key synchronously (requires caching mechanism)
    // In production, you'd want to cache keys in memory
    const getKeySync = (header) => {
      // This is a simplified version - in production, use a proper cache
      return new Promise((resolve, reject) => {
        client.getSigningKey(header.kid, (err, key) => {
          if (err) return reject(err);
          const signingKey = key.publicKey || key.rsaPublicKey;
          resolve(signingKey);
        });
      });
    };

    // This requires async handling, so the callback version above is preferred
    // For truly synchronous version, implement key caching
    throw new Error('Synchronous version requires key caching - use verifyRpdToken instead');
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: {
        error_code: 401,
        error_msg: 'Token verification failed',
      },
    });
  }
}

module.exports = {
  verifyRpdToken,
  verifyRpdTokenSync,
};

/**
 * Example Token Payloads:
 * 
 * 1. Top Region User (region_id: 'AHAL')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:123",
 *   "aud": "rpd:ahal",
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440000",
 *   "role_id": 5,
 *   "region_id": "AHAL"
 * }
 * 
 * 2. Sub-Region User (region_id: 'ASGABAT_CITY', parent: 'AHAL')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:456",
 *   "aud": "rpd:ahal",  // Uses parent region's audience
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440001",
 *   "role_id": 5,
 *   "region_id": "AHAL",           // Top region ID
 *   "sub_region_id": "ASGABAT_CITY" // Original user region
 * }
 * 
 * Security Note:
 * - A token with aud="rpd:ahal" will be REJECTED by a RPD instance expecting aud="rpd:balkan"
 * - This prevents users from one region accessing another region's RPD system
 * - The middleware's audience check is the critical security boundary
 */

