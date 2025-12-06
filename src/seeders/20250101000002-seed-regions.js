'use strict';

const { Region } = require('../models');

/**
 * Seeder для регионов
 * Создает тестовые данные для таблицы regions согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем findOrCreate для идемпотентности
    const regions = [
      {
        code: 'A',
        title_tm: 'Ahal',
        title_ru: 'Ахал',
        prefix_tm: 'A',
        prefix_ru: 'А',
        suffix_tm: '',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: 'B',
        title_tm: 'Balkan',
        title_ru: 'Балкан',
        prefix_tm: 'B',
        prefix_ru: 'Б',
        suffix_tm: '',
        suffix_ru: '',
        is_active: true,
      },
    ];

    for (const regionData of regions) {
      await Region.findOrCreate({
        where: { code: regionData.code },
        defaults: regionData,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await Region.destroy({ where: {}, truncate: true, cascade: true });
  },
};
