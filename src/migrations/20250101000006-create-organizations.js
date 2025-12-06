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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organizations');
  },
};

