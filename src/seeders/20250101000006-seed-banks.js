'use strict';

/**
 * Seeder для банков и банковских счетов
 * Создает тестовые данные согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Banks - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(`
      INSERT INTO banks (id, title_tm, title_ru, code_mfo, code_bab, region_id, is_active, created_at, updated_at)
      VALUES
        (1, 'Döwlet banky', 'Госбанк', '390', '01', 'A', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Bank Accounts - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(`
      INSERT INTO bank_accounts (id, name, account_number, bank_id, expense_type, organization_id, is_active, created_at, updated_at)
      VALUES
        (1, 'Main budget account', '1230000000001', 1, 'BUDGET', 'ORG001', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('bank_accounts', null, {});
    await queryInterface.bulkDelete('banks', null, {});
  },
};

