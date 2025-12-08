const express = require('express');
const router = express.Router();
const rbacController = require('./rbac.controller');
const { authGuard } = require('../../middlewares/auth.guard');
const { validate_id_param } = require('../../helpers/validators');
const require_permissions = require('../../middlewares/require_permissions');

// RBAC admin routes - require RBAC_MANAGE permission
/**
 * @swagger
 * /admin/roles:
 *   get:
 *     tags: [RBAC]
 *     summary: List roles
 *     security: [ { bearerAuth: [] } ]
 *   post:
 *     tags: [RBAC]
 *     summary: Create role
 *     security: [ { bearerAuth: [] } ]
 * /admin/roles/{id}:
 *   put:
 *     tags: [RBAC]
 *     summary: Update role
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 * /admin/roles/{id}/permissions:
 *   get:
 *     tags: [RBAC]
 *     summary: Get permissions for a role
 *     security: [ { bearerAuth: [] } ]
 *   post:
 *     tags: [RBAC]
 *     summary: Assign permissions to role
 *     security: [ { bearerAuth: [] } ]
 * /admin/permissions:
 *   get:
 *     tags: [RBAC]
 *     summary: List permissions
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/roles', authGuard, require_permissions('RBAC_MANAGE'), rbacController.getRoles);
router.post('/roles', authGuard, require_permissions('RBAC_MANAGE'), rbacController.createRole);
router.put('/roles/:id', authGuard, validate_id_param(), require_permissions('RBAC_MANAGE'), rbacController.updateRole);
/**
 * @swagger
 * /rbac/roles/{id}/permissions:
 *   get:
 *     tags: [RBAC]
 *     summary: Get permissions for a role
 *     description: |
 *       Retrieve all permissions assigned to a specific role.
 *       Requires authentication with appropriate permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 role_id: 1
 *                 role_name: ADMIN
 *                 permissions:
 *                   - id: 1
 *                     code: USER_CREATE
 *                     name: Create User
 *                   - id: 2
 *                     code: USER_UPDATE
 *                     name: Update User
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data:
 *                 error_code: 404
 *                 error_msg: Role not found
 */
router.get('/roles/:id/permissions', authGuard, validate_id_param(), require_permissions('RBAC_MANAGE'), rbacController.getRolePermissions); // Best practice endpoint
router.get('/permissions', authGuard, require_permissions('RBAC_READ'), rbacController.getPermissions);
router.post('/roles/:id/permissions', authGuard, validate_id_param(), require_permissions('RBAC_MANAGE'), rbacController.assignPermissions);

module.exports = router;

