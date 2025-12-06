# Logging System Documentation

## Обзор

AuthRPD использует production-ready систему логирования на базе Winston с поддержкой отправки логов в Graylog в формате GELF (Graylog Extended Log Format).

## Архитектура

### Компоненты

1. **Winston Logger** (`src/config/logger.js`)
   - Основной logger с поддержкой multiple transports
   - Автоматическая очистка секретов из логов
   - Структурированное логирование

2. **Graylog Transport** (`src/config/transports/graylog.transport.js`)
   - Кастомный Winston transport для отправки в Graylog
   - Поддержка UDP, TCP, HTTP/HTTPS протоколов
   - Graceful fallback при недоступности Graylog

3. **Request ID Middleware** (`src/middlewares/request.id.js`)
   - Генерация и распространение correlation ID
   - Автоматическое добавление в заголовки ответа

4. **Request Logger Middleware** (`src/middlewares/request.logger.js`)
   - Безопасное логирование HTTP запросов
   - Автоматическое исключение секретов

## Конфигурация

### Переменные окружения

```bash
# Уровень логирования (error, warn, info, debug, silly)
LOG_LEVEL=info

# Имя сервиса (используется в логах)
SERVICE_NAME=authrpd

# Graylog настройки
GRAYLOG_ENABLED=true
GRAYLOG_HOST=graylog.example.com
GRAYLOG_PORT=12201
GRAYLOG_PROTOCOL=udp  # udp, tcp, http, https
```

### Примеры конфигурации

#### Development
```bash
LOG_LEVEL=debug
SERVICE_NAME=authrpd
GRAYLOG_ENABLED=false
```

#### Production
```bash
LOG_LEVEL=info
SERVICE_NAME=authrpd
GRAYLOG_ENABLED=true
GRAYLOG_HOST=graylog.production.local
GRAYLOG_PORT=12201
GRAYLOG_PROTOCOL=udp
```

## Использование

### Базовое логирование

```javascript
const logger = require('./config/logger');

// Разные уровни
logger.error('Error message', { error_code: 500 });
logger.warn('Warning message', { user_id: 123 });
logger.info('Info message', { action: 'user_created' });
logger.debug('Debug message', { details: '...' });
```

### Логирование с Request ID

```javascript
// В контроллере
async function myController(req, res, next) {
  try {
    logger.info('Processing request', {
      request_id: req.request_id,
      action: 'process_data',
    });
    
    // ... код ...
    
    res.json(result);
  } catch (error) {
    next(error); // Error handler автоматически залогирует с request_id
  }
}
```

### Логирование ошибок

```javascript
// Используйте logError helper
logger.logError(error, req, {
  context: 'user_creation',
  additional_data: '...',
});

// Или стандартный способ
logger.error('Error occurred', {
  request_id: req.request_id,
  error: {
    message: error.message,
    stack: error.stack,
  },
});
```

### Логирование HTTP запросов

Request logger middleware автоматически логирует все HTTP запросы:

```javascript
// В app.js
app.use(requestLoggerMiddleware);
```

Логируется:
- HTTP метод и путь
- Статус код ответа
- Время выполнения (duration_ms)
- IP адрес клиента
- User-Agent
- Request ID

## Безопасность

### Автоматическая очистка секретов

Logger автоматически удаляет следующие поля из логов:
- `password`, `password_hash`, `passwordHash`
- `token`, `access_token`, `refresh_token`, `token_hash`
- `private_key`, `privateKey`
- `secret`, `api_key`, `apiKey`
- `authorization`, `cookie`

Пример:
```javascript
// ❌ НЕ ДЕЛАЙТЕ ТАК
logger.info('Login', { username: 'user', password: 'secret123' });

// ✅ ПРАВИЛЬНО - пароль будет автоматически заменен на [REDACTED]
logger.info('Login attempt', { username: 'user', password: 'secret123' });
// В логе: { username: 'user', password: '[REDACTED]' }
```

