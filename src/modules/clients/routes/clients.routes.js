const express = require('express');
const router = express.Router();
const clientsController = require('./clients.controller');
const { authGuard } = require('../../../middlewares/auth.guard');
const { validate_id_param } = require('../../../helpers/validators');
const require_permissions = require('../../../middlewares/require_permissions');

/**
 * Clients admin routes
 * Protected by CLIENT_* permissions
 */

// List all clients - requires CLIENT_READ
router.get('/admin/clients', authGuard, require_permissions('CLIENT_READ'), clientsController.list_clients);

// Get client by ID - requires CLIENT_READ
router.get('/admin/clients/:id', authGuard, validate_id_param(), require_permissions('CLIENT_READ'), clientsController.get_client);

// Create new client - requires CLIENT_CREATE
router.post('/admin/clients', authGuard, require_permissions('CLIENT_CREATE'), clientsController.create_client);

// Update client - requires CLIENT_UPDATE
router.put('/admin/clients/:id', authGuard, validate_id_param(), require_permissions('CLIENT_UPDATE'), clientsController.update_client);

// Block client - requires CLIENT_BLOCK
router.put('/admin/clients/:id/block', authGuard, validate_id_param(), require_permissions('CLIENT_BLOCK'), clientsController.block_client);

// Unblock client - requires CLIENT_UNBLOCK
router.put('/admin/clients/:id/unblock', authGuard, validate_id_param(), require_permissions('CLIENT_UNBLOCK'), clientsController.unblock_client);

module.exports = router;
