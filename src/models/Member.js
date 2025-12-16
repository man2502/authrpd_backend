module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define(
    'Member',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      organization_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // top region should be ,
      region_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'members',
      timestamps: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ['username'] },
        { fields: ['role_id'] },
        { fields: ['organization_id'] },
        { fields: ['region_id'] },
      ],
    }
  );

  return Member;
};

