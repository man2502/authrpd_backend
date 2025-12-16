const authService = require('./auth.service');
const { successResponse } = require('../../helpers/response.helper');
const { authGuard } = require('../../middlewares/auth.guard');
const logger = require('../../config/logger');
const localize = require('../../helpers/localize.helper');
/**
 * Контроллер для аутентификации member
 * Логирует успешные и неуспешные попытки входа
 */
async function loginMember(req, res, next) {
  try {
    const { username, password } = req.body;
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'],
    };

    // Логируем попытку входа (без пароля!)
    logger.info('Member login attempt', {
      request_id: req.request_id || req.id,
      username,
      ip: metadata.ip,
    });

    const result = await authService.loginMember(username, password, metadata);
    
    // Логируем успешный вход
    logger.info('Member login successful', {
      request_id: req.request_id || req.id,
      username,
      user_id: result.user?.id,
      role: result.user?.role,
    });

    res.json(successResponse(result));
  } catch (error) {
    // Ошибка будет залогирована в error handler
    next(error);
  }
}

async function loginClient(req, res, next) {
  try {
    const { username, password } = req.body;
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'],
    };

    const result = await authService.loginClient(username, password, metadata);
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'],
    };

    const result = await authService.refreshTokens(refresh_token, metadata);
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;
    await authService.logout(refresh_token, req.user.type, req.user.id);
    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.type, req.user.id);
    res.json(successResponse(localize(user, req.query.lang || 'tm')));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginMember,
  loginClient,
  refresh,
  logout,
  getMe,
};

