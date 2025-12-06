const { ensureMonthlyKeyPair } = require('../modules/security/keys/key.manager');
const config = require('../config/env');
const logger = require('../config/logger');
const path = require('path');

/**
 * Job для проверки и генерации ключей (вызывать раз в сутки)
 */
async function checkAndRotateKeys() {
  try {
    const keysDir = path.resolve(config.security.rsaKeysDir);
    const keyInfo = ensureMonthlyKeyPair(keysDir);
    
    if (keyInfo.skipped) {
      logger.debug(`Key rotation check: keys for ${keyInfo.kid} already exist`);
    } else {
      logger.info(`Key rotation: generated new key pair for ${keyInfo.kid}`);
    }
  } catch (error) {
    logger.error('Key rotation job error:', error);
  }
}

module.exports = {
  checkAndRotateKeys,
};

