# AuthRPD - Central Authentication and Master Catalog System

Центральная система аутентификации/авторизации и источник истины для базовых справочников казначейской платформы.

## Технологический стек

- Node.js (LTS)
- Express.js
- Sequelize ORM
- PostgreSQL
- Redis (ioredis)
- Joi для валидации
- Docker / docker-compose

## Установка и запуск

### Требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### Запуск с Docker

#### Production окружение

1. Клонируйте репозиторий
2. (Опционально) Создайте файл `.env.production` на основе `env.production.example`
3. Запустите:

```bash
docker-compose up -d
```

Переменные окружения можно задать в `docker-compose.yml` или через `.env.production` файл.

#### Development окружение

1. Клонируйте репозиторий
2. (Опционально) Создайте файл `.env.development` на основе `env.development.example`
3. Запустите:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Development конфигурация включает:
- Hot-reload с nodemon
- Монтирование исходного кода для разработки
- Отдельные volumes для БД и Redis

### Локальная разработка

1. Установите зависимости:

```bash
npm install
```

2. Настройте базу данных PostgreSQL и Redis (или используйте Docker)

3. Создайте файл `.env.development` на основе `env.development.example`:

```bash
cp env.development.example .env.development
```

4. Запустите миграции:

```bash
npm run migrate
```

5. Запустите seeders (опционально):

```bash
npm run seed
```

6. Запустите сервер:

```bash
npm run dev
```

#### Переменные окружения

Приложение автоматически загружает `.env` файлы в зависимости от `NODE_ENV`:
- `NODE_ENV=development` → загружает `.env.development` или `.env`
- `NODE_ENV=production` → загружает `.env.production` или `.env`

Скрипты:
- `npm run dev` - запуск в development режиме
- `npm start` - запуск в production режиме
- `npm run start:dev` - запуск в development без nodemon
- `npm run start:prod` - явный запуск в production

## API Endpoints

### Аутентификация

- `POST /auth/member/login` - Вход для сотрудников
- `POST /auth/client/login` - Вход для клиентов
- `POST /auth/refresh` - Обновление токенов
- `POST /auth/logout` - Выход
- `GET /auth/me` - Текущий пользователь

### RBAC

- `GET /admin/roles` - Список ролей
- `POST /admin/roles` - Создание роли
- `PUT /admin/roles/:id` - Обновление роли
- `GET /admin/permissions` - Список прав
- `POST /admin/roles/:id/permissions` - Назначение прав роли

### Каталоги

- `GET /catalogs/versions` - Версии каталогов
- `GET /catalogs/regions` - Список регионов
- `POST /catalogs/regions` - Создание региона
- `PUT /catalogs/regions/:code` - Обновление региона
- Аналогично для `ministries`, `organizations`

### Синхронизация (для RPD)

- `GET /catalogs/:name?version=X` - Получение каталога по версии

### JWKS

- `GET /.well-known/jwks.json` - Публичные ключи для верификации токенов

## Особенности

- Ежемесячная ротация RSA ключей
- Локализация (tm/ru) с автоматическим преобразованием title_tm/title_ru в title
- Версионирование справочников
- Кэширование в Redis
- Аудит всех действий
- Rate limiting на критичных endpoints
- Production-ready логирование с Graylog интеграцией
  - Структурированные логи в формате GELF
  - Request correlation ID для трейсинга
  - Автоматическая очистка секретов из логов
  - Graceful fallback при недоступности Graylog
  - Подробная документация: [docs/LOGGING.md](docs/LOGGING.md)

## Структура проекта

```
src/
  config/          # Конфигурация (БД, Redis, env)
  modules/         # Модули приложения
    auth/          # Аутентификация
    rbac/          # Роли и права
    catalogs/      # Справочники
    sync/          # Синхронизация для RPD
    security/      # Безопасность (ключи, токены)
    audit/         # Аудит
  models/          # Sequelize модели
  migrations/      # Миграции БД
  middlewares/     # Express middleware
  helpers/         # Вспомогательные функции
  jobs/            # Фоновые задачи
docs/              # Документация
logs/              # Логи приложения (error.log, combined.log)
keys/rsa/          # RSA ключи (генерируются автоматически)
```

## Лицензия

ISC

