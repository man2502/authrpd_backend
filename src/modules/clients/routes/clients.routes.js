const express = require('express');
const router = express.Router();
const clientsController = require('../clients.controller');
const { authGuard } = require('../../../middlewares/auth.guard');
const { validate_id_param, validate_query } = require('../../../helpers/validators');
const { paginationValidator } = require('../../../helpers/validators');
const require_permissions = require('../../../middlewares/require_permissions');
const schemaValidator = require('../../../middlewares/schema.validator');
const { createClientSchema, updateClientSchema } = require('../clients.schemas');

/**
 * Clients admin routes
 * Protected by CLIENT_* permissions
 */

/**
 * @swagger
 * /admin/clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Clients list }
 *   post:
 *     tags: [Clients]
 *     summary: Create new client
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Client created }
 */
router.get('/admin/clients', authGuard, require_permissions('CLIENT_READ'), validate_query(paginationValidator), clientsController.list_clients);
router.post('/admin/clients', authGuard, require_permissions('CLIENT_CREATE'), schemaValidator(createClientSchema), clientsController.create_client);

/**
 * @swagger
 * /admin/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get client by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Client details }
 *   put:
 *     tags: [Clients]
 *     summary: Update client
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Client updated }
 */
router.get('/admin/clients/:id', authGuard, validate_id_param(), require_permissions('CLIENT_READ'), clientsController.get_client);
router.put('/admin/clients/:id', authGuard, validate_id_param(), require_permissions('CLIENT_UPDATE'), schemaValidator(updateClientSchema), clientsController.update_client);

/**
 * @swagger
 * /admin/clients/{id}/block:
 *   put:
 *     tags: [Clients]
 *     summary: Block client
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Client blocked }
 * /admin/clients/{id}/unblock:
 *   put:
 *     tags: [Clients]
 *     summary: Unblock client
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Client unblocked }
 */
router.put('/admin/clients/:id/block', authGuard, validate_id_param(), require_permissions('CLIENT_BLOCK'), clientsController.block_client);
router.put('/admin/clients/:id/unblock', authGuard, validate_id_param(), require_permissions('CLIENT_UNBLOCK'), clientsController.unblock_client);

module.exports = router;
