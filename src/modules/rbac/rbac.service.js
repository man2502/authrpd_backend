const { Role, Permission, RolePermission, Member } = require('../../models');
const { cacheData, invalidateCache } = require('../../helpers/cache.helper');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');

/**
 * Инвалидирует кэш разрешений всех пользователей с указанной ролью
 * @param {number} roleId
 */
async function clearUserPermissionCacheForRole(roleId) {
  const members = await Member.findAll({
    where: { role_id: roleId },
    attributes: ['id'],
  });

  for (const member of members) {
    await invalidateCache(`user_permissions:${member.id}`);
  }
}

/**
 * Получает права роли с кэшированием
 * @param {number} roleId - ID роли
 * @returns {Promise<Array>} - массив прав (имена разрешений)
 * @throws {ApiError} - Если роль не найдена (404)
 */
async function getRolePermissions(roleId) {
  return await cacheData(
    `role:permissions:${roleId}`,
    async () => {
      const role = await Role.findByPk(roleId, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            where: { is_active: true }, // Only active permissions
            required: false,
          },
        ],
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      // Return array of permission names (empty array if role has no permissions)
      return (role.permissions || []).map((p) => p.name);
    },
    3600 // TTL 1 час
  );
}

/**
 * Получает все роли
 * @returns {Promise<Array>} - массив ролей
 */
async function getAllRoles() {
  return await Role.findAll({
    order: [['id', 'ASC']],
  });
}

/**
 * Создает новую роль
 * @param {Object} data - данные роли
 * @returns {Promise<Object>} - созданная роль
 */
async function createRole(data) {
  const role = await Role.create({
    title_tm: data.title_tm,
    title_ru: data.title_ru,
    name: data.name,
  });

  await logEvent({
    action: auditActions.ROLE_CHANGED,
    meta: { roleId: role.id, action: 'created' },
  });

  return role;
}

/**
 * Обновляет роль
 * @param {number} id - ID роли
 * @param {Object} data - данные для обновления
 * @returns {Promise<Object>} - обновленная роль
 */
async function updateRole(id, data) {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  await role.update({
    title_tm: data.title_tm !== undefined ? data.title_tm : role.title_tm,
    title_ru: data.title_ru !== undefined ? data.title_ru : role.title_ru,
    name: data.name !== undefined ? data.name : role.name,
  });

  await invalidateCache(`role:permissions:${id}`);
  await clearUserPermissionCacheForRole(id);
  await logEvent({
    action: auditActions.ROLE_CHANGED,
    targetType: 'ROLE',
    targetId: id,
    meta: { action: 'updated' },
  });

  return role;
}

/**
 * Получает все права
 * @returns {Promise<Array>} - массив прав
 */
async function getAllPermissions() {
  return await Permission.findAll({
    order: [['id', 'ASC']],
  });
}

/**
 * Назначает права роли
 * @param {number} roleId - ID роли
 * @param {Array<number>} permissionIds - массив ID прав
 * @returns {Promise<void>}
 */
async function assignPermissionsToRole(roleId, permissionIds) {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  // Удаляем старые связи
  await RolePermission.destroy({ where: { role_id: roleId } });

  // Создаем новые связи
  for (const permissionId of permissionIds) {
    await RolePermission.create({ role_id: roleId, permission_id: permissionId });
  }

  await invalidateCache(`role:permissions:${roleId}`);
  await clearUserPermissionCacheForRole(roleId);
  await logEvent({
    action: auditActions.PERMISSION_CHANGED,
    targetType: 'ROLE',
    targetId: roleId,
    meta: { permissionIds, action: 'assigned' },
  });
}

module.exports = {
  getRolePermissions,
  getAllRoles,
  createRole,
  updateRole,
  getAllPermissions,
  assignPermissionsToRole,
};

