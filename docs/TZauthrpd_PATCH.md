# AuthRPD ТЗ: Анализ ошибок и патч-исправления

**Версия:** v2.2 (Patch)  
**Дата:** 2025-01-XX  
**Автор:** Principal Architect Review

---

## Findings (Ошибки и противоречия)

### 1. **КРИТИЧНО: department_id в members**

**Проблема:**
- В разделе 6.1.1 (строка 196) указано поле `department_id` в таблице `members`
- В разделе 6.3 (строка 295) есть примечание о том, что departments не реализованы
- Согласно контексту: **Departments НЕ должны жить в AuthRPD** (их ведёт RegionalRPD админ)

**Почему это ошибка:**
- Нарушает архитектурное разделение ответственности
- Создаёт ложную зависимость от сущности, которой нет в AuthRPD
- При интеграции с RegionalRPD возникнет конфликт: RegionalRPD будет управлять departments, но AuthRPD будет ссылаться на них
- Индекс на `department_id` (строка 214) создаст проблему при миграции

**Исправление:**
- Удалить поле `department_id` из таблицы `members`
- Удалить индекс `INDEX(department_id)` из раздела 6.1.1
- Удалить раздел 6.3 "Departments" полностью

---

### 2. **КРИТИЧНО: Неопределённость идентификаторов регионов**

**Проблема:**
- В разных местах используется `region_id`, но не ясно: это числовой ID или строковый code?
- В seed данных (строка 676, 691) используется строковый code: `region_id: "A"`
- В модели `regions` (из кода) PK = `code` (STRING)
- В `rpd_instances.region_id` (строка 424) указано: "ссылка на regions.code"
- Но в других таблицах (`members`, `clients`, `organizations`, `banks`) не указано, что `region_id` = `regions.code`

**Почему это ошибка:**
- Неоднозначность приведёт к ошибкам при создании foreign keys
- Разработчики могут использовать числовой ID вместо code
- При синхронизации каталогов возникнут проблемы с разрешением ссылок
- Интеграция с RegionalRPD будет некорректной

**Исправление:**
- Установить каноническое правило: **все `region_id` — это STRING, ссылаются на `regions.code`**
- Добавить явные комментарии во все таблицы с `region_id`: "REFERENCES regions.code (STRING)"
- В разделе 6.4 "Catalogs" добавить описание структуры `regions` с указанием, что PK = `code` (STRING)

---

### 3. **КРИТИЧНО: Неполная спецификация JWT claims**

**Проблема:**
- В разделе 7.1 (строка 447) указано только: `sub = {user_type}:{user_id}`
- Не описаны обязательные claims для RBAC: `roles`, `permissions`, `org_id`, `region_id`
- Не описана структура `data` объекта в payload
- Не описано, как формируется `aud` для разных типов пользователей (members vs clients)
- Не описано, что `aud` может быть массивом (из кода видно, что используется массив audiences)

**Почему это ошибка:**
- RegionalRPD и DeliveryRPD не смогут корректно верифицировать и использовать токены
- Неясно, какие данные доступны в токене для авторизации
- Разработчики будут гадать, какие claims использовать
- Интеграционные тесты будут некорректными

**Исправление:**
- Добавить полную спецификацию JWT payload с обязательными claims
- Описать структуру `data` объекта
- Описать формирование `aud` (массив audiences из rpd_instances)
- Добавить примеры payload для MEMBER и CLIENT

---

### 4. **СРЕДНЕ: Отсутствие batch API для каталогов**

**Проблема:**
- В разделе 9.4 указаны только CRUD операции для каталогов
- Нет batch операций (POST /catalogs/{name}/batch) для массового импорта/обновления
- При синхронизации из внешних систем (например, из старой БД) потребуется множество отдельных запросов

**Почему это ошибка:**
- Неэффективно для миграции данных
- Высокая нагрузка на API при массовых операциях
- Нет атомарности при обновлении связанных каталогов

**Исправление:**
- Добавить endpoint: `POST /admin/catalogs/{name}/batch` для массового создания/обновления
- Описать формат запроса и ответа
- Указать лимиты (максимум N записей за раз)

---

### 5. **СРЕДНЕ: Неясности по delta sync и удалениям**

**Проблема:**
- В разделе 10.2 описан endpoint `/catalog-sync/:name?version=X`
- Не описано, как обрабатываются удалённые записи (soft delete через `deleted_at`)
- Не описано, как работает delta sync: возвращаются только изменённые записи или все?
- Не описано, что происходит при изменении версии: полный снэпшот или инкрементальные изменения?

