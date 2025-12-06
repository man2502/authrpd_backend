const { AuthAuditLog } = require('../../models');
const logger = require('../../config/logger');

/**
 * Логирует событие аудита
 * @param {Object} data - данные события
 */
/**
 * Логирует событие аудита
 * @param {Object} data - данные события
 * @param {string} data.actorType - тип актора (MEMBER, CLIENT, SYSTEM)
 * @param {number} data.actorId - ID актора
 * @param {string} data.action - действие (LOGIN_SUCCESS, etc.)
 * @param {string} data.targetType - тип цели (опционально)
 * @param {string} data.targetId - ID цели (опционально)
 * @param {Object} data.meta - дополнительные метаданные (опционально)
 * @param {string} data.ip - IP адрес запроса (опционально)
 * @param {string} data.userAgent - User-Agent запроса (опционально)
 */
async function logEvent(data) {
  try {
    await AuthAuditLog.create({
      actor_type: data.actorType || null,
      actor_id: data.actorId || null,
      action: data.action,
      target_type: data.targetType || null,
      target_id: data.targetId || null,
      meta: data.meta || null,
      ip: data.ip || null,
      user_agent: data.userAgent || null,
      createdAt: new Date(), // Sequelize will map to created_at column
    });
  } catch (error) {
    // Не прерываем выполнение при ошибке аудита
    logger.error('Audit log error:', error);
  }
}

/**
 * Вспомогательные функции для типичных событий
 */
const auditActions = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  REFRESH_FAIL: 'REFRESH_FAIL',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  CATALOG_UPDATED: 'CATALOG_UPDATED',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  LOGOUT: 'LOGOUT',
};

module.exports = {
  logEvent,
  auditActions,
};

