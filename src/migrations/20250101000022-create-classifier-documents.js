'use strict';

/**
 * Миграция для создания таблицы связей классификаторов с документами
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classifier_documents', {
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
      document_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id',
        },
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

    await queryInterface.addIndex('classifier_documents', ['economic_classifier_id']);
    await queryInterface.addIndex('classifier_documents', ['document_id']);
    await queryInterface.addIndex('classifier_documents', ['economic_classifier_id', 'document_id'], {
      unique: true,
      name: 'unique_classifier_document',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('classifier_documents');
  },
};