**Почему это ошибка:**
- RegionalRPD не сможет корректно синхронизировать удаления
- Может возникнуть рассинхронизация: в RegionalRPD останутся удалённые записи
- Неясно, нужно ли RegionalRPD отслеживать `deleted_at` или использовать другой механизм

**Исправление:**
- Описать механизм delta sync: при `version < current_version` возвращаются все активные записи (`is_active=true AND deleted_at IS NULL`)
- Добавить поле `deleted_items` в ответ синхронизации для удалённых записей (массив ID/code)
- Или использовать флаг `include_deleted=true` для получения удалённых записей

---

### 6. **НИЗКО: Несоответствие endpoint пути**

**Проблема:**
- В разделе 10.2 (строка 561) указан endpoint: `GET /catalog-sync/:name?version=X`
- В коде реализован: `GET /catalogs/:name?version=X` (из sync.routes.js)

**Почему это ошибка:**
- Несоответствие ТЗ и реализации
- Может привести к путанице при интеграции

**Исправление:**
- Унифицировать: использовать `GET /catalogs/:name?version=X` (более RESTful)
- Или изменить код на `/catalog-sync/:name`

---

### 7. **НИЗКО: Отсутствие описания issuer и audience значений**

**Проблема:**
- В разделе 7.1 упоминается `iss` и `aud`, но не указаны конкретные значения
- Не описано, как формируется `aud` для разных RPD instances

**Почему это ошибка:**
- Неясно, какие значения использовать при верификации токенов
- RegionalRPD не знает, какой `aud` ожидать

**Исправление:**
- Указать формат: `iss = "AUTHRPD"` (константа)
- Указать формат: `aud = ["rpd:{region_code}"]` (массив из rpd_instances.audience)
- Добавить примеры для разных регионов

---

### 8. **НИЗКО: role_id в members — правильно, но нужна ясность**

**Проблема:**
- В разделе 6.1.1 указано `role_id` в members
- Не описано, может ли member иметь несколько ролей (сейчас — одна роль)
- Не описана таблица `member_role_assignment` (если нужна для будущего расширения)

**Почему это не критично, но стоит уточнить:**
- Текущая реализация поддерживает одну роль на member
- Если в будущем потребуется множественные роли, нужна будет связующая таблица

**Исправление:**
- Добавить примечание: "Текущая реализация: один member = одна роль. Для множественных ролей в будущем потребуется таблица `member_role_assignments`"
- Оставить `role_id` как есть (это правильно для текущей архитектуры)

---

## Fixes (Конкретные исправления)

### Fix 1: Удаление department_id

**Действие:** [Delete]  
**Раздел:** 6.1.1 (members)

Удалить строки:
- `department_id` (строка 196)
- `INDEX(department_id)` (строка 214)

**Действие:** [Delete]  
**Раздел:** 6.3 (Departments)

Удалить весь раздел 6.3 "Departments" (строки 293-313)

---

### Fix 2: Канонизация region_id

**Действие:** [Replace]  
**Раздел:** 6.1.1 (members), строка 200

**Было:**
```
region_id
```

**Стало:**
```
region_id (STRING, REFERENCES regions.code, nullable)
```

**Действие:** [Replace]  
**Раздел:** 6.1.2 (clients), строка 246

**Было:**
```
region_id
```

**Стало:**
```
region_id (STRING, REFERENCES regions.code, nullable)
```

**Действие:** [Add]  
**Раздел:** 6.4 (Catalogs), после строки 318

Добавить описание таблицы `regions`:

```
region
- code (STRING, PRIMARY KEY) — уникальный код региона (например "A", "B", "10", "11")
- title_tm (STRING)
- title_ru (STRING)
- prefix_tm (STRING, nullable)
- prefix_ru (STRING, nullable)
- suffix_tm (STRING, nullable)
- suffix_ru (STRING, nullable)
- parent_id (STRING, nullable, REFERENCES regions.code) — для иерархии регионов
- is_active (BOOLEAN, default true)
- timestamps + paranoid

Важно: Все внешние ключи, ссылающиеся на регионы, используют code (STRING), а не числовой ID.
```

---

### Fix 3: Полная спецификация JWT claims

**Действие:** [Replace]  
**Раздел:** 7.1 (Access token), строки 435-450

**Было:**
```
7.1. Access token

ES256 (ECDSA с кривой P-256)

kid в header

aud в payload

iss в payload

sub = {user_type}:{user_id}

TTL 10–30 минут (настраивается через ACCESS_TTL_SECONDS)
```

