/**
 * RPD Instance Model
 * 
 * Represents an RPD deployment for a top-level region.
 * Only top regions (regions without parent_id) should have RPD instances.
 * Sub-regions use their parent's RPD instance.
 */
module.exports = (sequelize, DataTypes) => {
  const RpdInstance = sequelize.define(
    'RpdInstance',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique code for the RPD instance (e.g., "rpd_ahal", "rpd_balkan")',
      },
      region_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'References regions.code - MUST be a top region (parent_id IS NULL)',
        references: {
          model: 'regions',
          key: 'code',
        },
      },
      audience: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'JWT audience claim (e.g., "rpd:ahal", "rpd:balkan")',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this RPD instance is currently active',
      },
    },
    {
      tableName: 'rpd_instances',
      timestamps: true,
      paranoid: false, // No soft deletes for RPD instances
      indexes: [
        { unique: true, fields: ['code'] },
        { unique: true, fields: ['audience'] },
        { fields: ['region_id'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return RpdInstance;
};

