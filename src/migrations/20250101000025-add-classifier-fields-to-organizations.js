'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('organizations', 'classifier_purpose_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'classifier_purpose',
        key: 'code',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Ссылка на классификатор целевых расходов',
    });

    await queryInterface.addColumn('organizations', 'classifier_functional_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'classifier_functional',
        key: 'code',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Ссылка на классификатор функциональных расходов',
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('organizations', ['classifier_purpose_id'], {
      name: 'organizations_classifier_purpose_id_idx',
    });

    await queryInterface.addIndex('organizations', ['classifier_functional_id'], {
      name: 'organizations_classifier_functional_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('organizations', 'organizations_classifier_purpose_id_idx');
    await queryInterface.removeIndex('organizations', 'organizations_classifier_functional_id_idx');

    // Remove columns
    await queryInterface.removeColumn('organizations', 'classifier_purpose_id');
    await queryInterface.removeColumn('organizations', 'classifier_functional_id');
  },
};

