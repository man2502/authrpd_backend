const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { loadKeyPair, getKid } = require('../keys/key.manager');
const config = require('../../../config/env');
const logger = require('../../../config/logger');

/**
 * Генерирует access token
 * @param {string} userType - тип пользователя ('MEMBER' или 'CLIENT')
 * @param {number} userId - ID пользователя
 * @param {Object} additionalClaims - дополнительные claims
 * @returns {string} - JWT токен
 */
function generateAccessToken(userType, userId, additionalClaims = {}) {
  try {
    const kid = getKid();
    const { privateKey } = loadKeyPair(config.security.ecKeysDir || config.security.rsaKeysDir, kid);

    const payload = {
      iss: config.security.issuer,
      sub: `${userType}:${userId}`,
      aud: config.security.audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + config.security.accessTtlSeconds,
      jti: uuidv4(),
      ...additionalClaims,
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        typ: 'JWT',
        kid: kid,
      },
    });

    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
}

/**
 * Верифицирует access token
 * @param {string} token - JWT токен
 * @returns {Object} - декодированный payload
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    const kid = decoded.header.kid;
    const { publicKey } = loadKeyPair(config.security.ecKeysDir || config.security.rsaKeysDir, kid);

    const payload = jwt.verify(token, publicKey, {
      algorithms: ['ES256'],
      issuer: config.security.issuer,
      audience: config.security.audience,
    });

    return payload;
  } catch (error) {
    logger.error('Error verifying access token:', error);
    throw error;
  }
}

/**
 * Генерирует refresh token (случайная строка)
 * @returns {string} - refresh token
 */
function generateRefreshToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Issues an access token for RPD systems.
 * Resolves the user's region to top parent region and uses that region's RPD audiences.
 * Supports multi-audience tokens when multiple RPD instances exist for a region.
 * 
 * @param {Object} user - User object with id, role_id, region_id
 * @param {string} userType - User type ('MEMBER' or 'CLIENT')
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache for region/RPD lookup (default: true)
 * @returns {Promise<string>} - JWT access token with RPD audience(s) as array
 * @throws {Error} - If region resolution fails or RPD instance not found
 * 
 * @example
 * // Top region user with single RPD instance
 * const token = await issueAccessToken({
 *   id: 1,
 *   role_id: 5,
 *   region_id: '11'
 * }, 'MEMBER');
 * // Token will have aud: ['rpd:ahal']
 * 
 * // Top region user with multiple RPD instances
 * const token = await issueAccessToken({
 *   id: 1,
 *   role_id: 5,
 *   region_id: '11' // Has 2 RPD instances
 * }, 'MEMBER');
 * // Token will have aud: ['rpd:ahal:primary', 'rpd:ahal:secondary']
 * 
 * // Sub-region user (automatically resolves to parent's RPD instances)
 * const token = await issueAccessToken({
 *   id: 2,
 *   role_id: 5,
 *   region_id: 'ASGABAT_CITY' // This will resolve to parent region's RPD instances
 * }, 'MEMBER');
 */
async function issueAccessToken(user, userType = 'MEMBER', options = {}) {
  const { useCache = true } = options;

  try {
    if (!user || !user.id || !user.region_id) {
      throw new Error('User object must have id and region_id');
    }

    // Get all RPD instances for user's region (resolves to top region automatically)
    // Returns: { top_region_id, original_region_id, instances: [...], audiences: [...] }
    const { getRpdInstanceByRegion } = require('../../rpd/services/rpd-instance.service');
    const rpdData = await getRpdInstanceByRegion(user.region_id, useCache);

    // Validate rpdData structure (handle potential cache issues with old format)
    if (!rpdData) {
      throw new Error('RPD instance data is undefined');
    }

    // Handle both new format (with instances array) and old format (backward compatibility)
    let audiences;
    let topRegionId;
    let originalRegionId;

    if (rpdData.audiences && Array.isArray(rpdData.audiences)) {
      // New format: { top_region_id, original_region_id, instances: [...], audiences: [...] }
      audiences = rpdData.audiences;
      topRegionId = rpdData.top_region_id;
      originalRegionId = rpdData.original_region_id;
    } else if (rpdData.audience) {
      // Old format (from cache): { audience, top_region_id, ... } - convert to array
      logger.warn('Detected old RPD instance format in cache, converting to array format');
      audiences = [rpdData.audience];
      topRegionId = rpdData.top_region_id || rpdData.region_id;
      originalRegionId = rpdData.original_region_id;
    } else {
      throw new Error(`Invalid RPD instance data format: ${JSON.stringify(rpdData)}`);
    }

    // Validate audiences array
    if (!audiences || audiences.length === 0) {
      throw new Error('No audiences found in RPD instance data');
    }

    if (!topRegionId) {
      throw new Error('Top region ID not found in RPD instance data');
    }

    // Prepare JWT payload
    const now = Math.floor(Date.now() / 1000);
    const kid = getKid();
    const { privateKey } = loadKeyPair(config.security.ecKeysDir || config.security.rsaKeysDir, kid);

    // Build claims
    // Always use array format for audience (JWT spec supports both string and array)
    // Canonical JWT structure according to TZ v2.2 specification
    const payload = {
      iss: config.security.issuer,
      sub: `${userType}:${user.id}`,
      aud: audiences, // Array of all RPD instance audiences (always array format)
      iat: now,
      exp: now + config.security.accessTtlSeconds,
      jti: uuidv4(),
      data: {
        id: user.id,
        user_type: userType, // "MEMBER" or "CLIENT"
        role: user.role || null, // role.name for members, null for clients
        region_id: topRegionId, // Top region ID (resolved through hierarchy, STRING code)
        organization_id: user.organization_id || null, // organizations.code (STRING)
        fullname: user.fullname || null,
        // permissions: user.permissions, // Optional - can be omitted to reduce token size
      },
    };

    // Include sub_region_id if user is in a sub-region
    if (originalRegionId && originalRegionId !== topRegionId) {
      payload.sub_region_id = originalRegionId;
    }

    // Sign token
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        typ: 'JWT',
        kid: kid,
      },
    });

    logger.debug('RPD access token issued', {
      user_id: user.id,
      user_type: userType,
      region_id: user.region_id,
      top_region_id: topRegionId,
      audiences: audiences, // Array of audiences
      instance_count: rpdData.instances ? rpdData.instances.length : audiences.length,
    });

    return token;
  } catch (error) {
    logger.error('Error issuing RPD access token:', error);
    throw error;
  }
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  issueAccessToken,
};

