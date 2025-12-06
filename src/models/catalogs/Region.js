module.exports = (sequelize, DataTypes) => {
  const Region = sequelize.define(
    'Region',
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
      prefix_tm: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      prefix_ru: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      suffix_tm: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      suffix_ru: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'regions',
      timestamps: true,
      paranoid: true,
    }
  );

  return Region;
};

