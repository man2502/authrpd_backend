const redis = require('../config/redis');
const logger = require('../config/logger');

/**
 * Кэширует результат функции в Redis
 * @param {string} key - ключ кэша
 * @param {Function} fn - функция для выполнения, если кэш пуст
 * @param {number} ttl - время жизни кэша в секундах
 * @returns {Promise<any>} - результат функции или из кэша
 */
async function cacheData(key, fn, ttl = 3600) {
  try {
    // Пытаемся получить из кэша
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }

    // Выполняем функцию
    const result = await fn();

    // Сохраняем в кэш
    if (result !== null && result !== undefined) {
      await redis.setex(key, ttl, JSON.stringify(result));
    }

    return result;
  } catch (error) {
    // При ошибке Redis выполняем функцию напрямую
    logger.warn(`Cache error for key ${key}:`, error.message);
    return await fn();
  }
}

/**
 * Инвалидирует кэш по ключу
 * @param {string} key - ключ кэша
 */
async function invalidateCache(key) {
  try {
    await redis.del(key);
  } catch (error) {
    logger.warn(`Cache invalidation error for key ${key}:`, error.message);
  }
}

/**
 * Инвалидирует кэш по паттерну
 * @param {string} pattern - паттерн ключей (например, 'role:*')
 */
async function invalidateCachePattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.warn(`Cache pattern invalidation error for pattern ${pattern}:`, error.message);
  }
}

module.exports = {
  cacheData,
  invalidateCache,
  invalidateCachePattern,
};

