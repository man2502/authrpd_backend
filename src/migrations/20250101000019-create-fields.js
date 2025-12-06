'use strict';

/**
 * Миграция для создания таблицы полей документов
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fields', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      title_tm: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title_ru: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_type: {
        type: Sequelize.ENUM('STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'TEXT'),
        allowNull: false,
        defaultValue: 'STRING',
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('fields', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('fields');
  },
};

