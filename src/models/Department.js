module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      organization_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'departments',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['organization_id'] },
        { fields: ['parent_id'] },
      ],
    }
  );

  return Department;
};

