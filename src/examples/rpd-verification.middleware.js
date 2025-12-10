/**
 * Example RPD Verification Middleware
 * 
 * This middleware should be used in each RPD deployment to verify tokens issued by AuthRPD.
 * 
 * Security Explanation:
 * - Each RPD deployment has a configured audience (RPD_AUDIENCE env var)
 * - Tokens are issued with aud claim matching the RPD instance's audience
 * - This middleware validates:
 *   1. Token signature (ES256 with public key from JWKS)
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
 * - Audience matches this RPD's configured audience (supports multi-audience tokens)
 * - Token is not expired
 * 
 * Supports both single audience (string) and multi-audience (array) tokens for backward compatibility.
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

  // Verify token (without audience check first, we'll do custom audience validation)
  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['ES256'],
      issuer: issuer,
      // Don't validate audience here - we'll do custom validation to support arrays
      audience: false,
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
        return res.status(401).json({
          success: false,
          data: {
            error_code: 401,
            error_msg: 'Token verification failed',
          },
        });
      }

      // Custom audience validation (supports both string and array)
      const tokenAudience = decoded.aud;
      let audienceValid = false;

      if (Array.isArray(tokenAudience)) {
        // Multi-audience token: check if expected audience is in the array
        audienceValid = tokenAudience.includes(expectedAudience);
      } else if (typeof tokenAudience === 'string') {
        // Single audience token (backward compatibility)
        audienceValid = tokenAudience === expectedAudience;
      }

      if (!audienceValid) {
        // This is the key security check - token from wrong RPD instance
        console.warn('Token audience mismatch:', {
          expected: expectedAudience,
          received: tokenAudience,
          received_type: Array.isArray(tokenAudience) ? 'array' : 'string',
          token_issuer: decoded.iss,
        });
        return res.status(403).json({
          success: false,
          data: {
            error_code: 403,
            error_msg: 'Token not valid for this RPD instance',
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
        aud: decoded.aud, // Audience (string or array)
        audiences: Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud], // Always array for convenience
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
 * 1. Top Region User - Single Instance (region_id: '11')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:123",
 *   "aud": ["rpd:ahal"],  // Array format (even for single instance)
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440000",
 *   "role_id": 5,
 *   "region_id": "11"
 * }
 * 
 * 2. Top Region User - Multiple Instances (region_id: '11' with 2 RPD instances)
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:123",
 *   "aud": ["rpd:ahal:primary", "rpd:ahal:secondary"],  // Multi-audience
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440000",
 *   "role_id": 5,
 *   "region_id": "11"
 * }
 * 
 * 3. Sub-Region User (region_id: 'ASGABAT_CITY', parent: '11')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:456",
 *   "aud": ["rpd:ahal:primary", "rpd:ahal:secondary"],  // Uses parent region's audiences
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440001",
 *   "role_id": 5,
 *   "region_id": "11",           // Top region ID
 *   "sub_region_id": "ASGABAT_CITY" // Original user region
 * }
 * 
 * Security Note:
 * - A token with aud=["rpd:ahal:primary"] will be REJECTED by a RPD instance expecting "rpd:balkan"
 * - The middleware checks if the expected audience is in the token's audience array
 * - This prevents users from one region accessing another region's RPD system
 * - The middleware's audience check is the critical security boundary
 * - Backward compatibility: Tokens with string audience (old format) are also supported
 */

