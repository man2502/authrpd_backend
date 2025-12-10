const { createPublicKey } = require('crypto');
const { cacheData } = require('../../../helpers/cache.helper');
const { getAvailableKids, loadKeyPair, getKid } = require('./key.manager');
const config = require('../../../config/env');
const logger = require('../../../config/logger');

/**
 * Конвертирует PEM в JWK формат для ECDSA (ES256)
 * @param {string} publicKeyPem - публичный ключ в формате PEM
 * @param {string} kid - идентификатор ключа
 * @returns {Object} - JWK объект
 */
function pemToJwk(publicKeyPem, kid) {
  try {
    const publicKey = createPublicKey(publicKeyPem);
    const jwk = publicKey.export({ format: 'jwk' });

    // ECDSA (EC) keys use crv, x, y instead of n, e (RSA)
    return {
      kty: jwk.kty, // 'EC'
      use: 'sig',
      kid: kid,
      crv: jwk.crv, // 'P-256' for ES256
      x: jwk.x,     // Base64url encoded x coordinate
      y: jwk.y,     // Base64url encoded y coordinate
      alg: 'ES256',
    };
  } catch (error) {
    logger.error(`Error converting PEM to JWK for kid ${kid}:`, error);
    throw error;
  }
}

/**
 * Генерирует JWKS (JSON Web Key Set)
 * @returns {Promise<Object>} - JWKS объект
 */
async function generateJwks() {
  try {
    const baseDir = config.security.ecKeysDir || config.security.rsaKeysDir;
    const kids = getAvailableKids(baseDir);

    // Берем текущий месяц и предыдущие 2 месяца для плавной ротации
    const currentKid = getKid();
    const currentDate = new Date();
    const monthsToInclude = [currentKid];

    for (let i = 1; i <= 2; i++) {
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const prevKid = getKid(prevDate);
      if (kids.includes(prevKid)) {
        monthsToInclude.push(prevKid);
      }
    }

    const keys = [];

    for (const kid of monthsToInclude) {
      if (kids.includes(kid)) {
        try {
          const { publicKey } = loadKeyPair(baseDir, kid);
          const jwk = pemToJwk(publicKey, kid);
          keys.push(jwk);
        } catch (error) {
          logger.warn(`Failed to load key for kid ${kid}:`, error.message);
        }
      }
    }

    return { keys };
  } catch (error) {
    logger.error('Error generating JWKS:', error);
    throw error;
  }
}

/**
 * Получает JWKS с кэшированием
 * @returns {Promise<Object>} - JWKS объект
 */
async function getJwks() {
  return await cacheData('jwks:json', generateJwks, 3600); // Кэш на 1 час
}

module.exports = {
  generateJwks,
  getJwks,
  pemToJwk,
};

