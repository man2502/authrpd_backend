'use strict';

/**
 * Seeder для регионов
 * Создает тестовые данные для таблицы regions согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем ON CONFLICT для идемпотентности (PostgreSQL)
    await queryInterface.sequelize.query(`
      INSERT INTO regions (code, title_tm, title_ru, prefix_tm, prefix_ru, suffix_tm, suffix_ru, is_active, created_at, updated_at)
      VALUES
        ('A', 'Ahal', 'Ахал', 'A', 'А', '', '', true, NOW(), NOW()),
        ('B', 'Balkan', 'Балкан', 'B', 'Б', '', '', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('regions', null, {});
  },
};

