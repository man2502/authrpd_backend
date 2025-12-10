'use strict';

const { Organization } = require('../models');

/**
 * Seeder для организаций
 * Создает тестовые данные для таблицы organizations согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем findOrCreate для идемпотентности
    const organizations = [
      {
        code: '1001',
        title_tm: 'Ahal hassahanasy',
        title_ru: 'Ахалская больница',
        region_id: '10',
        ministry_id: 'M01',
        financing_type: 'LOCAL',
        tax_code: '123456789',
        is_active: true,
      },
      {
        code: '1002',
        title_tm: 'Balkan mekdebi',
        title_ru: 'Балканская школа',
        region_id: '11',
        ministry_id: 'M02',
        financing_type: 'CENTRAL',
        tax_code: '987654321',
        is_active: true,
      },
    ];

    for (const orgData of organizations) {
      await Organization.findOrCreate({
        where: { code: orgData.code },
        defaults: orgData,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await Organization.destroy({ where: {}, truncate: true, cascade: true });
  },
};
