const ApiError = require('../helpers/api.error');
const logger = require('../config/logger');

/**
 * Express error handler middleware
 * 
 * Обрабатывает все ошибки в приложении:
 * - Логирует ошибки с полным контекстом (request_id, stack trace)
 * - Возвращает стандартизированные ответы в формате AuthRPD
 * - Безопасно обрабатывает различные типы ошибок (ApiError, Joi, Sequelize)
 * - В production скрывает детали внутренних ошибок
 * 
 * Использование:
 * app.use(errorHandler); // Должен быть последним middleware
 * 
 * @param {Error} err - объект ошибки
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function errorHandler(err, req, res, next) {
  const requestId = req.request_id || req.id;

  // Логируем ошибку с полным контекстом
  logger.logError(err, req, {
    url: req.url,
    path: req.path,
    method: req.method,
    status_code: err.statusCode || err.errorCode || 500,
  });

  // Если это ApiError, возвращаем стандартный формат
  if (err instanceof ApiError) {
    return res.status(err.errorCode).json(err.toJSON());
  }

  // Если это ошибка валидации Joi
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      data: {
        error_code: 422,
        error_msg: err.details[0].message,
        field: err.details[0].path.join('.'),
      },
    });
  }

  // Если это ошибка Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      data: {
        error_code: 422,
        error_msg: err.errors[0].message,
        field: err.errors[0].path,
      },
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      data: {
        error_code: 409,
        error_msg: 'Resource already exists',
        field: err.errors[0].path,
      },
    });
  }

  // Общая ошибка сервера
  res.status(500).json({
    success: false,
    data: {
      error_code: 500,
      error_msg: process.env.CURRENT_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}

module.exports = errorHandler;

