'use strict';

const { Bank, BankAccount } = require('../models');

/**
 * Seeder для банков и банковских счетов
 * Создает тестовые данные согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Banks - используем findOrCreate для идемпотентности
    const [bank] = await Bank.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        title_tm: 'Döwlet banky',
        title_ru: 'Госбанк',
        code_mfo: '390',
        code_bab: '01',
        region_id: '10',
        is_active: true,
      },
    });

    // Bank Accounts - используем findOrCreate для идемпотентности
    await BankAccount.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        name: 'Main budget account',
        account_number: '1230000000001',
        bank_id: bank.id,
        expense_type: 'BUDGET',
        organization_id: '1002',
        is_active: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await BankAccount.destroy({ where: {}, truncate: true, cascade: true });
    await Bank.destroy({ where: {}, truncate: true, cascade: true });
  },
};
