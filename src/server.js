const app = require('./app');
const config = require('./config/env');
const sequelize = require('./config/db');
const redis = require('./config/redis');
const logger = require('./config/logger');
const { ensureMonthlyKeyPair } = require('./modules/security/keys/key.manager');
const { nodeCronsInitializePartitionManagement, nodeCronsStopYearlyPartitionJob } = require('./utils/partition.crons');
const path = require('path');

// Store cron task for graceful shutdown
let partitionCronTask = null;

/**
 * Запускает сервер AuthRPD
 * 
 * Выполняет:
 * - Проверку подключений к БД и Redis
 * - Синхронизацию моделей (только в development)
 * - Генерацию RSA ключей
 * - Запуск HTTP сервера
 * 
 * Все действия логируются с соответствующим уровнем детализации
 */
async function startServer() {
  try {
    // Проверяем подключение к БД
    await sequelize.authenticate();
    logger.info('Database connection established', {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
    });

    // Синхронизируем модели (в production используйте миграции)
    // Note: auth_audit_log is a partitioned table - indexes are managed by migration
    if (config.env === 'development') {
      try {
        await sequelize.sync({ alter: false });
        logger.info('Database models synchronized');
      } catch (error) {
        // Ignore index creation errors for partitioned tables
        // Indexes are managed by migrations, not by Sequelize sync
        if (error.message && error.message.includes('already exists')) {
          logger.warn('Some indexes already exist (likely from partitioned table migration), continuing...', {
            error: error.message,
          });
        } else {
          throw error;
        }
      }
    }

    // Проверяем подключение к Redis
    await redis.ping();
    logger.info('Redis connection established', {
      host: config.redis.host,
      port: config.redis.port,
    });

    // Генерируем ключи при старте
    const keysDir = path.resolve(config.security.ecKeysDir || config.security.rsaKeysDir);
    const keyInfo = ensureMonthlyKeyPair(keysDir);
    if (keyInfo.skipped) {
      logger.info(`Using existing key pair for ${keyInfo.kid}`, {
        kid: keyInfo.kid,
        key_path: keyInfo.privateKeyPath,
      });
    } else {
      logger.info(`Generated new key pair for ${keyInfo.kid}`, {
        kid: keyInfo.kid,
        key_path: keyInfo.privateKeyPath,
      });
    }

    // Инициализируем управление партициями
    // Создает партиции на старте и запускает cron-задачу для автоматического создания
    try {
      const partitionInit = await nodeCronsInitializePartitionManagement();
      partitionCronTask = partitionInit.cronTask;
      logger.info('Partition management initialized', {
        tables: Object.keys(partitionInit.startResults),
        results: partitionInit.startResults,
      });
    } catch (error) {
      // Не останавливаем приложение при ошибке инициализации партиций
      logger.error('Failed to initialize partition management', {
        error: error.message,
        stack: error.stack,
      });
    }

    // Запускаем сервер
    app.listen(config.port, config.host, () => {
      logger.info(`AuthRPD server started successfully`, {
        host: config.host,
        port: config.port,
        environment: config.env,
        graylog_enabled: config.logging?.graylogEnabled || false,
      });
    });
  } catch (error) {
    // Используем logError для правильного логирования ошибок
    logger.logError(error, null, {
      context: 'server_startup',
      host: config.host,
      port: config.port,
    });
    process.exit(1);
  }
}

// Обработка завершения процесса
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully', {
    signal: 'SIGTERM',
  });
  try {
    // Останавливаем cron-задачу для партиций
    if (partitionCronTask) {
      nodeCronsStopYearlyPartitionJob(partitionCronTask);
      logger.info('Partition cron job stopped');
    }
    
    await sequelize.close();
    redis.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, null, { context: 'graceful_shutdown' });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully', {
    signal: 'SIGINT',
  });
  try {
    // Останавливаем cron-задачу для партиций
    if (partitionCronTask) {
      nodeCronsStopYearlyPartitionJob(partitionCronTask);
      logger.info('Partition cron job stopped');
    }
    
    await sequelize.close();
    redis.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, null, { context: 'graceful_shutdown' });
    process.exit(1);
  }
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection detected', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
});

process.on('uncaughtException', (error) => {
  logger.logError(error, null, {
    context: 'uncaught_exception',
    fatal: true,
  });
  // Даем время на отправку лога перед выходом
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

startServer();

