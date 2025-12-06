'use strict';

/**
 * Seeder для организаций
 * Создает тестовые данные для таблицы organizations согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем ON CONFLICT для идемпотентности (PostgreSQL)
    await queryInterface.sequelize.query(`
      INSERT INTO organizations (code, title_tm, title_ru, region_id, ministry_id, financing_type, tax_code, is_active, created_at, updated_at)
      VALUES
        ('ORG001', 'Ahal hassahanasy', 'Ахалская больница', 'A', 'M01', 'LOCAL', '123456789', true, NOW(), NOW()),
        ('ORG002', 'Balkan mekdebi', 'Балканская школа', 'B', 'M02', 'CENTRAL', '987654321', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('organizations', null, {});
  },
};

