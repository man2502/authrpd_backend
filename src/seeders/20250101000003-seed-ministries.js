'use strict';

const { Ministry } = require('../models');

/**
 * Seeder для министерств
 * Создает тестовые данные для таблицы ministries согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем findOrCreate для идемпотентности
    const ministries = [
      {
        code: 'M01',
        title_tm: 'Saglygy goraýyş',
        title_ru: 'Здравоохранение',
        is_active: true,
      },
      {
        code: 'M02',
        title_tm: 'Bilim',
        title_ru: 'Образование',
        is_active: true,
      },
    ];

    for (const ministryData of ministries) {
      await Ministry.findOrCreate({
        where: { code: ministryData.code },
        defaults: ministryData,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await Ministry.destroy({ where: {}, truncate: true, cascade: true });
  },
};
