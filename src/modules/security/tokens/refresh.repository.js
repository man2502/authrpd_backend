const sequelize = require('../../../config/db');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const config = require('../../../config/env');

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_type: {
      type: DataTypes.ENUM('MEMBER', 'CLIENT'),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING,
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
  }
);

/**
 * Сохраняет refresh token
 * @param {Object} data - данные токена
 * @returns {Promise<Object>} - сохраненный токен
 */
async function saveRefreshToken(data) {
  const tokenHash = await bcrypt.hash(data.token, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.security.refreshTtlDays);

  return await RefreshToken.create({
    user_type: data.userType,
    user_id: data.userId,
    token_hash: tokenHash,
    device_id: data.deviceId || null,
    ip: data.ip || null,
    user_agent: data.userAgent || null,
    expires_at: expiresAt,
  });
}

/**
 * Находит и проверяет refresh token
 * @param {string} token - токен
 * @param {string} userType - тип пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<Object|null>} - найденный токен или null
 */
async function findAndVerifyRefreshToken(token, userType, userId) {
  const tokens = await RefreshToken.findAll({
    where: {
      user_type: userType,
      user_id: userId,
      revoked_at: null,
      expires_at: {
        [sequelize.Sequelize.Op.gt]: new Date(),
      },
    },
    order: [['created_at', 'DESC']],
    limit: 10, // Проверяем последние 10 токенов
  });

  for (const tokenRecord of tokens) {
    const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
    if (isValid) {
      return tokenRecord;
    }
  }

  return null;
}

/**
 * Отзывает refresh token
 * @param {number} tokenId - ID токена
 */
async function revokeRefreshToken(tokenId) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { id: tokenId } }
  );
}

/**
 * Отзывает все токены пользователя
 * @param {string} userType - тип пользователя
 * @param {number} userId - ID пользователя
 */
async function revokeAllUserTokens(userType, userId) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    {
      where: {
        user_type: userType,
        user_id: userId,
        revoked_at: null,
      },
    }
  );
}

module.exports = {
  RefreshToken,
  saveRefreshToken,
  findAndVerifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};

