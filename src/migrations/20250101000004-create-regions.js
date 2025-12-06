'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('regions', {
      code: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      title_tm: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title_ru: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      prefix_tm: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      prefix_ru: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      suffix_tm: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      suffix_ru: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'regions',
          key: 'code',
        },
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('regions');
  },
};

