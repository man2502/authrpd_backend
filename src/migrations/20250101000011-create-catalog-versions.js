'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('catalog_versions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      catalog_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        // Sequelize will map to updated_at column in DB thanks to underscored: true
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('catalog_versions');
  },
};

