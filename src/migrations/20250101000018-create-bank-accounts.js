'use strict';

/**
 * Миграция для создания таблицы банковских счетов
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bank_accounts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      account_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      bank_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'banks',
          key: 'id',
        },
      },
      expense_type: {
        type: Sequelize.ENUM('BUDGET', 'EXTRA_BUDGET', 'OTHER'),
        allowNull: true,
      },
      organization_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'code',
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        // Sequelize will map to created_at column in DB thanks to underscored: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        // Sequelize will map to updated_at column in DB thanks to underscored: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        // Sequelize will map to deleted_at column in DB thanks to underscored: true
      },
    });

    await queryInterface.addIndex('bank_accounts', ['bank_id']);
    await queryInterface.addIndex('bank_accounts', ['organization_id']);
    await queryInterface.addIndex('bank_accounts', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bank_accounts');
  },
};

