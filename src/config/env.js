const path = require('path');
const fs = require('fs');

// Определяем окружение (сначала из переменных окружения, потом по умолчанию)
const nodeEnv = process.env.NODE_ENV || process.env.CURRENT_ENV || 'development';

// Загружаем .env файл в зависимости от NODE_ENV
// Приоритет: .env.{NODE_ENV} -> .env
const envFile = `.env.${nodeEnv}`;
const defaultEnvFile = '.env';

// Проверяем существование файла .env.{NODE_ENV}
if (fs.existsSync(path.resolve(process.cwd(), envFile))) {
  require('dotenv').config({ path: envFile });
} else if (fs.existsSync(path.resolve(process.cwd(), defaultEnvFile))) {
  // Если файла .env.{NODE_ENV} нет, загружаем .env
  require('dotenv').config({ path: defaultEnvFile });
} else {
  // Если нет ни одного файла, загружаем без пути (dotenv попытается найти .env)
  require('dotenv').config();
}

module.exports = {
  env: nodeEnv,
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3000', 10),
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'authrpd',
    user: process.env.DB_USER || 'authrpd_user',
    password: process.env.DB_PASSWORD || 'secret',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  
  security: {
    rsaKeysDir: process.env.RSA_KEYS_DIR || './keys/rsa',
    audience: process.env.AUDIENCE || 'RPD',
    issuer: process.env.ISSUER || 'AUTHRPD',
    accessTtlSeconds: parseInt(process.env.ACCESS_TTL_SECONDS || '1200', 10),
    refreshTtlDays: parseInt(process.env.REFRESH_TTL_DAYS || '60', 10),
    // CORS configuration
    cors: {
      origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [],
      allowCredentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
    },
    // Rate limiting configuration
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
    },
    // Request body size limits
    bodyParser: {
      jsonLimit: process.env.BODY_JSON_LIMIT || '10mb',
      urlencodedLimit: process.env.BODY_URLENC_LIMIT || '10mb',
    },
    // HSTS configuration
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10), // 1 year
    },
    // Trust proxy configuration (for reverse proxies like nginx)
    trustProxy: process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
    serviceName: process.env.SERVICE_NAME || 'authrpd',
    graylogEnabled: process.env.GRAYLOG_ENABLED === 'true',
    graylogHost: process.env.GRAYLOG_HOST,
    graylogPort: process.env.GRAYLOG_PORT ? parseInt(process.env.GRAYLOG_PORT, 10) : null,
    graylogProtocol: process.env.GRAYLOG_PROTOCOL || 'udp', // udp, tcp, http
    host: process.env.LOG_HOST || require('os').hostname(),
  },
};

