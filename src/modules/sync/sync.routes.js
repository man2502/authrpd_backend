const express = require('express');
const Joi = require('joi');
const router = express.Router();
const syncController = require('./sync.controller');
const { paramsValidator } = require('../../middlewares/schema.validator');
const { validate_sync_query } = require('../../helpers/validators');

// Allowed catalog names for sync endpoint
const allowedCatalogs = [
  'regions',
  'ministries',
  'organizations',
  'receiver_organizations',
  'classifier_economic',
  'classifier_purpose',
  'classifier_functional',
  'classifier_income',
  'banks',
  'bank_accounts',
  'fields',
  'documents',
  'classifier_fields',
  'classifier_documents',
];

// Public endpoints for RPD pull with validation
/**
 * @swagger
 * /catalogs/{name}:
 *   get:
 *     tags: [Sync]
 *     summary: Get catalog data by version
 *     description: Returns items for a catalog if client's version is behind. Empty items with up_to_date=true when no updates.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - regions
 *             - ministries
 *             - organizations
 *             - receiver_organizations
 *             - classifier_economic
 *             - classifier_purpose
 *             - classifier_functional
 *             - classifier_income
 *             - banks
 *             - bank_accounts
 *             - fields
 *             - documents
 *             - classifier_fields
 *             - classifier_documents
 *       - in: query
 *         name: version
 *         schema: { type: integer, minimum: 0 }
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *     responses:
 *       200:
 *         description: Catalog data (or empty if up to date)
 */
router.get(
  '/:name',
  paramsValidator(Joi.object({
    name: Joi.string().valid(...allowedCatalogs).required(),
  })),
  validate_sync_query(),
  syncController.getCatalogByVersion
);

module.exports = router;

