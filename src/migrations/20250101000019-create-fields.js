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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        // Sequelize will map to created_at column in DB thanks to underscored: true
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        // Sequelize will map to updated_at column in DB thanks to underscored: true
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        // Sequelize will map to deleted_at column in DB thanks to underscored: true
      },
    });

    await queryInterface.addIndex('fields', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('fields');
  },
};

