const { Member, Role,  Organization, Region } = require('../../models');
const bcrypt = require('bcryptjs');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');

/**
 * Members Service
 * Handles business logic for member management
 */

/**
 * Get all members with pagination
 * @param {Object} options - Query options (page, limit, filters)
 * @returns {Promise<Object>} - Paginated members list
 */
async function getAllMembers(options = {}) {
  const { page = 1, limit = 20, is_active, role_id, region_id } = options;
  const offset = (page - 1) * limit;

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active;
  }
  if (role_id) {
    where.role_id = role_id;
  }
  if (region_id) {
    where.region_id = region_id;
  }

  const { count, rows } = await Member.findAndCountAll({
    where,
    include: [
      { model: Role, as: 'role', attributes: ['id', 'name', 'title_tm', 'title_ru'] },
      { model: Organization, as: 'organization', attributes: ['code', 'title_tm', 'title_ru'] },
      { model: Region, as: 'region', attributes: ['code', 'title_tm', 'title_ru'] },
    ],
    limit,
    offset,
    order: [['id', 'ASC']],
  });

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get member by ID
 * @param {number} id - Member ID
 * @returns {Promise<Object>} - Member data
 */
async function getMemberById(id) {
  const member = await Member.findByPk(id, {
    include: [
      { model: Role, as: 'role', attributes: ['id', 'name', 'title_tm', 'title_ru'] },
      { model: Organization, as: 'organization', attributes: ['code', 'title_tm', 'title_ru'] },
      { model: Region, as: 'region', attributes: ['code', 'title_tm', 'title_ru'] },
    ],
  });

  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  return member;
}

/**
 * Create new member
 * @param {Object} data - Member data
 * @returns {Promise<Object>} - Created member
 */
async function createMember(data) {
  // Check if username already exists
  const existing = await Member.findOne({ where: { username: data.username } });
  if (existing) {
    throw new ApiError(409, 'Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  const member = await Member.create({
    username: data.username,
    password_hash: passwordHash,
    fullname: data.fullname,
    position: data.position,
    phone: data.phone,
    email: data.email,
    role_id: data.role_id,
    organization_id: data.organization_id,
    region_id: data.region_id,
    is_active: data.is_active !== undefined ? data.is_active : true,
  });

  await logEvent({
    action: auditActions.MEMBER_CREATED,
    targetType: 'MEMBER',
    targetId: member.id,
    meta: { username: member.username },
  });

  return member;
}

/**
 * Update member
 * @param {number} id - Member ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated member
 */
async function updateMember(id, data) {
  const member = await Member.findByPk(id);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  // Check username uniqueness if changing
  if (data.username && data.username !== member.username) {
    const existing = await Member.findOne({ where: { username: data.username } });
    if (existing) {
      throw new ApiError(409, 'Username already exists');
    }
  }

  // Hash password if provided
  const updateData = { ...data };
  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
    delete updateData.password; // Remove plain password
  }

  await member.update(updateData);

  await logEvent({
    action: auditActions.MEMBER_UPDATED,
    targetType: 'MEMBER',
    targetId: id,
    meta: { updated_fields: Object.keys(data) },
  });

  return member;
}

/**
 * Disable member (soft delete via is_active)
 * @param {number} id - Member ID
 * @returns {Promise<Object>} - Updated member
 */
async function disableMember(id) {
  const member = await Member.findByPk(id);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  await member.update({ is_active: false });

  await logEvent({
    action: auditActions.MEMBER_DISABLED,
    targetType: 'MEMBER',
    targetId: id,
    meta: { username: member.username },
  });

  return member;
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  disableMember,
};
