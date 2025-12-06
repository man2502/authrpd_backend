'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_audit_log', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      actor_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('auth_audit_log', ['actor_type', 'actor_id']);
    await queryInterface.addIndex('auth_audit_log', ['action']);
    await queryInterface.addIndex('auth_audit_log', ['target_type', 'target_id']);
    await queryInterface.addIndex('auth_audit_log', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_audit_log');
  },
};

