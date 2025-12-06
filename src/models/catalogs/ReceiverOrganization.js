module.exports = (sequelize, DataTypes) => {
  const ReceiverOrganization = sequelize.define(
    'ReceiverOrganization',
    {
      taxcode: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name_tm: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name_ru: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'receiver_organizations',
      timestamps: true,
      paranoid: true,
    }
  );

  return ReceiverOrganization;
};