**Стало:**
```
7.1. Access token

Алгоритм: ES256 (ECDSA с кривой P-256)

Header:
{
  "alg": "ES256",
  "typ": "JWT",
  "kid": "YYYY-MM"  // формат: год-месяц (например "2025-12")
}

Payload (стандартные claims):
- iss (string): "AUTHRPD" — константа, идентификатор issuer
- sub (string): "{user_type}:{user_id}" — например "MEMBER:123" или "CLIENT:456"
- aud (array of strings): массив audiences из rpd_instances.audience для региона пользователя
  Пример: ["rpd:ahal"] или ["rpd:ahal", "rpd:balkan"] (если пользователь имеет доступ к нескольким регионам)
- iat (number): время выдачи токена (Unix timestamp)
- exp (number): время истечения токена (Unix timestamp)
- jti (string): уникальный идентификатор токена (UUID)

Payload (custom claims):
- data (object): дополнительные данные пользователя
  - id (number): ID пользователя (member.id или client.id)
  - user_type (string): "MEMBER" или "CLIENT"
  - role (string, nullable): имя роли (role.name) для members, null для clients
  - region_id (string, nullable): код top-level региона (regions.code), разрешённый через иерархию
  - sub_region_id (string, optional): оригинальный region_id пользователя, если он отличается от top-level
  - organization_id (string, nullable): код организации (organizations.code)
  - fullname (string, nullable): полное имя пользователя
  - permissions (array of strings, optional): список permission names (может быть опущен для оптимизации размера токена)

TTL: 10–30 минут (настраивается через ACCESS_TTL_SECONDS, по умолчанию 20 минут)

Пример payload для MEMBER:
{
  "iss": "AUTHRPD",
  "sub": "MEMBER:123",
  "aud": ["rpd:ahal"],
  "iat": 1733030000,
  "exp": 1733031800,
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "id": 123,
    "user_type": "MEMBER",
    "role": "ADMIN",
    "region_id": "11",  // top-level регион (Ahal)
    "sub_region_id": "10",  // оригинальный регион (Aşgabat, если он подрегион Ahal)
    "organization_id": "ORG001",
    "fullname": "Иванов Иван Иванович"
  }
}

Пример payload для CLIENT:
{
  "iss": "AUTHRPD",
  "sub": "CLIENT:456",
  "aud": ["rpd:ahal"],
  "iat": 1733030000,
  "exp": 1733031800,
  "jti": "550e8400-e29b-41d4-a716-446655440001",
  "data": {
    "id": 456,
    "user_type": "CLIENT",
    "role": null,
    "region_id": "11",
    "organization_id": "ORG001",
    "fullname": "Петров Петр Петрович"
  }
}

Примечание: Поле permissions в data может быть опущено для уменьшения размера токена.
RegionalRPD и DeliveryRPD должны получать permissions через отдельный endpoint или кэшировать их локально.
```

---

### Fix 4: Batch API для каталогов

**Действие:** [Add]  
**Раздел:** 9.4 (Catalogs CRUD), после строки 549

Добавить:

```
9.4.1. Batch операции для каталогов

POST /admin/catalogs/{name}/batch

Массовое создание/обновление записей каталога.

Параметры:
- name: название каталога (regions, ministries, organizations, и т.д.)

Body:
{
  "items": [
    { /* запись 1 */ },
    { /* запись 2 */ },
    ...
  ],
  "mode": "upsert" | "create" | "update"  // по умолчанию "upsert"
}

Правила:
- Максимум 100 записей за один запрос
- При mode="upsert": если запись существует (по PK), обновляется; иначе создаётся
- При mode="create": все записи создаются (ошибка, если запись существует)
- При mode="update": все записи обновляются (ошибка, если запись не существует)
- Операция атомарна: либо все записи обрабатываются, либо ни одна (транзакция)

Ответ:
{
  "success": true,
  "data": {
    "created": 5,
    "updated": 3,
    "errors": []  // массив ошибок для записей, которые не удалось обработать
  }
}

Требования:
- Требует аутентификации и прав RBAC (например, CATALOG_WRITE)
- Валидация каждой записи через Joi
- Аудит: логирование batch операций
```

---

### Fix 5: Уточнение delta sync

**Действие:** [Replace]  
**Раздел:** 10.2 (Endpoints), строки 561-573

