module.exports = (sequelize, DataTypes) => {
  const AuthAuditLog = sequelize.define(
    'AuthAuditLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      actor_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      target_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      target_id: {
        type: DataTypes.STRING, // Changed to STRING to match migration
        allowNull: true,
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'auth_audit_log',
      timestamps: false,
      indexes: [
        { fields: ['actor_type', 'actor_id'] },
        { fields: ['action'] },
        { fields: ['target_type', 'target_id'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return AuthAuditLog;
};

