const { v4: uuidv4 } = require('uuid');

/**
 * Middleware для генерации и распространения Request Correlation ID
 * 
 * Функциональность:
 * - Читает x-request-id из заголовков запроса (если предоставлен клиентом)
 * - Генерирует новый UUID если заголовок отсутствует
 * - Присваивает request_id к req.request_id и req.id (для обратной совместимости)
 * - Добавляет x-request-id в заголовки ответа
 * - Request ID автоматически включается во все логи через logger
 * 
 * Использование:
 * app.use(requestIdMiddleware);
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requestIdMiddleware(req, res, next) {
  // Читаем request ID из заголовка или генерируем новый
  const requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || uuidv4();
  
  // Присваиваем request_id (основное поле) и id (для обратной совместимости)
  req.request_id = requestId;
  req.id = requestId;
  
  // Добавляем request ID в заголовки ответа для трейсинга
  res.setHeader('x-request-id', requestId);
  
  next();
}

module.exports = requestIdMiddleware;

