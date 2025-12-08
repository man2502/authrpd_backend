const express = require('express');
const router = express.Router();
const membersController = require('./members.controller');
const { authGuard } = require('../../../middlewares/auth.guard');
const { validate_id_param } = require('../../../helpers/validators');
const require_permissions = require('../../../middlewares/require_permissions');

/**
 * Members admin routes
 * Protected by MEMBER_* permissions
 */

// List all members - requires MEMBER_READ
router.get('/admin/members', authGuard, require_permissions('MEMBER_READ'), membersController.list_members);

// Get member by ID - requires MEMBER_READ
router.get('/admin/members/:id', authGuard, validate_id_param(), require_permissions('MEMBER_READ'), membersController.get_member);

// Create new member - requires MEMBER_CREATE
router.post('/admin/members', authGuard, require_permissions('MEMBER_CREATE'), membersController.create_member);

// Update member - requires MEMBER_UPDATE
router.put('/admin/members/:id', authGuard, validate_id_param(), require_permissions('MEMBER_UPDATE'), membersController.update_member);

// Disable member - requires MEMBER_DISABLE
router.put('/admin/members/:id/disable', authGuard, validate_id_param(), require_permissions('MEMBER_DISABLE'), membersController.disable_member);

module.exports = router;
