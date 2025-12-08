const { Client, Organization, Ministry, Region } = require('../../models');
const bcrypt = require('bcryptjs');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');

/**
 * Clients Service
 * Handles business logic for client management
 */

/**
 * Get all clients with pagination
 * @param {Object} options - Query options (page, limit, filters)
 * @returns {Promise<Object>} - Paginated clients list
 */
async function getAllClients(options = {}) {
  const { page = 1, limit = 20, is_active, is_blocked, organization_id, region_id } = options;
  const offset = (page - 1) * limit;

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active;
  }
  if (is_blocked !== undefined) {
    where.is_blocked = is_blocked;
  }
  if (organization_id) {
    where.organization_id = organization_id;
  }
  if (region_id) {
    where.region_id = region_id;
  }

  const { count, rows } = await Client.findAndCountAll({
    where,
    include: [
      { model: Organization, as: 'organization', attributes: ['code', 'title_tm', 'title_ru'] },
      { model: Ministry, as: 'ministry', attributes: ['code', 'title_tm', 'title_ru'] },
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
 * Get client by ID
 * @param {number} id - Client ID
 * @returns {Promise<Object>} - Client data
 */
async function getClientById(id) {
  const client = await Client.findByPk(id, {
    include: [
      { model: Organization, as: 'organization', attributes: ['code', 'title_tm', 'title_ru'] },
      { model: Ministry, as: 'ministry', attributes: ['code', 'title_tm', 'title_ru'] },
      { model: Region, as: 'region', attributes: ['code', 'title_tm', 'title_ru'] },
    ],
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  return client;
}

/**
 * Create new client
 * @param {Object} data - Client data
 * @returns {Promise<Object>} - Created client
 */
async function createClient(data) {
  // Check if username already exists
  const existing = await Client.findOne({ where: { username: data.username } });
  if (existing) {
    throw new ApiError(409, 'Username already exists');
  }

  // Check phone uniqueness if provided
  if (data.phone) {
    const existingPhone = await Client.findOne({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new ApiError(409, 'Phone number already exists');
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  const client = await Client.create({
    username: data.username,
    password_hash: passwordHash,
    fullname: data.fullname,
    phone: data.phone,
    email: data.email,
    phone_verified: data.phone_verified || false,
    email_verified: data.email_verified || false,
    organization_id: data.organization_id,
    ministry_id: data.ministry_id,
    region_id: data.region_id,
    is_active: data.is_active !== undefined ? data.is_active : true,
    is_blocked: data.is_blocked || false,
  });

  await logEvent({
    action: auditActions.CLIENT_CREATED,
    targetType: 'CLIENT',
    targetId: client.id,
    meta: { username: client.username },
  });

  return client;
}

/**
 * Update client
 * @param {number} id - Client ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated client
 */
async function updateClient(id, data) {
  const client = await Client.findByPk(id);
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  // Check username uniqueness if changing
  if (data.username && data.username !== client.username) {
    const existing = await Client.findOne({ where: { username: data.username } });
    if (existing) {
      throw new ApiError(409, 'Username already exists');
    }
  }

  // Check phone uniqueness if changing
  if (data.phone && data.phone !== client.phone) {
    const existingPhone = await Client.findOne({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new ApiError(409, 'Phone number already exists');
    }
  }

  // Hash password if provided
  const updateData = { ...data };
  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
    delete updateData.password; // Remove plain password
  }

  await client.update(updateData);

  await logEvent({
    action: auditActions.CLIENT_UPDATED,
    targetType: 'CLIENT',
    targetId: id,
    meta: { updated_fields: Object.keys(data) },
  });

  return client;
}

/**
 * Block client
 * @param {number} id - Client ID
 * @returns {Promise<Object>} - Updated client
 */
async function blockClient(id) {
  const client = await Client.findByPk(id);
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  await client.update({ is_blocked: true });

  await logEvent({
    action: auditActions.CLIENT_BLOCKED,
    targetType: 'CLIENT',
    targetId: id,
    meta: { username: client.username },
  });

  return client;
}

/**
 * Unblock client
 * @param {number} id - Client ID
 * @returns {Promise<Object>} - Updated client
 */
async function unblockClient(id) {
  const client = await Client.findByPk(id);
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  await client.update({ is_blocked: false });

  await logEvent({
    action: auditActions.CLIENT_UNBLOCKED,
    targetType: 'CLIENT',
    targetId: id,
    meta: { username: client.username },
  });

  return client;
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  blockClient,
  unblockClient,
};
