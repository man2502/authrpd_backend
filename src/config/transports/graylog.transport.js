const winston = require('winston');
const gelfPro = require('gelf-pro');

/**
 * Winston transport для отправки логов в Graylog в формате GELF
 * 
 * Поддерживает протоколы:
 * - UDP (рекомендуется для production)
 * - TCP (для надежной доставки)
 * - HTTP/HTTPS (для случаев с firewall)
 * 
 * Особенности:
 * - Graceful fallback при недоступности Graylog
 * - Автоматическое преобразование уровней Winston в Syslog
 * - Поддержка custom fields через префикс _
 * - Не блокирует приложение при ошибках отправки
 */
class GraylogTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);

    this.name = 'graylog';
    this.level = options.level || 'info';
    this.graylogConfig = options.graylogConfig || {};
    this.silent = options.silent || false;

    // Инициализируем GELF клиент
    this.initializeGelf();
  }

  /**
   * Инициализирует GELF клиент с настройками
   */
  initializeGelf() {
    try {
      const adapterName = this.graylogConfig.protocol || 'udp';
      const adapterOptions = {
        host: this.graylogConfig.host,
        port: this.graylogConfig.port,
      };

      // Для HTTP/HTTPS добавляем путь
      if (adapterName === 'http' || adapterName === 'https') {
        adapterOptions.path = this.graylogConfig.path || '/gelf';
      }

      // Настраиваем gelf-pro
      gelfPro.setConfig({
        adapterName,
        adapterOptions,
        // Не падаем при ошибках
        errorHandler: (error) => {
          // Тихо игнорируем ошибки, чтобы не крашить приложение
          // В development можно логировать в console
          if (process.env.NODE_ENV === 'development') {
            console.warn('Graylog transport error (silent):', error.message);
          }
        },
        // Таймауты для надежности
        fields: {
          facility: this.graylogConfig.serviceName || 'authrpd',
        },
      });

      this.gelfClient = gelfPro;
      this.initialized = true;
    } catch (error) {
      // Если инициализация не удалась, помечаем transport как недоступный
      this.initialized = false;
      if (process.env.NODE_ENV === 'development') {
        console.warn('Graylog transport initialization failed:', error.message);
      }
    }
  }

  /**
   * Преобразует уровень Winston в уровень Syslog
   * @param {string} winstonLevel - уровень Winston
   * @returns {number} - уровень Syslog (0-7)
   */
  mapWinstonLevelToSyslog(winstonLevel) {
    const levelMap = {
      error: 3, // Error
      warn: 4,  // Warning
      info: 6,  // Informational
      verbose: 7, // Debug
      debug: 7,   // Debug
      silly: 7,   // Debug
    };

    return levelMap[winstonLevel] || 6;
  }

  /**
   * Логирует сообщение в Graylog
   * @param {Object} info - объект с информацией о логе
   * @param {Function} callback - callback функция
   */
  log(info, callback) {
    if (this.silent || !this.initialized || !this.gelfClient) {
      return callback(null, true);
    }

    try {
      // Преобразуем Winston log info в GELF формат
      const gelfMessage = {
        short_message: info.message || 'Log message',
        full_message: info.stack || info.message,
        level: this.mapWinstonLevelToSyslog(info.level),
        timestamp: info.timestamp ? Math.floor(new Date(info.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000),
        // Стандартные поля
        _service: this.graylogConfig.serviceName || 'authrpd',
        _environment: this.graylogConfig.environment || process.env.NODE_ENV || 'development',
        _host: this.graylogConfig.hostname || require('os').hostname(),
      };

      // Добавляем request_id если есть
      if (info.request_id || info.requestId) {
        gelfMessage._request_id = info.request_id || info.requestId;
      }

      // Добавляем все дополнительные поля как custom fields (с префиксом _)
      Object.keys(info).forEach((key) => {
        // Пропускаем служебные поля Winston
        if (
          !['message', 'level', 'timestamp', 'stack', 'splat', 'Symbol(level)', 'Symbol(message)', 'request_id', 'requestId'].includes(key)
        ) {
          // Все custom поля в GELF должны начинаться с _
          const gelfKey = key.startsWith('_') ? key : `_${key}`;
          gelfMessage[gelfKey] = info[key];
        }
      });

      // Отправляем в Graylog асинхронно (не блокируем)
      // gelf-pro.message принимает: message, level, additionalFields
      this.gelfClient.message(
        gelfMessage.short_message,
        gelfMessage.level,
        gelfMessage
      );

      // Вызываем callback успешно (не ждем подтверждения от Graylog)
      setImmediate(() => {
        this.emit('logged', info);
        callback(null, true);
      });
    } catch (error) {
      // При ошибке просто игнорируем (graceful degradation)
      // В development можно логировать
      if (process.env.NODE_ENV === 'development') {
        console.warn('Graylog log error (silent):', error.message);
      }
      callback(null, true); // Возвращаем success, чтобы не крашить приложение
    }
  }
}

module.exports = GraylogTransport;

