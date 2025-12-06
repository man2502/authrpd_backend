module.exports = (sequelize, DataTypes) => {
  const AuthAuditLog = sequelize.define(
    'AuthAuditLog',
    {
      id: {
        type: DataTypes.BIGINT, // Changed to BIGINT to match BIGSERIAL in migration
        primaryKey: true,
        autoIncrement: true,
      },
      actor_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actor_id: {
        type: DataTypes.BIGINT, // Changed to BIGINT to match migration
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
        defaultValue: DataTypes.NOW, // Use DataTypes.NOW for Sequelize default
      },
    },
    {
      tableName: 'auth_audit_log',
      timestamps: false,
      // Note: Indexes are managed by migration for partitioned tables
      // Indexes are created per partition in the migration script
      // Do not define indexes here to avoid conflicts with existing indexes
      indexes: [],
    }
  );

  return AuthAuditLog;
};

