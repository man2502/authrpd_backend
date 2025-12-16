const express = require('express');
const router = express.Router();
const membersController = require('./members.controller');
const { authGuard } = require('../../middlewares/auth.guard');
const { validate_id_param, validate_query } = require('../../helpers/validators');
const { paginationValidator } = require('../../helpers/validators');
const require_permissions = require('../../middlewares/require_permissions');
const schemaValidator = require('../../middlewares/schema.validator');
const { createMemberSchema, updateMemberSchema } = require('./members.schemas');

/**
 * Members admin routes
 * Protected by MEMBER_* permissions
 */

/**
 * @swagger
 * /admin/members:
 *   get:
 *     tags: [Members]
 *     summary: List all members
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Members list }
 *   post:
 *     tags: [Members]
 *     summary: Create new member
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Member created }
 */
router.get('/admin/members', authGuard, require_permissions('MEMBER_READ'), validate_query(paginationValidator), membersController.list_members);
router.post('/admin/members', authGuard, require_permissions('MEMBER_CREATE'), schemaValidator(createMemberSchema), membersController.create_member);

/**
 * @swagger
 * /admin/members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Get member by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Member details }
 *   put:
 *     tags: [Members]
 *     summary: Update member
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Member updated }
 */
router.get('/admin/members/:id', authGuard, validate_id_param(), require_permissions('MEMBER_READ'), membersController.get_member);
router.put('/admin/members/:id', authGuard, validate_id_param(), require_permissions('MEMBER_UPDATE'), schemaValidator(updateMemberSchema), membersController.update_member);

/**
 * @swagger
 * /admin/members/{id}/disable:
 *   put:
 *     tags: [Members]
 *     summary: Disable member
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Member disabled }
 */
router.put('/admin/members/:id/disable', authGuard, validate_id_param(), require_permissions('MEMBER_DISABLE'), membersController.disable_member);

module.exports = router;