**Было:**
```
GET /catalog-sync/:name?version=X&lang=tm
Получение данных каталога по версии для синхронизации (публичный endpoint).

Параметры:
- name: название каталога (regions, ministries, organizations, receiver_organizations, 
  classifier_economic, classifier_purpose, classifier_functional, classifier_income,
  banks, bank_accounts, fields, documents, classifier_fields, classifier_documents)
- version: версия каталога на стороне клиента (опционально, если не указана - возвращаются все данные)
- lang: язык локализации (tm или ru, по умолчанию tm)

Ответ:
- Если клиент на актуальной версии: { version: X, up_to_date: true, items: [] }
- Если есть обновления: { version: X, up_to_date: false, items: [...] }
```

**Стало:**
```
GET /catalogs/:name?version=X&lang=tm&include_deleted=false

Получение данных каталога по версии для синхронизации (публичный endpoint).

Параметры:
- name: название каталога (regions, ministries, organizations, receiver_organizations, 
  classifier_economic, classifier_purpose, classifier_functional, classifier_income,
  banks, bank_accounts, fields, documents, classifier_fields, classifier_documents)
- version: версия каталога на стороне клиента (опционально, если не указана - возвращаются все данные)
- lang: язык локализации (tm или ru, по умолчанию tm)
- include_deleted: boolean (по умолчанию false) — включать ли удалённые записи (deleted_at IS NOT NULL)

Механизм синхронизации:
1. Если version не указана или version < current_version:
   - Возвращаются все активные записи (is_active=true AND deleted_at IS NULL)
   - Если include_deleted=true, также возвращаются удалённые записи
2. Если version >= current_version:
   - Возвращается { version: X, up_to_date: true, items: [] }

Ответ (актуальная версия):
{
  "version": 5,
  "up_to_date": true,
  "items": []
}

Ответ (есть обновления):
{
  "version": 5,
  "up_to_date": false,
  "items": [
    { /* запись 1 */ },
    { /* запись 2 */ },
    ...
  ],
  "deleted_items": ["CODE1", "CODE2", ...]  // только если include_deleted=false и есть удалённые записи
}

Примечание: 
- deleted_items содержит коды (или ID) записей, которые были удалены (soft delete) с момента указанной версии
- RegionalRPD должен удалить эти записи локально или пометить их как неактивные
- Для полной синхронизации рекомендуется периодически делать полный запрос без version
```

---

### Fix 6: Уточнение issuer и audience

**Действие:** [Add]  
**Раздел:** 7.1, после описания payload

Добавить:

```
7.1.1. Issuer и Audience

Issuer (iss):
- Константа: "AUTHRPD"
- Настраивается через переменную окружения ISSUER (по умолчанию "AUTHRPD")

Audience (aud):
- Формируется из таблицы rpd_instances
- Для каждого top-level региона существует RPD instance с полем audience (например "rpd:ahal")
- При логине member/client система:
  1. Определяет region_id пользователя
  2. Разрешает top-level регион через иерархию (если region_id — подрегион)
  3. Находит все активные rpd_instances для этого top-level региона
  4. Формирует массив audiences из rpd_instances.audience
- Формат audience: "rpd:{region_code}" (lowercase)
- Примеры: ["rpd:ahal"], ["rpd:balkan"], ["rpd:ahal", "rpd:asgabat"] (если несколько instances)

Верификация токенов:
- RegionalRPD и DeliveryRPD должны проверять, что aud содержит их собственный audience
- Если токен содержит несколько audiences, сервис должен проверить, что один из них совпадает с его audience
```

---

## Canonical Spec (Каноническая спецификация)

### 1. Идентификаторы регионов

**Каноническое правило:**
- Все `region_id` в БД — это STRING, ссылаются на `regions.code`
- `regions.code` — PRIMARY KEY, формат: произвольная строка (например "A", "B", "10", "11", "AHAL")
- Иерархия регионов: через `regions.parent_id` (также STRING, ссылается на `regions.code`)
- Top-level регионы: `parent_id IS NULL`
- Подрегионы: `parent_id` указывает на родительский регион

**Таблицы с region_id:**
- `members.region_id` → `regions.code`
- `clients.region_id` → `regions.code`
- `organizations.region_id` → `regions.code`
- `banks.region_id` → `regions.code`
- `rpd_instances.region_id` → `regions.code` (только top-level регионы)

---

### 2. JWT Claims Structure

**Стандартные claims:**
```json
{
  "iss": "AUTHRPD",
  "sub": "{user_type}:{user_id}",
  "aud": ["rpd:{region_code}", ...],
  "iat": 1234567890,
  "exp": 1234567890,
  "jti": "uuid-v4"
}
```

