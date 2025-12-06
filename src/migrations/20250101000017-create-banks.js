'use strict';

/**
 * Миграция для создания таблицы банков
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('banks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title_tm: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title_ru: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      code_mfo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      code_bab: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      region_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'regions',
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('banks', ['region_id']);
    await queryInterface.addIndex('banks', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('banks');
  },
};

