const Joi = require('joi');
const { codeValidator } = require('../../helpers/validators');

/**
 * Catalog Schema Validators
 * Validates request bodies for catalog endpoints
 */

// Common validators
const titleTmSchema = Joi.string().trim().min(1).max(255).required()
  .messages({
    'string.base': 'Title (TM) must be a string',
    'string.empty': 'Title (TM) is required',
    'string.min': 'Title (TM) must be at least 1 character',
    'string.max': 'Title (TM) must not exceed 255 characters',
    'any.required': 'Title (TM) is required',
  });

const titleRuSchema = Joi.string().trim().min(1).max(255).required()
  .messages({
    'string.base': 'Title (RU) must be a string',
    'string.empty': 'Title (RU) is required',
    'string.min': 'Title (RU) must be at least 1 character',
    'string.max': 'Title (RU) must not exceed 255 characters',
    'any.required': 'Title (RU) is required',
  });

/**
 * Region Schemas
 */
const createRegionSchema = Joi.object({
  code: codeValidator,
  title_tm: titleTmSchema,
  title_ru: titleRuSchema,
  prefix_tm: Joi.string().trim().max(50).allow(null, '').optional(),
  prefix_ru: Joi.string().trim().max(50).allow(null, '').optional(),
  suffix_tm: Joi.string().trim().max(50).allow(null, '').optional(),
  suffix_ru: Joi.string().trim().max(50).allow(null, '').optional(),
  parent_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

const updateRegionSchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).optional(),
  title_ru: Joi.string().trim().min(1).max(255).optional(),
  prefix_tm: Joi.string().trim().max(50).allow(null, '').optional(),
  prefix_ru: Joi.string().trim().max(50).allow(null, '').optional(),
  suffix_tm: Joi.string().trim().max(50).allow(null, '').optional(),
  suffix_ru: Joi.string().trim().max(50).allow(null, '').optional(),
  parent_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Ministry Schemas
 */
const createMinistrySchema = Joi.object({
  code: codeValidator,
  title_tm: titleTmSchema,
  title_ru: titleRuSchema,
  is_active: Joi.boolean().optional(),
});

const updateMinistrySchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).optional(),
  title_ru: Joi.string().trim().min(1).max(255).optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Organization Schemas
 */
const createOrganizationSchema = Joi.object({
  code: codeValidator,
  title_tm: titleTmSchema,
  title_ru: titleRuSchema,
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  ministry_id: Joi.string().trim().max(50).allow(null, '').optional(),
  parent_id: Joi.string().trim().max(50).allow(null, '').optional(),
  financing_type: Joi.string().trim().max(50).allow(null, '').optional(),
  tax_code: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

const updateOrganizationSchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).optional(),
  title_ru: Joi.string().trim().min(1).max(255).optional(),
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  ministry_id: Joi.string().trim().max(50).allow(null, '').optional(),
  parent_id: Joi.string().trim().max(50).allow(null, '').optional(),
  financing_type: Joi.string().trim().max(50).allow(null, '').optional(),
  tax_code: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Classifier Schemas (generic for all classifiers)
 */
const createClassifierSchema = Joi.object({
  code: codeValidator,
  title_tm: titleTmSchema,
  title_ru: titleRuSchema,
  is_active: Joi.boolean().optional(),
});

const updateClassifierSchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).optional(),
  title_ru: Joi.string().trim().min(1).max(255).optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Bank Schemas
 */
const createBankSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Bank name must be a string',
      'string.empty': 'Bank name is required',
      'string.min': 'Bank name must be at least 1 character',
      'string.max': 'Bank name must not exceed 255 characters',
      'any.required': 'Bank name is required',
    }),
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

const updateBankSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Bank Account Schemas
 */
const createBankAccountSchema = Joi.object({
  account_number: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.base': 'Account number must be a string',
      'string.empty': 'Account number is required',
      'any.required': 'Account number is required',
    }),
  bank_id: Joi.number().integer().positive().required(),
  organization_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

const updateBankAccountSchema = Joi.object({
  account_number: Joi.string().trim().min(1).max(100).optional(),
  bank_id: Joi.number().integer().positive().optional(),
  organization_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Field Schemas
 */
const createFieldSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Field name must be a string',
      'string.empty': 'Field name is required',
      'any.required': 'Field name is required',
    }),
  is_active: Joi.boolean().optional(),
});

const updateFieldSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  is_active: Joi.boolean().optional(),
});

/**
 * Document Schemas
 */
const createDocumentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Document name must be a string',
      'string.empty': 'Document name is required',
      'any.required': 'Document name is required',
    }),
  is_active: Joi.boolean().optional(),
});

const updateDocumentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = {
  // Regions
  createRegionSchema,
  updateRegionSchema,
  // Ministries
  createMinistrySchema,
  updateMinistrySchema,
  // Organizations
  createOrganizationSchema,
  updateOrganizationSchema,
  // Classifiers (generic - use for all classifier types)
  createClassifierSchema,
  updateClassifierSchema,
  // Banks
  createBankSchema,
  updateBankSchema,
  // Bank Accounts
  createBankAccountSchema,
  updateBankAccountSchema,
  // Fields
  createFieldSchema,
  updateFieldSchema,
  // Documents
  createDocumentSchema,
  updateDocumentSchema,
};
