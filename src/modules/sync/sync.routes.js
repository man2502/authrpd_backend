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
router.get(
  '/:name',
  paramsValidator(Joi.object({
    name: Joi.string().valid(...allowedCatalogs).required(),
  })),
  validate_sync_query(),
  syncController.getCatalogByVersion
);

module.exports = router;

