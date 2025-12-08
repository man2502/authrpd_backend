const winston = require('winston');
const config = require('./env');
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Production-ready Winston logger с поддержкой Graylog
 * 
 * Особенности:
 * - Отправка логов в Graylog в формате GELF (UDP/TCP/HTTP)
 * - Graceful fallback на console если Graylog недоступен
 * - Безопасное логирование (исключение секретов)
 * - Поддержка request correlation ID
 * - Структурированное логирование для production
 */

// Список полей, которые никогда не должны логироваться (секреты)
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'access_token',
  'refresh_token',
  'token_hash',
  'private_key',
  'privateKey',
  'secret',
  'api_key',
  'apiKey',
  'authorization',
  'cookie',
];

/**
 * Рекурсивно удаляет чувствительные поля из объекта
 * @param {Object} obj - объект для очистки
 * @param {number} depth - текущая глубина рекурсии (защита от циклических ссылок)
 * @returns {Object} - очищенный объект
 */
function sanitizeObject(obj, depth = 0) {
  // Защита от циклических ссылок и слишком глубокой рекурсии
  if (depth > 10 || obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Проверяем, не является ли поле чувствительным
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Winston format для очистки секретов из логов
 */
const sanitizeFormat = winston.format((info) => {
  if (info.meta) {
    info.meta = sanitizeObject(info.meta);
  }
  if (info.body) {
    info.body = sanitizeObject(info.body);
  }
  if (info.query) {
    info.query = sanitizeObject(info.query);
  }
  return info;
});

/**
 * Winston format для добавления request_id в каждый лог
 * Request ID добавляется автоматически через meta при вызове logger методов
 */
const requestIdFormat = winston.format((info) => {
  // request_id добавляется через meta объект при логировании
  return info;
});


/**
 * Создает Graylog transport
 * @returns {Object|null} - Winston transport или null если Graylog отключен
 */
function createGraylogTransport() {
  const graylogEnabled = config.logging?.graylogEnabled === true;
  const graylogHost = config.logging?.graylogHost;
  const graylogPort = config.logging?.graylogPort;
  const graylogProtocol = config.logging?.graylogProtocol || 'udp';

  // Graylog отключен или не настроен
  if (!graylogEnabled || !graylogHost || !graylogPort) {
    return null;
  }

  try {
    const GraylogTransport = require('./transports/graylog.transport');

    const transportOptions = {
      level: config.logging?.level || (config.env === 'production' ? 'info' : 'debug'),
      graylogConfig: {
        host: graylogHost,
        port: parseInt(graylogPort, 10),
        protocol: graylogProtocol, // 'udp', 'tcp', 'http', 'https'
        serviceName: config.logging?.serviceName || 'authrpd',
        environment: config.env,
        hostname: config.logging?.host || require('os').hostname(),
        path: '/gelf', // для HTTP/HTTPS
      },
      // Graceful error handling - не падаем если Graylog недоступен
      handleExceptions: true,
      handleRejections: true,
      silent: false, // можно установить в true для полного отключения
    };

    return new GraylogTransport(transportOptions);
  } catch (error) {
    // Если transport не может быть создан, возвращаем null
    // Логируем в console, так как logger еще не создан
    console.warn('Graylog transport initialization failed, falling back to console:', error.message);
    return null;
  }
}

/**
 * Создает консольный transport для development
 * @returns {winston.transports.Console}
 */
function createConsoleTransport() {
  return new winston.transports.Console({
    level: config.logging?.level || (config.env === 'production' ? 'info' : 'debug'),
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      sanitizeFormat(),
      requestIdFormat(),
      config.env === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info) => {
              const requestId = info.request_id || info.requestId || '';
              const reqIdStr = requestId ? `[${requestId}] ` : '';
              return `${info.timestamp} ${info.level}: ${reqIdStr}${info.message} ${
                Object.keys(info).length > 1 ? JSON.stringify(sanitizeObject(info)) : ''
              }`;
            })
          )
    ),
    handleExceptions: true,
    handleRejections: true,
  });
}

/**
 * Создает file transports для локального хранения логов
 * Логи сохраняются в папку logs/ для лучшей организации
 * @returns {Array<winston.transports.File>}
 */
function createFileTransports() {
  const transports = [];
  const path = require('path');
  const fs = require('fs');

  // Создаем папку logs если её нет
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const rotateOpts = {
    dirname: logsDir,
    datePattern: 'YYYY-MM-DD',
    maxSize: '30m',
    maxFiles: '30d',
    zippedArchive: false,
  };

  // Error log file (rotated)
  transports.push(
    new DailyRotateFile({
      ...rotateOpts,
      filename: 'error-%DATE%.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        sanitizeFormat(),
        winston.format.json()
      ),
    })
  );

  // Combined log file (rotated)
  transports.push(
    new DailyRotateFile({
      ...rotateOpts,
      filename: 'combined-%DATE%.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        sanitizeFormat(),
        winston.format.json()
      ),
    })
  );

  return transports;
}

// Создаем массив transports
const transports = [];

// Всегда добавляем console transport (для fallback и development)
transports.push(createConsoleTransport());

// Добавляем file transports
transports.push(...createFileTransports());

// Пытаемся добавить Graylog transport
const graylogTransport = createGraylogTransport();
if (graylogTransport) {
  transports.push(graylogTransport);
}

/**
 * Основной Winston logger
 */
const logger = winston.createLogger({
  level: config.logging?.level || (config.env === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    sanitizeFormat(),
    requestIdFormat()
  ),
  defaultMeta: {
    service: config.logging?.serviceName || 'authrpd',
    environment: config.env,
  },
  transports,
  // Не выходим из процесса при ошибках логирования
  exitOnError: false,
});

/**
 * Обертка для логирования с автоматическим добавлением request_id
 * @param {string} level - уровень логирования
 * @param {string} message - сообщение
 * @param {Object} meta - метаданные
 */
function logWithRequestId(level, message, meta = {}) {
  // Если request_id уже есть в meta, используем его
  // Иначе пытаемся получить из текущего контекста (если используется async-local-storage)
  logger[level](message, meta);
}

// Расширяем logger методами с поддержкой request_id
logger.logRequest = (req, message, meta = {}) => {
  logger.info(message, {
    ...meta,
    request_id: req.request_id || req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
  });
};

logger.logError = (error, req = null, meta = {}) => {
  const errorMeta = {
    ...meta,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  if (req) {
    errorMeta.request_id = req.request_id || req.id;
    errorMeta.method = req.method;
    errorMeta.path = req.path;
    errorMeta.ip = req.ip || req.connection?.remoteAddress;
  }

  logger.error(error.message || 'Error occurred', errorMeta);
};

module.exports = logger;