**Custom claims (data object):**
```json
{
  "data": {
    "id": 123,
    "user_type": "MEMBER" | "CLIENT",
    "role": "ROLE_NAME" | null,
    "region_id": "REGION_CODE",
    "sub_region_id": "REGION_CODE" | undefined,
    "organization_id": "ORG_CODE" | null,
    "fullname": "Full Name" | null,
    "permissions": ["PERM1", "PERM2", ...] | undefined
  }
}
```

**Правила:**
- `region_id` в data — всегда top-level регион (разрешённый через иерархию)
- `sub_region_id` присутствует только если оригинальный region_id ≠ top-level
- `permissions` опциональны (для уменьшения размера токена)
- `aud` — всегда массив (даже если один элемент)

---

### 3. Каталоги и версионирование

**Структура каталогов:**
- Все каталоги имеют общие поля: `title_tm`, `title_ru`, `is_active`
- Все каталоги поддерживают soft delete через `deleted_at` (paranoid)
- Версионирование: таблица `catalog_versions` с полями `catalog_name` (UNIQUE), `version` (INT), `updated_at`

**Правила версионирования:**
- Любое изменение (CREATE/UPDATE/DELETE) → `version++`
- Версия инкрементируется атомарно в транзакции с изменением данных
- При синхронизации: если `client_version < server_version` → возвращаются все активные записи

**Delta sync:**
- По умолчанию возвращаются только активные записи (`is_active=true AND deleted_at IS NULL`)
- Параметр `include_deleted=true` → также возвращаются удалённые записи
- Поле `deleted_items` в ответе содержит коды удалённых записей (только если `include_deleted=false`)

---

### 4. RBAC Structure

**Таблицы:**
- `roles`: id, name (UNIQUE), title_tm, title_ru, is_active
- `permissions`: id, name (UNIQUE), is_active
- `role_permission`: role_id, permission_id (UNIQUE)

**Связи:**
- `members.role_id` → `roles.id` (один member = одна роль, текущая реализация)
- Permissions разрешаются через: `member.role_id` → `role_permission` → `permissions`

**JWT:**
- `data.role` содержит `role.name` (строка)
- `data.permissions` опционально содержит массив `permission.name`

---

## Patch (Список изменений)

### [Delete] Раздел 6.1.1 (members)
- Удалить строку: `department_id`
- Удалить строку: `INDEX(department_id)`

### [Delete] Раздел 6.3
- Удалить весь раздел "6.3. Departments" (строки 293-313)

### [Replace] Раздел 6.1.1 (members), поле region_id
**Было:**
```
region_id
```
**Стало:**
```
region_id (STRING, REFERENCES regions.code, nullable)
```

### [Replace] Раздел 6.1.2 (clients), поле region_id
**Было:**
```
region_id
```
**Стало:**
```
region_id (STRING, REFERENCES regions.code, nullable)
```

### [Add] Раздел 6.4 (Catalogs)
После строки 318 добавить описание таблицы `regions`:
```
region
- code (STRING, PRIMARY KEY) — уникальный код региона
- title_tm (STRING)
- title_ru (STRING)
- prefix_tm (STRING, nullable)
- prefix_ru (STRING, nullable)
- suffix_tm (STRING, nullable)
- suffix_ru (STRING, nullable)
- parent_id (STRING, nullable, REFERENCES regions.code)
- is_active (BOOLEAN, default true)
- timestamps + paranoid

Важно: Все внешние ключи, ссылающиеся на регионы, используют code (STRING).
```

### [Replace] Раздел 7.1 (Access token)
Заменить весь раздел на полную спецификацию (см. Fix 3)

### [Add] Раздел 7.1.1
Добавить подраздел "Issuer и Audience" (см. Fix 6)

### [Add] Раздел 9.4.1
Добавить подраздел "Batch операции для каталогов" (см. Fix 4)

### [Replace] Раздел 10.2 (Endpoints)
Заменить описание endpoint на уточнённую версию (см. Fix 5)

---

## Integration Contract Summary

### Что обязаны принять RegionalRPD и DeliveryRPD

#### 1. JWKS Endpoint

**Endpoint:** `GET /.well-known/jwks.json`  
**Доступ:** Публичный (без аутентификации)  
**Формат:** JSON Web Key Set (JWKS)  
**Алгоритм:** ES256 (ECDSA P-256)

**Пример ответа:**
```json
{
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "x": "base64url-encoded-x",
      "y": "base64url-encoded-y",
      "kid": "2025-12",
      "use": "sig",
      "alg": "ES256"
    }
  ]
}
```

