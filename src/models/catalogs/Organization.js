module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    'Organization',
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      region_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ministry_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      financing_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'organizations',
      timestamps: true,
      paranoid: true,
    }
  );

  return Organization;
};

