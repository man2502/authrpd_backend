'use strict';

/**
 * Миграция для создания таблицы типов документов
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
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

    await queryInterface.addIndex('documents', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents');
  },
};