## Request Correlation ID

Каждый HTTP запрос получает уникальный correlation ID:

1. Читается из заголовка `x-request-id` (если предоставлен клиентом)
2. Иначе генерируется новый UUID
3. Добавляется в `req.request_id` и `req.id`
4. Включается в заголовок ответа `x-request-id`
5. Автоматически добавляется во все логи

Использование:
```javascript
// В контроллере
logger.info('Action', {
  request_id: req.request_id, // Уже доступен через middleware
  // ... другие поля
});
```

## Graylog Integration

### Формат GELF

Логи отправляются в Graylog в формате GELF v1.1:

```json
{
  "version": "1.1",
  "host": "server-hostname",
  "short_message": "Log message",
  "full_message": "Full message with stack trace",
  "timestamp": 1234567890,
  "level": 6,
  "_service": "authrpd",
  "_environment": "production",
  "_request_id": "uuid-here",
  "_custom_field": "value"
}
```

### Уровни логирования (Syslog)

- 0-2: Emergency, Alert, Critical (не используются)
- 3: Error
- 4: Warning
- 5: Notice (не используется)
- 6: Info
- 7: Debug

### Протоколы

#### UDP (рекомендуется для production)
- Быстрый и эффективный
- Fire-and-forget (нет подтверждения доставки)
- Может терять пакеты при высокой нагрузке

#### TCP
- Надежная доставка
- Медленнее чем UDP
- Требует постоянного соединения

#### HTTP/HTTPS
- Работает через firewalls
- Надежная доставка
- Самый медленный вариант

## Graceful Degradation

Если Graylog недоступен:
1. Логи продолжают отправляться в console
2. Логи записываются в файлы (error.log, combined.log)
3. Приложение продолжает работать нормально
4. Ошибки Graylog логируются только в development режиме

## Best Practices

### 1. Используйте правильные уровни

```javascript
logger.error();   // Ошибки, требующие внимания
logger.warn();    // Предупреждения
logger.info();    // Важные события (login, logout, создание ресурсов)
logger.debug();   // Детальная информация для отладки
```

### 2. Всегда включайте контекст

```javascript
// ❌ Плохо
logger.info('User created');

// ✅ Хорошо
logger.info('User created', {
  request_id: req.request_id,
  user_id: user.id,
  username: user.username,
  role: user.role,
});
```

### 3. Используйте структурированные данные

```javascript
// ❌ Плохо
logger.info(`User ${username} logged in from ${ip}`);

// ✅ Хорошо
logger.info('User logged in', {
  request_id: req.request_id,
  username,
  ip,
  user_agent: req.get('user-agent'),
});
```

### 4. Не логируйте секреты

```javascript
// ❌ НИКОГДА
logger.info('Token generated', { token: jwtToken });

// ✅ Правильно
logger.info('Token generated', {
  user_id: user.id,
  token_type: 'access',
  expires_in: 3600,
});
```

## Мониторинг и алертинг

В Graylog можно настроить:
- Алерты на критические ошибки (level 3)
- Дашборды для мониторинга
- Поиск по request_id для трейсинга
- Анализ производительности по duration_ms

## Расположение логов

Логи сохраняются в папку `logs/`:
- `logs/error.log` - только ошибки
- `logs/combined.log` - все логи

Папка `logs/` автоматически создается при первом запуске приложения.

## Troubleshooting

### Логи не отправляются в Graylog

1. Проверьте `GRAYLOG_ENABLED=true`
2. Проверьте доступность Graylog сервера
3. Проверьте firewall правила
4. Проверьте логи в console (ошибки Graylog видны только в development)

### Слишком много логов

1. Увеличьте `LOG_LEVEL` до `info` или `warn` в production
2. Используйте `debug` только в development

### Потеря логов

1. Используйте TCP или HTTP вместо UDP для критичных логов
2. Настройте локальное хранение логов (файлы в `logs/`)
3. Проверьте права доступа к папке `logs/`

