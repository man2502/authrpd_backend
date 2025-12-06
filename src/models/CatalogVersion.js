module.exports = (sequelize, DataTypes) => {
  const CatalogVersion = sequelize.define(
    'CatalogVersion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      catalog_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at', // Map to snake_case column in database
      },
    },
    {
      tableName: 'catalog_versions',
      timestamps: false,
    }
  );

  return CatalogVersion;
};

