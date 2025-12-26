/**
 * Example: Login Endpoint Using RPD Access Token
 * 
 * This demonstrates how to use the issueAccessToken function in the login flow.
 * 
 * The key difference from standard login:
 * - Uses issueAccessToken() instead of generateAccessToken()
 * - Automatically resolves sub-regions to parent regions
 * - Sets correct RPD audience based on user's region hierarchy
 */

const { issueAccessToken } = require('../modules/security/tokens/token.service');
const { generateRefreshToken } = require('../modules/security/tokens/token.service');
const { saveRefreshToken } = require('../modules/security/tokens/refresh.repository');
const { Member, Client } = require('../models');
const { get_user_permissions } = require('../modules/rbac/services/permission.service');
const { logEvent, auditActions } = require('../modules/audit/audit.service');
const ApiError = require('../helpers/api.error');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');

/**
 * Example: Member login with RPD token
 * 
 * This function replaces the standard loginMember in auth.service.js
 * to use RPD-specific token issuance.
 */
async function loginMemberRpd(username, password, metadata = {}) {
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

    // Update last login
    await member.update({ lastLoginAt: new Date() });

    // Issue RPD access token
    // This automatically resolves region hierarchy and sets correct audience
    const accessToken = await issueAccessToken(
      {
        id: member.id,
        role: member.role?.name || null,
        region_id: member.region_id,
        organization_id: member.organization_id,
        fullname: member.fullname,
      },
      'MEMBER'
    );

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    await saveRefreshToken({
      token: refreshToken,
      userType: 'MEMBER',
      userId: member.id,
      ...metadata,
    });

    // Log successful login
    await logEvent({
      action: auditActions.LOGIN_SUCCESS,
      actorType: 'MEMBER',
      actorId: member.id,
      meta: { username, region_id: member.region_id },
    });

    logger.info('Member authenticated with RPD token', {
      user_id: member.id,
      username: member.username,
      region_id: member.region_id,
    });

    const permissions = await get_user_permissions(member.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: member.id,
        username: member.username,
        fullname: member.fullname,
        role: member.role?.name,
        region_id: member.region_id,
        permissions,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Member login error (RPD):', error);
    throw new ApiError(500, 'Login failed');
  }
}

/**
 * Example: Client login with RPD token
 */
async function loginClientRpd(username, password, metadata = {}) {
  try {
    const client = await Client.findOne({
      where: { username, is_active: true, is_blocked: false },
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

    await client.update({ lastLoginAt: new Date() });

    // Issue RPD access token
    const accessToken = await issueAccessToken(
      {
        id: client.id,
        role_id: null, // Clients may not have role_id
        region_id: client.region_id,
      },
      'CLIENT'
    );

    const refreshToken = generateRefreshToken();
    await saveRefreshToken({
      token: refreshToken,
      userType: 'CLIENT',
      userId: client.id,
      ...metadata,
    });

    await logEvent({
      action: auditActions.LOGIN_SUCCESS,
      actorType: 'CLIENT',
      actorId: client.id,
      meta: { username, region_id: client.region_id },
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
    logger.error('Client login error (RPD):', error);
    throw new ApiError(500, 'Login failed');
  }
}

/**
 * Example Token Payloads Generated by issueAccessToken:
 * 
 * 1. Top Region Member (member.region_id = 'AHAL')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:123",
 *   "aud": "rpd:ahal",              // Audience from RPD instance for AHAL region
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440000",
 *   "role_id": 5,
 *   "region_id": "AHAL"              // Top region ID (same as user's region)
 * }
 * 
 * 2. Sub-Region Member (member.region_id = 'ASGABAT_CITY', parent: 'AHAL')
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:456",
 *   "aud": "rpd:ahal",               // Uses parent region's RPD audience
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440001",
 *   "role_id": 5,
 *   "region_id": "AHAL",             // Top region ID (resolved from ASGABAT_CITY)
 *   "sub_region_id": "ASGABAT_CITY"  // Original user region
 * }
 * 
 * 3. Nested Sub-Region Member (member.region_id = 'DISTRICT_1', parent chain: DISTRICT_1 -> ASGABAT_CITY -> AHAL)
 * {
 *   "iss": "AUTHRPD",
 *   "sub": "MEMBER:789",
 *   "aud": "rpd:ahal",               // Uses top-most parent's RPD audience
 *   "iat": 1704067200,
 *   "exp": 1704068400,
 *   "jti": "550e8400-e29b-41d4-a716-446655440002",
 *   "role_id": 5,
 *   "region_id": "AHAL",             // Top region ID (resolved up the hierarchy)
 *   "sub_region_id": "DISTRICT_1"    // Original user region
 * }
 */

module.exports = {
  loginMemberRpd,
  loginClientRpd,
};

