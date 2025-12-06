const { verifyAccessToken } = require('../modules/security/tokens/token.service');
const ApiError = require('../helpers/api.error');
const logger = require('../config/logger');

function authGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Извлекаем user_type и user_id из sub
    const [userType, userId] = payload.sub.split(':');

    req.user = {
      id: parseInt(userId, 10),
      type: userType,
      ...payload,
    };

    next();
  } catch (error) {
    logger.warn('Auth guard error:', error.message);
    if (error instanceof ApiError) {
      return next(error);
    }
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/**
 * Middleware для проверки роли
 * @param {Array<string>} allowedRoles - массив разрешенных ролей
 */
function roleGuard(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Здесь можно добавить проверку роли из БД
      // Пока просто проверяем наличие user
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  authGuard,
  roleGuard,
};

