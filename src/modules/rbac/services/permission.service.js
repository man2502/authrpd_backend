const { Member, Role, Permission, RolePermission } = require('../../../models');
const { cacheData } = require('../../../helpers/cache.helper');
const ApiError = require('../../../helpers/api.error');

/**
 * Permission Service
 * 
 * Handles permission resolution for users based on their roles.
 * Implements caching to avoid database queries on every request.
 * 
 * Architecture:
 * - Members have a single role_id (can be extended to multiple roles later)
 * - Permissions are resolved via: members.role_id -> roles -> role_permission -> permissions
 * - Results are cached per user with TTL to reduce DB load
 */

/**
 * Default TTL for user permissions cache (10-20 minutes as suggested)
 * 600 seconds = 10 minutes
 */
const USER_PERMISSIONS_TTL = 600;

/**
 * Gets all permissions for a user by their user ID
 * 
 * Resolves permissions through the role hierarchy:
 * 1. Load member by user_id
 * 2. Get role_id from member
 * 3. Load role with permissions via join
 * 4. Extract unique permission names
 * 
 * Results are cached using key: user_permissions:${user_id}
 * Cache TTL: 600 seconds (10 minutes)
 * 
 * @param {number} user_id - The member's user ID
 * @returns {Promise<Array<string>>} - Array of unique permission names (strings)
 * @throws {ApiError} - If user is not found or is not a member
 * 
 * @example
 * const permissions = await get_user_permissions(123);
 * // Returns: ['RBAC_MANAGE', 'CATALOG_WRITE', 'CATALOG_READ']
 */
async function get_user_permissions(user_id) {
  const cacheKey = `user_permissions:${user_id}`;

  return await cacheData(
    cacheKey,
    async () => {
      // Load member with role and permissions
      const member = await Member.findByPk(user_id, {
        include: [
          {
            model: Role,
            as: 'role',
            required: false, // LEFT JOIN in case role_id is null
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }, // Don't include join table attributes
                where: { is_active: true }, // Only active permissions
                required: false,
              },
            ],
          },
        ],
      });

      if (!member) {
        throw new ApiError(404, 'User not found');
      }

      // If member has no role, return empty array
      if (!member.role || !member.role_id) {
        return [];
      }

      // Extract unique permission names
      // Filter out null/undefined and ensure uniqueness
      const permissionNames = (member.role.permissions || [])
        .map((p) => p.name)
        .filter((name) => name != null);

      // Return unique array (Set removes duplicates)
      return [...new Set(permissionNames)];
    },
    USER_PERMISSIONS_TTL
  );
}

/**
 * Get all permissions for a given role id.
 * Returns array of permission names.
 *
 * @param {number} role_id
 * @returns {Promise<string[]>}
 */
async function get_role_permissions(role_id) {
  const cacheKey = `role_permissions:${role_id}`;
  return await cacheData(
    cacheKey,
    async () => {
      const role = await Role.findByPk(role_id, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const permissionNames = (role.permissions || [])
        .map((p) => p.name)
        .filter((name) => name != null);
      return [...new Set(permissionNames)];
    },
    USER_PERMISSIONS_TTL
  );
}


module.exports = {
  get_user_permissions,
  get_role_permissions,
};
