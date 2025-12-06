const express = require('express');
const router = express.Router();
const rbacController = require('./rbac.controller');
const { authGuard } = require('../../middlewares/auth.guard');

router.get('/roles', authGuard, rbacController.getRoles);
router.post('/roles', authGuard, rbacController.createRole);
router.put('/roles/:id', authGuard, rbacController.updateRole);
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
router.get('/roles/:id/permissions', authGuard, rbacController.getRolePermissions); // Best practice endpoint
router.get('/permissions', authGuard, rbacController.getPermissions);
router.post('/roles/:id/permissions', authGuard, rbacController.assignPermissions);

module.exports = router;

