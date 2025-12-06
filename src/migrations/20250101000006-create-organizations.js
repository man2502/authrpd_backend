'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('organizations', {
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
      region_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'regions',
          key: 'code',
        },
      },
      ministry_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'ministries',
          key: 'code',
        },
      },
      parent_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'code',
        },
      },
      financing_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tax_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        // Sequelize will map to created_at column in DB thanks to underscored: true
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    await queryInterface.dropTable('organizations');
  },
};

