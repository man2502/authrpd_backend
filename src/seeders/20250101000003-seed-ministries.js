'use strict';

const fs = require('fs');
const path = require('path');
const { Ministry } = require('../models');

/**
 * Seeder для министерств
 * Загружает данные из JSON файла в папке data/
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dataDir = path.join(__dirname, 'data');
    const filePath = path.join(dataDir, 'ministries.json');

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ministries.json not found in ${dataDir}, skipping ministries seeding`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const ministries = JSON.parse(fileContent);

      if (!Array.isArray(ministries)) {
        throw new Error('ministries.json must contain a JSON array');
      }

      console.log(`Loading ${ministries.length} ministries from ministries.json`);

      // Используем findOrCreate для идемпотентности
      for (const ministryData of ministries) {
        await Ministry.findOrCreate({
          where: { code: ministryData.code },
          defaults: ministryData,
        });
      }

      console.log('Successfully seeded ministries');
    } catch (error) {
      console.error('Error loading ministries.json:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await Ministry.destroy({ where: {}, truncate: true, cascade: true });
  },
};
