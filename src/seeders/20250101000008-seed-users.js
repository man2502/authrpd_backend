'use strict';

const bcrypt = require('bcryptjs');
const { Member, Client } = require('../models');

/**
 * Seeder для пользователей (members и clients)
 * Создает тестовые данные согласно ТЗ
 * Пароль для всех тестовых пользователей: password123
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Members - используем findOrCreate для идемпотентности
    await Member.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        username: 'superadmin',
        password_hash: passwordHash,
        fullname: 'Super Administrator',
        position: 'System Administrator',
        phone: '+99312345678',
        email: 'superadmin@example.com',
        role_id: 1,
        organization_id: 'ORG001',
        region_id: 'A',
        is_active: true,
        // createdAt и updatedAt будут установлены автоматически благодаря timestamps: true
      },
    });

    await Member.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password_hash: passwordHash,
        fullname: 'Administrator',
        position: 'Administrator',
        phone: '+99312345679',
        email: 'admin@example.com',
        role_id: 2,
        organization_id: 'ORG002',
        region_id: 'B',
        is_active: true,
      },
    });

    // Clients - используем findOrCreate для идемпотентности
    await Client.findOrCreate({
      where: { username: 'client1' },
      defaults: {
        username: 'client1',
        password_hash: passwordHash,
        fullname: 'Test Client',
        phone: '+99312345680',
        phone_verified: true,
        email: 'client@example.com',
        email_verified: true,
        is_blocked: false,
        is_active: true,
        organization_id: 'ORG001',
        ministry_id: 'M01',
        region_id: 'A',
        // createdAt и updatedAt будут установлены автоматически благодаря timestamps: true
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await Client.destroy({ where: {}, truncate: true, cascade: true });
    await Member.destroy({ where: {}, truncate: true, cascade: true });
  },
};
