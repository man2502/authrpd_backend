'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fullname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      organization_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'organizations',
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
      region_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'regions',
          key: 'code',
        },
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('clients', ['organization_id', 'ministry_id', 'region_id']);
    await queryInterface.addIndex('clients', ['is_blocked']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  },
};

