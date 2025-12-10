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
    const { privateKey } = loadKeyPair(config.security.rsaKeysDir, kid);

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
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
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
    const { publicKey } = loadKeyPair(config.security.rsaKeysDir, kid);

    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
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
 * Resolves the user's region to top parent region and uses that region's RPD audience.
 * 
 * @param {Object} user - User object with id, role_id, region_id
 * @param {string} userType - User type ('MEMBER' or 'CLIENT')
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache for region/RPD lookup (default: true)
 * @returns {Promise<string>} - JWT access token with RPD audience
 * @throws {Error} - If region resolution fails or RPD instance not found
 * 
 * @example
 * // Top region user
 * const token = await issueAccessToken({
 *   id: 1,
 *   role_id: 5,
 *   region_id: 'AHAL'
 * }, 'MEMBER');
 * 
 * // Sub-region user (automatically resolves to parent's RPD)
 * const token = await issueAccessToken({
 *   id: 2,
 *   role_id: 5,
 *   region_id: 'ASGABAT_CITY' // This will resolve to AHAL's RPD instance
 * }, 'MEMBER');
 */
async function issueAccessToken(user, userType = 'MEMBER', options = {}) {
  const { useCache = true } = options;

  try {
    if (!user || !user.id || !user.region_id) {
      throw new Error('User object must have id and region_id');
    }

    // Get RPD instance for user's region (resolves to top region automatically)
    const { getRpdInstanceByRegion } = require('../../rpd/services/rpd-instance.service');
    const rpdInstance = await getRpdInstanceByRegion(user.region_id, useCache);

    // Prepare JWT payload
    const now = Math.floor(Date.now() / 1000);
    const kid = getKid();
    const { privateKey } = loadKeyPair(config.security.rsaKeysDir, kid);

    // Build claims
    const payload = {
      iss: config.security.issuer,
      sub: `${userType}:${user.id}`,
      aud: rpdInstance.audience, // RPD instance audience (e.g., "rpd:ahal")
      iat: now,
      exp: now + config.security.accessTtlSeconds,
      jti: uuidv4(),
      role_id: user.role_id || null,
      region_id: rpdInstance.top_region_id, // Top region ID (parent for sub-regions)
    };

    // Include sub_region_id if user is in a sub-region
    if (rpdInstance.original_region_id && rpdInstance.original_region_id !== rpdInstance.top_region_id) {
      payload.sub_region_id = rpdInstance.original_region_id;
    }

    // Sign token
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        typ: 'JWT',
        kid: kid,
      },
    });

    logger.debug('RPD access token issued', {
      user_id: user.id,
      user_type: userType,
      region_id: user.region_id,
      top_region_id: rpdInstance.top_region_id,
      audience: rpdInstance.audience,
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

