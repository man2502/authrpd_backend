'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
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
      organization_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'code',
        },
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
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

    await queryInterface.addIndex('departments', ['organization_id']);
    await queryInterface.addIndex('departments', ['parent_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('departments');
  },
};