**Требования:**
- RegionalRPD/DeliveryRPD должны кэшировать JWKS (TTL: 1 час)
- При верификации токена использовать `kid` из header для выбора ключа
- Поддерживать минимум текущий и предыдущий месяц (для ротации ключей)

---

#### 2. JWT Claims Contract

**Обязательные claims для верификации:**
- `iss` = "AUTHRPD" (проверять строго)
- `aud` содержит audience RegionalRPD/DeliveryRPD (например "rpd:ahal")
- `exp` > текущее время
- `iat` < текущее время + допустимый skew (например 5 минут)

**Custom claims (data object):**
- `data.id` — ID пользователя
- `data.user_type` — "MEMBER" или "CLIENT"
- `data.role` — имя роли (для members)
- `data.region_id` — код top-level региона
- `data.sub_region_id` — код подрегиона (если есть)
- `data.organization_id` — код организации
- `data.permissions` — опционально, массив permission names

**Использование:**
- RegionalRPD должен проверять `data.region_id` для фильтрации данных по региону
- Permissions можно использовать для авторизации, но рекомендуется получать их через отдельный endpoint или кэшировать локально

---

#### 3. Catalog Sync Contract

**Endpoints:**
- `GET /catalogs/versions` — получение версий всех каталогов
- `GET /catalogs/:name?version=X&lang=tm&include_deleted=false` — получение данных каталога

**Формат ответа:**
```json
{
  "success": true,
  "data": {
    "version": 5,
    "up_to_date": false,
    "items": [...],
    "deleted_items": ["CODE1", "CODE2"]
  }
}
```

**Требования:**
- RegionalRPD должен периодически опрашивать `/catalogs/versions` (например, каждые 5 минут)
- При обнаружении новой версии → запросить данные через `/catalogs/:name?version=X`
- Обрабатывать `deleted_items`: удалить или пометить как неактивные локально
- Поддерживать локализацию через параметр `lang` (tm/ru)

**Каталоги для синхронизации:**
- regions, ministries, organizations, receiver_organizations
- classifier_economic, classifier_purpose, classifier_functional, classifier_income
- banks, bank_accounts
- fields, documents, classifier_fields, classifier_documents

---

#### 4. Catalog Schema

**Общие поля для всех каталогов:**
- `title_tm` (STRING) — название на туркменском
- `title_ru` (STRING) — название на русском
- `is_active` (BOOLEAN) — активность записи
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP, nullable) — для soft delete

**Специфичные поля:**
- `regions`: code (PK), parent_id, prefix_tm, prefix_ru, suffix_tm, suffix_ru
- `organizations`: code (PK), region_id, ministry_id, financing_type, tax_code
- `banks`: id (PK), code_mfo, code_bab, region_id
- И т.д. (см. полное ТЗ)

**Важно:**
- Все `region_id` — это STRING (коды регионов)
- Все внешние ключи используют коды, а не числовые ID (где применимо)

---

#### 5. Authentication Flow

**Логин:**
1. RegionalRPD/DeliveryRPD отправляет запрос на `POST /auth/member/login` или `POST /auth/client/login`
2. AuthRPD возвращает `access_token` и `refresh_token`
3. RegionalRPD/DeliveryRPD сохраняет refresh_token для обновления access_token

**Использование токена:**
- Включать в заголовок: `Authorization: Bearer <access_token>`
- Верифицировать через JWKS endpoint
- Проверять `aud` и `iss`
- Использовать `data.region_id` для фильтрации данных

**Refresh:**
- При истечении access_token использовать `POST /auth/refresh` с refresh_token
- Получить новый access_token и refresh_token

---

### Сводная таблица обязательств

| Компонент | RegionalRPD | DeliveryRPD | Примечание |
|-----------|-------------|-------------|------------|
| JWKS верификация | ✅ Обязательно | ✅ Обязательно | Кэшировать, проверять kid |
| JWT claims проверка | ✅ Обязательно | ✅ Обязательно | Проверять iss, aud, exp |
| Catalog sync | ✅ Обязательно | ❌ Опционально | Периодический опрос версий |
| Локализация (lang) | ✅ Обязательно | ✅ Обязательно | Поддержка tm/ru |
| Обработка deleted_items | ✅ Обязательно | ❌ Опционально | Удаление/деактивация записей |
| Refresh token | ✅ Обязательно | ✅ Обязательно | Обновление access_token |

---

**Конец документа**

