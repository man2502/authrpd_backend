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

