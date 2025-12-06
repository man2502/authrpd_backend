module.exports = (sequelize, DataTypes) => {
  const Ministry = sequelize.define(
    'Ministry',
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
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'ministries',
      timestamps: true,
      paranoid: true,
    }
  );

  return Ministry;
};

