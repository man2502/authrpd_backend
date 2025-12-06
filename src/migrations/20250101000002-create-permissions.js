'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permissions');
  },
};

