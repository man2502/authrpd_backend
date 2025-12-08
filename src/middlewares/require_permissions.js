const { get_user_permissions } = require('../modules/rbac/services/permission.service');
const ApiError = require('../helpers/api.error');

/**
 * Permission Guard Middleware Factory
 * 
 * Creates Express middleware that checks if the authenticated user has required permissions.
 * 
 * Architecture:
 * - Uses req.user populated by auth_middleware (authGuard)
 * - Resolves user permissions via permission service (cached)
 * - Supports two modes:
 *   - 'every' (default): User must have ALL specified permissions
 *   - 'some': User must have AT LEAST ONE of the specified permissions
 * 
 * Access Rules:
 * - Requires req.user to be set (401 if missing)
 * - Only works for MEMBER user type (members have roles)
 * - Returns 403 if permission check fails
 * 
 * @param {...string} permissions - One or more permission names to check
 * @param {Object} options - Optional configuration
 * @param {string} options.mode - 'every' (default) or 'some' for permission matching
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Require ALL permissions
 * router.get('/admin/roles', authGuard, require_permissions('RBAC_MANAGE'), controller.list);
 * 
 * @example
 * // Require ANY permission
 * router.post('/catalogs/regions', authGuard, require_permissions('CATALOG_WRITE', { mode: 'some' }), controller.create);
 * 
 * @example
 * // Multiple permissions (ALL required by default)
 * router.delete('/users/:id', authGuard, require_permissions('USER_DELETE', 'USER_MANAGE'), controller.delete);
 */
function require_permissions(...permissions) {
  // Extract options if last argument is an object
  let options = { mode: 'every' };
  let permissionList = permissions;

  if (permissions.length > 0 && typeof permissions[permissions.length - 1] === 'object' && !Array.isArray(permissions[permissions.length - 1])) {
    options = { ...options, ...permissions.pop() };
    permissionList = permissions;
  }

  // Validate inputs
  if (permissionList.length === 0) {
    throw new Error('require_permissions: At least one permission must be specified');
  }

  if (options.mode !== 'every' && options.mode !== 'some') {
    throw new Error('require_permissions: mode must be "every" or "some"');
  }

  /**
   * Express middleware function
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      // Only members have roles and permissions
      // Clients don't have RBAC permissions (they have different access model)
      if (req.user.type !== 'MEMBER') {
        return next(new ApiError(403, 'Permission denied: Only members have role-based permissions'));
      }

      // Get user permissions (cached)
      const userPermissions = await get_user_permissions(req.user.id);

      // Convert to Set for O(1) lookup performance
      const userPermissionSet = new Set(userPermissions);

      // Check permissions based on mode
      let hasPermission = false;

      if (options.mode === 'every') {
        // User must have ALL required permissions
        hasPermission = permissionList.every((perm) => userPermissionSet.has(perm));
      } else {
        // User must have AT LEAST ONE required permission
        hasPermission = permissionList.some((perm) => userPermissionSet.has(perm));
      }

      if (!hasPermission) {
        const requiredPerms = permissionList.join(', ');
        const modeText = options.mode === 'every' ? 'all of' : 'at least one of';
        return next(
          new ApiError(
            403,
            `Permission denied: User must have ${modeText} the following permissions: ${requiredPerms}`
          )
        );
      }

      // Permission check passed, continue to next middleware
      next();
    } catch (error) {
      // Pass through ApiError instances
      if (error instanceof ApiError) {
        return next(error);
      }

      // Log unexpected errors but don't expose details to client
      // Error will be handled by error handler middleware
      next(error);
    }
  };
}

module.exports = require_permissions;
