'use strict';

/**
 * Migration: Create rpd_instances table
 * 
 * This table stores RPD instance configurations for top-level regions only.
 * Sub-regions will use their parent region's RPD instance.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rpd_instances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique code for the RPD instance (e.g., "rpd_ahal", "rpd_balkan")',
      },
      region_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'References regions.code - MUST be a top region (parent_id IS NULL)',
        references: {
          model: 'regions',
          key: 'code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      audience: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'JWT audience claim (e.g., "rpd:ahal", "rpd:balkan")',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this RPD instance is currently active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('rpd_instances', ['code'], {
      unique: true,
      name: 'rpd_instances_code_unique',
    });

    await queryInterface.addIndex('rpd_instances', ['audience'], {
      unique: true,
      name: 'rpd_instances_audience_unique',
    });

    await queryInterface.addIndex('rpd_instances', ['region_id'], {
      name: 'rpd_instances_region_id_idx',
    });

    await queryInterface.addIndex('rpd_instances', ['is_active'], {
      name: 'rpd_instances_is_active_idx',
    });

    // Add constraint: region_id must reference a top region (parent_id IS NULL)
    // Note: This constraint is enforced at application level, but we document it here
    // PostgreSQL doesn't support conditional foreign keys easily, so we rely on application logic
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rpd_instances');
  },
};

