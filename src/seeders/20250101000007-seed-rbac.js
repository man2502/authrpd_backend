'use strict';

/**
 * Seeder для RBAC (роли, права, связи)
 * Создает тестовые данные согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Roles - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(`
      INSERT INTO roles (id, name, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        (1, 'SUPERADMIN', 'Superadmin', 'Суперадмин', true, NOW(), NOW()),
        (2, 'ADMIN', 'Admin', 'Админ', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Permissions - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(`
      INSERT INTO permissions (id, name, is_active, created_at, updated_at)
      VALUES
        (1, 'CATALOG_READ', true, NOW(), NOW()),
        (2, 'CATALOG_WRITE', true, NOW(), NOW()),
        (3, 'RBAC_MANAGE', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Role-Permission links - используем ON CONFLICT для идемпотентности
    // Примечание: таблица role_permission не имеет timestamps (created_at/updated_at)
    await queryInterface.sequelize.query(`
      INSERT INTO role_permission (role_id, permission_id)
      VALUES
        (1, 1),
        (1, 2),
        (1, 3)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permission', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};

