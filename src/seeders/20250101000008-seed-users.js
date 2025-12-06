'use strict';

const bcrypt = require('bcryptjs');

/**
 * Seeder для пользователей (members и clients)
 * Создает тестовые данные согласно ТЗ
 * Пароль для всех тестовых пользователей: password123
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Members - используем ON CONFLICT для идемпотентности
    // Используем параметризованный запрос для безопасности
    await queryInterface.sequelize.query(
      `INSERT INTO members (username, password_hash, fullname, position, phone, email, role_id, organization_id, region_id, is_active, created_at, updated_at)
       VALUES
         ('superadmin', $1, 'Super Administrator', 'System Administrator', '+99312345678', 'superadmin@example.com', 1, 'ORG001', 'A', true, NOW(), NOW()),
         ('admin', $1, 'Administrator', 'Administrator', '+99312345679', 'admin@example.com', 2, 'ORG002', 'B', true, NOW(), NOW())
       ON CONFLICT (username) DO NOTHING;`,
      {
        bind: [passwordHash],
        type: Sequelize.QueryTypes.INSERT,
      }
    );

    // Clients - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(
      `INSERT INTO clients (username, password_hash, fullname, phone, phone_verified, email, email_verified, is_blocked, is_active, organization_id, ministry_id, region_id, created_at, updated_at)
       VALUES
         ('client1', $1, 'Test Client', '+99312345680', true, 'client@example.com', true, false, true, 'ORG001', 'M01', 'A', NOW(), NOW())
       ON CONFLICT (username) DO NOTHING;`,
      {
        bind: [passwordHash],
        type: Sequelize.QueryTypes.INSERT,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clients', null, {});
    await queryInterface.bulkDelete('members', null, {});
  },
};

