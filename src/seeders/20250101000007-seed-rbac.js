'use strict';

const { Role, Permission, RolePermission } = require('../models');

/**
 * Seeder для RBAC (роли, права, связи)
 * Создает тестовые данные согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Roles - используем findOrCreate для идемпотентности
    const [superAdminRole] = await Role.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        name: 'SUPERADMIN',
        title_tm: 'Superadmin',
        title_ru: 'Суперадмин',
        is_active: true,
      },
    });

    const [adminRole] = await Role.findOrCreate({
      where: { id: 2 },
      defaults: {
        id: 2,
        name: 'ADMIN',
        title_tm: 'Admin',
        title_ru: 'Админ',
        is_active: true,
      },
    });

    // Permissions - используем findOrCreate для идемпотентности
    const [catalogRead] = await Permission.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        name: 'CATALOG_READ',
        is_active: true,
      },
    });

    const [catalogWrite] = await Permission.findOrCreate({
      where: { id: 2 },
      defaults: {
        id: 2,
        name: 'CATALOG_WRITE',
        is_active: true,
      },
    });

    const [rbacManage] = await Permission.findOrCreate({
      where: { id: 3 },
      defaults: {
        id: 3,
        name: 'RBAC_MANAGE',
        is_active: true,
      },
    });

    // Role-Permission links - используем findOrCreate для идемпотентности
    // Примечание: таблица role_permission не имеет timestamps (created_at/updated_at)
    
    // Assign all permissions to SUPERADMIN role
    // Get all active permissions from database (including those from seed-permissions-all.js)
    // This ensures superadmin has all permissions, even if new ones are added later
    const allPermissions = await Permission.findAll({
      where: { is_active: true },
    });

    // Assign all permissions to superadmin
    for (const permission of allPermissions) {
      await RolePermission.findOrCreate({
        where: {
          role_id: superAdminRole.id,
          permission_id: permission.id,
        },
        defaults: {
          role_id: superAdminRole.id,
          permission_id: permission.id,
        },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await RolePermission.destroy({ where: {}, truncate: true, cascade: true });
    await Permission.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
  },
};
