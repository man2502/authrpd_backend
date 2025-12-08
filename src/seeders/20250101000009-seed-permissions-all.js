'use strict';

const { Permission } = require('../models');

/**
 * Seeder для всех разрешений (permissions) системы AuthRPD
 * Создает полный набор разрешений согласно ТЗ v2
 * 
 * Использует findOrCreate для идемпотентности (можно запускать многократно)
 * Sequelize автоматически преобразует camelCase в snake_case для БД
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // CORE permissions (from TZ example)
    await Permission.findOrCreate({
      where: { name: 'CATALOG_READ' },
      defaults: { name: 'CATALOG_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'CATALOG_WRITE' },
      defaults: { name: 'CATALOG_WRITE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'RBAC_MANAGE' },
      defaults: { name: 'RBAC_MANAGE', is_active: true },
    });

    // RBAC permissions
    await Permission.findOrCreate({
      where: { name: 'RBAC_READ' },
      defaults: { name: 'RBAC_READ', is_active: true },
    });

    // MEMBER permissions
    await Permission.findOrCreate({
      where: { name: 'MEMBER_READ' },
      defaults: { name: 'MEMBER_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'MEMBER_CREATE' },
      defaults: { name: 'MEMBER_CREATE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'MEMBER_UPDATE' },
      defaults: { name: 'MEMBER_UPDATE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'MEMBER_DISABLE' },
      defaults: { name: 'MEMBER_DISABLE', is_active: true },
    });

    // CLIENT permissions
    await Permission.findOrCreate({
      where: { name: 'CLIENT_READ' },
      defaults: { name: 'CLIENT_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'CLIENT_CREATE' },
      defaults: { name: 'CLIENT_CREATE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'CLIENT_UPDATE' },
      defaults: { name: 'CLIENT_UPDATE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'CLIENT_BLOCK' },
      defaults: { name: 'CLIENT_BLOCK', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'CLIENT_UNBLOCK' },
      defaults: { name: 'CLIENT_UNBLOCK', is_active: true },
    });

    // DEPARTMENT permissions
    await Permission.findOrCreate({
      where: { name: 'DEPARTMENT_READ' },
      defaults: { name: 'DEPARTMENT_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'DEPARTMENT_WRITE' },
      defaults: { name: 'DEPARTMENT_WRITE', is_active: true },
    });

    // SYNC permissions
    await Permission.findOrCreate({
      where: { name: 'SYNC_READ' },
      defaults: { name: 'SYNC_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'SYNC_MANAGE' },
      defaults: { name: 'SYNC_MANAGE', is_active: true },
    });

    // AUDIT permissions
    await Permission.findOrCreate({
      where: { name: 'AUDIT_READ' },
      defaults: { name: 'AUDIT_READ', is_active: true },
    });

    // SECURITY permissions
    await Permission.findOrCreate({
      where: { name: 'SECURITY_READ' },
      defaults: { name: 'SECURITY_READ', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'SECURITY_MANAGE' },
      defaults: { name: 'SECURITY_MANAGE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'KEYS_MANAGE' },
      defaults: { name: 'KEYS_MANAGE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'JWKS_READ' },
      defaults: { name: 'JWKS_READ', is_active: true },
    });

    // TOKEN/SESSION permissions
    await Permission.findOrCreate({
      where: { name: 'TOKEN_REVOKE' },
      defaults: { name: 'TOKEN_REVOKE', is_active: true },
    });

    await Permission.findOrCreate({
      where: { name: 'SESSION_MANAGE' },
      defaults: { name: 'SESSION_MANAGE', is_active: true },
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all permissions created by this seeder
    await Permission.destroy({
      where: {
        name: [
          'CATALOG_READ',
          'CATALOG_WRITE',
          'RBAC_MANAGE',
          'RBAC_READ',
          'MEMBER_READ',
          'MEMBER_CREATE',
          'MEMBER_UPDATE',
          'MEMBER_DISABLE',
          'CLIENT_READ',
          'CLIENT_CREATE',
          'CLIENT_UPDATE',
          'CLIENT_BLOCK',
          'CLIENT_UNBLOCK',
          'DEPARTMENT_READ',
          'DEPARTMENT_WRITE',
          'SYNC_READ',
          'SYNC_MANAGE',
          'AUDIT_READ',
          'SECURITY_READ',
          'SECURITY_MANAGE',
          'KEYS_MANAGE',
          'JWKS_READ',
          'TOKEN_REVOKE',
          'SESSION_MANAGE',
        ],
      },
    });
  },
};
