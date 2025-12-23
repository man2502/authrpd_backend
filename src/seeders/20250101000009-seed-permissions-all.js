'use strict';

const { Permission } = require('../models');
const fs = require('fs');
const path = require('path');
/**
 * Seeder для всех разрешений (permissions) системы AuthRPD
 * Создает полный набор разрешений согласно ТЗ v2
 * 
 * Использует findOrCreate для идемпотентности (можно запускать многократно)
 * Sequelize автоматически преобразует camelCase в snake_case для БД
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dataDir = path.join(__dirname, 'data');

    /**
    * Helper function to load and seed classifiers from JSON file
    * @param {string} filename - Name of the JSON file (e.g., 'classifier_economic.json')
    * @param {Model} Model - Sequelize model class
    * @param {string} classifierName - Name for logging purposes
    */

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
    /**
    * Helper function to load and seed classifiers from JSON file
    * @param {string} filename - Name of the JSON file (e.g., 'classifier_economic.json')
    * @param {Model} Model - Sequelize model class
    * @param {string} classifierName - Name for logging purposes
    */
    async function seedFromJson(filename, classifierName) {
      const filePath = path.join(dataDir, filename);

      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: ${filename} not found in ${dataDir}, skipping ${classifierName} seeding`);
        return;
      }

      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const permissions = JSON.parse(fileContent);

        if (!Array.isArray(permissions)) {
          throw new Error(`${filename} must contain a JSON array`);
        }

        console.log(`Loading ${permissions.length} ${classifierName} permissions from ${filename}`);

        for (const permission of permissions) {
          await createPermission(permission.name);
        }

        console.log(`Successfully seeded ${classifierName} permissions`);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        throw error;
      }
    }
    await seedFromJson('permissions.json', 'permissions');

    console.log('✓ Permissions seeding completed');
  },

  async down(queryInterface, Sequelize) {
    // Remove all permissions created by this seeder
    await Permission.destroy({
      where: {

      },
    });
  },
};
