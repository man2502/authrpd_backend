const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');
const logger = require('../../../config/logger');

/**
 * Получает kid (key identifier) в формате YYYY-MM
 * @param {Date} date - дата, по умолчанию текущая
 * @returns {string} - kid в формате YYYY-MM
 */
function getKid(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Обеспечивает наличие ключевой пары за текущий месяц
 * @param {string} baseDir - базовая директория для ключей
 * @returns {Object} - информация о ключах
 */
function ensureMonthlyKeyPair(baseDir) {
  const kid = getKid();
  const dir = path.join(baseDir, kid);
  const privPath = path.join(dir, 'private.pem');
  const pubPath = path.join(dir, 'public.pem');

  // Проверяем существование ключей
  if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    logger.info(`Key pair for ${kid} already exists, skipping generation`);
    return {
      kid,
      privateKeyPath: privPath,
      publicKeyPath: pubPath,
      skipped: true,
    };
  }

  // Создаем директорию
  fs.mkdirSync(dir, { recursive: true });

  // Генерируем ключевую пару ECDSA (ES256 использует P-256 кривую)
  logger.info(`Generating ECDSA key pair for ${kid}...`);
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256 curve for ES256
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Сохраняем ключи с правильными правами доступа
  fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(pubPath, publicKey, { mode: 0o644 });

  logger.info(`Key pair generated successfully for ${kid}`);

  return {
    kid,
    privateKeyPath: privPath,
    publicKeyPath: pubPath,
    skipped: false,
  };
}

/**
 * Загружает ключевую пару по kid
 * @param {string} baseDir - базовая директория для ключей
 * @param {string} kid - идентификатор ключа
 * @returns {Object} - объект с privateKey и publicKey
 */
function loadKeyPair(baseDir, kid) {
  const dir = path.join(baseDir, kid);
  const privPath = path.join(dir, 'private.pem');
  const pubPath = path.join(dir, 'public.pem');

  if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
    throw new Error(`Key files not found for kid=${kid}`);
  }

  return {
    privateKey: fs.readFileSync(privPath, 'utf8'),
    publicKey: fs.readFileSync(pubPath, 'utf8'),
  };
}

/**
 * Получает список всех доступных kid
 * @param {string} baseDir - базовая директория для ключей
 * @returns {Array<string>} - массив kid
 */
function getAvailableKids(baseDir) {
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const dirs = fs.readdirSync(baseDir, { withFileTypes: true });
  return dirs
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => /^\d{4}-\d{2}$/.test(name))
    .sort()
    .reverse(); // Новейшие первыми
}

module.exports = {
  getKid,
  ensureMonthlyKeyPair,
  loadKeyPair,
  getAvailableKids,
};

