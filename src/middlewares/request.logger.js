const logger = require('../config/logger');

/**
 * Middleware для безопасного логирования HTTP запросов
 * 
 * Логирует:
 * - HTTP метод
 * - Путь запроса
 * - Статус код ответа
 * - Время выполнения запроса (duration_ms)
 * - IP адрес клиента
 * - User-Agent
 * - Request ID (correlation ID)
 * 
 * Безопасность:
 * - НИКОГДА не логирует пароли, токены, секреты
 * - Автоматически очищает чувствительные поля из body/query
 * - Не логирует полные тела запросов в production
 * 
 * Использование:
 * app.use(requestLoggerMiddleware);
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = req.request_id || req.id;

  // Логируем начало запроса (только в development/debug режиме)
  if (logger.level === 'debug' || logger.level === 'silly') {
    logger.debug('Incoming request', {
      request_id: requestId,
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
      user_agent: req.get('user-agent'),
      query: req.query,
    });
  }

  // Перехватываем событие 'finish' для логирования завершения запроса
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    // Формируем безопасный объект для логирования
    const logData = {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
      user_agent: req.get('user-agent'),
    };

    // В development режиме добавляем дополнительную информацию
    if (logger.level === 'debug' || logger.level === 'silly') {
      // Добавляем query параметры (уже очищенные от секретов в logger)
      if (Object.keys(req.query).length > 0) {
        logData.query = req.query;
      }
    }

    // Логируем с соответствующим уровнем
    logger[logLevel]('HTTP request completed', logData);
  });

  next();
}

module.exports = requestLoggerMiddleware;

