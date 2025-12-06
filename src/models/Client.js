module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    'Client',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      phone_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      organization_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ministry_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      region_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'clients',
      timestamps: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ['username'] },
        { unique: true, fields: ['phone'], where: { phone: { [sequelize.Sequelize.Op.ne]: null } } },
        { fields: ['organization_id', 'ministry_id', 'region_id'] },
        { fields: ['is_blocked'] },
      ],
    }
  );

  return Client;
};

