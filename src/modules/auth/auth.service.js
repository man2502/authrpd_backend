const bcrypt = require('bcryptjs');
const { Member, Client } = require('../../models');
const { generateAccessToken, generateRefreshToken } = require('../security/tokens/token.service');
const {
  saveRefreshToken,
  findAndVerifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} = require('../security/tokens/refresh.repository');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');
const logger = require('../../config/logger');

/**
 * Аутентификация member
 * @param {string} username - имя пользователя
 * @param {string} password - пароль
 * @param {Object} metadata - метаданные запроса (ip, userAgent, deviceId)
 * @returns {Promise<Object>} - токены и данные пользователя
 */
async function loginMember(username, password, metadata = {}) {
  try {
    const member = await Member.findOne({
      where: { username, is_active: true },
      include: ['role'],
    });

    if (!member) {
      await logEvent({
        action: auditActions.LOGIN_FAIL,
        meta: { username, reason: 'User not found' },
      });
      throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, member.password_hash);
    if (!isValidPassword) {
      await logEvent({
        action: auditActions.LOGIN_FAIL,
        actorType: 'MEMBER',
        actorId: member.id,
        meta: { username, reason: 'Invalid password' },
      });
      throw new ApiError(401, 'Invalid credentials');
    }

    // Обновляем last_login_at
    await member.update({ last_login_at: new Date() });

    // Генерируем токены
    const accessToken = generateAccessToken('MEMBER', member.id, {
      role: member.role?.name,
      region_id: member.region_id,
    });

    const refreshToken = generateRefreshToken();
    await saveRefreshToken({
      token: refreshToken,
      userType: 'MEMBER',
      userId: member.id,
      ...metadata,
    });

    // Логируем успешный вход (audit + application log)
    await logEvent({
      action: auditActions.LOGIN_SUCCESS,
      actorType: 'MEMBER',
      actorId: member.id,
      meta: { username },
    });
    
    // Application log для мониторинга
    logger.info('Member authenticated successfully', {
      user_id: member.id,
      username: member.username,
      role: member.role?.name,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: member.id,
        username: member.username,
        fullname: member.fullname,
        role: member.role?.name,
        region_id: member.region_id,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Member login error:', error);
    throw new ApiError(500, 'Login failed');
  }
}

/**
 * Аутентификация client
 * @param {string} username - имя пользователя
 * @param {string} password - пароль
 * @param {Object} metadata - метаданные запроса
 * @returns {Promise<Object>} - токены и данные пользователя
 */
async function loginClient(username, password, metadata = {}) {
  try {
    const client = await Client.findOne({
      where: { username, is_active: true, isBlocked: false },
      include: ['organization', 'ministry', 'region'],
    });

    if (!client) {
      await logEvent({
        action: auditActions.LOGIN_FAIL,
        meta: { username, reason: 'User not found' },
      });
      throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, client.password_hash);
    if (!isValidPassword) {
      await logEvent({
        action: auditActions.LOGIN_FAIL,
        actorType: 'CLIENT',
        actorId: client.id,
        meta: { username, reason: 'Invalid password' },
      });
      throw new ApiError(401, 'Invalid credentials');
    }

    // Обновляем last_login_at
    await client.update({ lastLoginAt: new Date() });

    // Генерируем токены
    const accessToken = generateAccessToken('CLIENT', client.id, {
      organization_id: client.organization_id,
      region_id: client.region_id,
    });

    const refreshToken = generateRefreshToken();
    await saveRefreshToken({
      token: refreshToken,
      userType: 'CLIENT',
      userId: client.id,
      ...metadata,
    });

    // Логируем успешный вход
    await logEvent({
      action: auditActions.LOGIN_SUCCESS,
      actorType: 'CLIENT',
      actorId: client.id,
      meta: { username },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: client.id,
        username: client.username,
        fullname: client.fullname,
        organization_id: client.organization_id,
        region_id: client.region_id,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Client login error:', error);
    throw new ApiError(500, 'Login failed');
  }
}

/**
 * Обновление токенов
 * @param {string} refreshToken - refresh token
 * @param {Object} metadata - метаданные запроса
 * @returns {Promise<Object>} - новые токены
 */
async function refreshTokens(refreshToken, metadata = {}) {
  try {
    // Ищем токен в БД (проверяем оба типа пользователей)
    const { RefreshToken: RefreshTokenModel } = require('../security/tokens/refresh.repository');
    const bcrypt = require('bcryptjs');
    const { sequelize } = require('../../models');
    
    // Получаем все активные токены
    const tokens = await RefreshTokenModel.findAll({
      where: {
        revoked_at: null,
        expires_at: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']], // Sequelize will map to created_at column
      limit: 100, // Ограничиваем для производительности
    });

    let tokenRecord = null;
    let user = null;
    let userType = null;

    // Проверяем каждый токен
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token_hash);
      if (isValid) {
        tokenRecord = token;
        userType = token.user_type;
        
        if (userType === 'MEMBER') {
          user = await Member.findByPk(token.user_id, { include: ['role', 'region'] });
        } else if (userType === 'CLIENT') {
          user = await Client.findByPk(token.user_id, { include: ['organization', 'region'] });
        }
        break;
      }
    }

    if (!tokenRecord || !user) {
      await logEvent({
        action: auditActions.REFRESH_FAIL,
        meta: { reason: 'Invalid refresh token' },
      });
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Отзываем старый токен
    await revokeRefreshToken(tokenRecord.id);

    // Генерируем новые токены
    const additionalClaims = userType === 'MEMBER' && user.role
      ? { role: user.role.name, region_id: user.region_id }
      : { organization_id: user.organization_id, region_id: user.region_id };
    
    const accessToken = generateAccessToken(userType, user.id, additionalClaims);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken({
      token: newRefreshToken,
      userType,
      userId: user.id,
      ...metadata,
    });

    await logEvent({
      action: auditActions.REFRESH_SUCCESS,
      actorType: userType,
      actorId: user.id,
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Refresh token error:', error);
    throw new ApiError(500, 'Token refresh failed');
  }
}

/**
 * Выход пользователя
 * @param {string} refreshToken - refresh token для отзыва
 * @param {string} userType - тип пользователя
 * @param {number} userId - ID пользователя
 */
async function logout(refreshToken, userType, userId) {
  try {
    const tokenRecord = await findAndVerifyRefreshToken(refreshToken, userType, userId);
    if (tokenRecord) {
      await revokeRefreshToken(tokenRecord.id);
    }

    await logEvent({
      action: auditActions.LOGOUT,
      actorType: userType,
      actorId: userId,
    });
  } catch (error) {
    logger.error('Logout error:', error);
    // Не выбрасываем ошибку, так как выход должен быть идемпотентным
  }
}

/**
 * Получение текущего пользователя
 * @param {string} userType - тип пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<Object>} - данные пользователя
 */
async function getCurrentUser(userType, userId) {
  if (userType === 'MEMBER') {
    const member = await Member.findByPk(userId, {
      include: ['role', 'department', 'organization', 'region'],
    });
    if (!member) {
      throw new ApiError(404, 'User not found');
    }
    return {
      id: member.id,
      username: member.username,
      fullname: member.fullname,
      position: member.position,
      role: member.role?.name,
      region_id: member.region_id,
    };
  } else if (userType === 'CLIENT') {
    const client = await Client.findByPk(userId, {
      include: ['organization', 'ministry', 'region'],
    });
    if (!client) {
      throw new ApiError(404, 'User not found');
    }
    return {
      id: client.id,
      username: client.username,
      fullname: client.fullname,
      organization_id: client.organization_id,
      region_id: client.region_id,
    };
  }
  throw new ApiError(400, 'Invalid user type');
}

module.exports = {
  loginMember,
  loginClient,
  refreshTokens,
  logout,
  getCurrentUser,
};

