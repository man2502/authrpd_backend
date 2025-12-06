'use strict';

/**
 * Seeder для министерств
 * Создает тестовые данные для таблицы ministries согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем ON CONFLICT для идемпотентности (PostgreSQL)
    await queryInterface.sequelize.query(`
      INSERT INTO ministries (code, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        ('M01', 'Saglygy goraýyş', 'Здравоохранение', true, NOW(), NOW()),
        ('M02', 'Bilim', 'Образование', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ministries', null, {});
  },
};

