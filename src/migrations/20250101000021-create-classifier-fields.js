'use strict';

/**
 * Миграция для создания таблицы связей классификаторов с полями
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classifier_fields', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      economic_classifier_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'classifier_economic',
          key: 'code',
        },
      },
      field_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fields',
          key: 'id',
        },
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

    await queryInterface.addIndex('classifier_fields', ['economic_classifier_id']);
    await queryInterface.addIndex('classifier_fields', ['field_id']);
    await queryInterface.addIndex('classifier_fields', ['economic_classifier_id', 'field_id'], {
      unique: true,
      name: 'unique_classifier_field',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('classifier_fields');
  },
};

