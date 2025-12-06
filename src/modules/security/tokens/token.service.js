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

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
};

