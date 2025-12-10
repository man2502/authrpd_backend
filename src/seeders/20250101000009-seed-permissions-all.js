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
    // Helper function to safely create permission (handles existing records)
    const createPermission = async (name) => {
      try {
        // First, check if permission exists (including soft-deleted)
        let existing = await Permission.findOne({
          where: { name },
          paranoid: false, // Include soft-deleted records
        });

        if (existing) {
          // If soft-deleted, restore it
          if (existing.deleted_at) {
            existing.deleted_at = null;
            existing.is_active = true;
            await existing.save();
            console.log(`↻ Restored permission: ${name}`);
            return existing;
          }
          // Already exists and active
          console.log(`⊘ Permission already exists: ${name}`);
          return existing;
        }

        // Doesn't exist, create it
        const permission = await Permission.create({
          name,
          is_active: true,
        });
        console.log(`✓ Created permission: ${name}`);
        return permission;
      } catch (error) {
        // Handle duplicate key errors (ID conflict)
        if (
          error.name === 'SequelizeUniqueConstraintError' ||
          error.name === 'SequelizeDatabaseError' ||
          (error.original && error.original.code === '23505') // PostgreSQL duplicate key error
        ) {
          // Try to find existing permission by name (it might exist but findOrCreate missed it)
          const existing = await Permission.findOne({
            where: { name },
            paranoid: false,
          });
          if (existing) {
            if (existing.deleted_at) {
              existing.deleted_at = null;
              existing.is_active = true;
              await existing.save();
              console.log(`↻ Restored permission: ${name}`);
            } else {
              console.log(`⊘ Permission already exists: ${name}`);
            }
            return existing;
          }
        }
        // If still fails, log and continue
        console.warn(`⚠️  Error creating permission ${name}:`, error.message);
        return null;
      }
    };

    // CORE permissions (from TZ example)
    // Note: Some of these may already exist from seed-rbac.js (20250101000007)
    await createPermission('CATALOG_READ');
    await createPermission('CATALOG_WRITE');
    await createPermission('RBAC_MANAGE');

    // RBAC permissions
    await createPermission('RBAC_READ');

    // MEMBER permissions
    await createPermission('MEMBER_READ');
    await createPermission('MEMBER_CREATE');
    await createPermission('MEMBER_UPDATE');
    await createPermission('MEMBER_DISABLE');

    // CLIENT permissions
    await createPermission('CLIENT_READ');
    await createPermission('CLIENT_CREATE');
    await createPermission('CLIENT_UPDATE');
    await createPermission('CLIENT_BLOCK');
    await createPermission('CLIENT_UNBLOCK');

    // DEPARTMENT permissions
    await createPermission('DEPARTMENT_READ');
    await createPermission('DEPARTMENT_WRITE');

    // SYNC permissions
    await createPermission('SYNC_READ');
    await createPermission('SYNC_MANAGE');

    // AUDIT permissions
    await createPermission('AUDIT_READ');

    // SECURITY permissions
    await createPermission('SECURITY_READ');
    await createPermission('SECURITY_MANAGE');
    await createPermission('KEYS_MANAGE');
    await createPermission('JWKS_READ');

    // TOKEN/SESSION permissions
    await createPermission('TOKEN_REVOKE');
    await createPermission('SESSION_MANAGE');

    console.log('✓ Permissions seeding completed');
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
