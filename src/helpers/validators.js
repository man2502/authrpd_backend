const Joi = require('joi');
const { paramsValidator, queryValidator } = require('../middlewares/schema.validator');

/**
 * Reusable Joi Validators and Validation Middleware
 * 
 * Provides common validation patterns used throughout the AuthRPD API.
 * These validators ensure consistency and reduce code duplication.
 * 
 * Usage:
 * - Use Joi schemas directly in schemaValidator() for request body validation
 * - Use validate_id_param() middleware for URL parameter validation
 * - Use validate_query() middleware for query parameter validation
 */

/**
 * ID Validator Schema
 * 
 * Validates database ID fields (integer, positive, required).
 * Used for route parameters like /users/:id, /roles/:id
 * 
 * @type {Joi.NumberSchema}
 */
const idValidator = Joi.number().integer().positive().required()
  .messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required',
  });

/**
 * Code Validator Schema
 * 
 * Validates catalog codes and other code fields.
 * Rules: uppercase letters and numbers, 1-50 characters.
 * 
 * @type {Joi.StringSchema}
 */
const codeValidator = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[0-9]+$/)
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.base': 'Code must be a string',
    'string.pattern.base': 'Code must contain only numbers',
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 50 characters',
    'any.required': 'Code is required',
  });

/**
 * Pagination Validator Schema
 * 
 * Validates pagination query parameters.
 * Used for list endpoints with pagination support.
 * 
 * @type {Joi.ObjectSchema}
 */
const paginationValidator = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  sort_by: Joi.string().trim().optional()
    .messages({
      'string.base': 'Sort by must be a string',
    }),
  sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
    .messages({
      'any.only': 'Sort order must be either ASC or DESC',
    }),
});

/**
 * Lang Validator Schema
 *
 * Validates language selection and localization preference for catalog endpoints.
 * 
 * Parameters:
 * - lang: Language code ('tm' or 'ru'), defaults to 'tm'
 * - localized: Boolean flag to control localization (true = single title field, false = both title_tm and title_ru)
 * - is_active: Boolean flag to filter by active status (true = only active, false = only inactive, undefined = all)
 */
const langQueryValidator = Joi.object({
  lang: Joi.string().valid('tm', 'ru').default('tm')
    .messages({
      'any.only': 'lang must be either tm or ru',
      'string.base': 'lang must be a string',
    }),
  localized: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'localized must be a boolean',
    }),
  is_active: Joi.boolean().optional()
    .messages({
      'boolean.base': 'is_active must be a boolean',
    }),
});

/**
 * Sync Query Validator Schema
 *
 * Validates sync query parameters: optional version, lang, and include_deleted.
 */
const syncQueryValidator = Joi.object({
  version: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'version must be a number',
      'number.integer': 'version must be an integer',
      'number.min': 'version must be 0 or greater',
    }),
  lang: Joi.string().valid('tm', 'ru').default('tm')
    .messages({
      'any.only': 'lang must be either tm or ru',
      'string.base': 'lang must be a string',
    }),
  include_deleted: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'include_deleted must be a boolean',
    }),
});

/**
 * Validates ID parameter in URL (e.g., /roles/:id)
 * 
 * Reusable middleware for validating route parameters that are IDs.
 * Returns 422 with TZ error format if validation fails.
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/roles/:id/permissions', 
 *   authGuard, 
 *   validate_id_param(), 
 *   controller.getRolePermissions
 * );
 */
function validate_id_param() {
  return paramsValidator(
    Joi.object({
      id: idValidator,
    })
  );
}

/**
 * Validates code parameter in URL (e.g., /regions/:code)
 * 
 * Reusable middleware for validating route parameters that are codes.
 * Returns 422 with TZ error format if validation fails.
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.put('/regions/:code', 
 *   authGuard, 
 *   validate_code_param(), 
 *   controller.updateRegion
 * );
 */
function validate_code_param() {
  return paramsValidator(
    Joi.object({
      code: codeValidator,
    })
  );
}

/**
 * Validates query parameters using a Joi schema
 * 
 * Convenience wrapper around queryValidator for common patterns.
 * 
 * @param {Joi.ObjectSchema} schema - Joi schema for query validation
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/users', 
 *   authGuard, 
 *   validate_query(paginationValidator), 
 *   controller.listUsers
 * );
 */
function validate_query(schema) {
  return queryValidator(schema);
}

/**
 * Validates lang query parameter for localized endpoints
 */
function validate_lang_query() {
  return queryValidator(langQueryValidator);
}

/**
 * Validates sync query parameters (version + lang)
 */
function validate_sync_query() {
  return queryValidator(syncQueryValidator);
}

/**
 * Sets default lang query parameter to 'tm' if not provided
 * 
 * Lightweight middleware that ensures req.query.lang is always set.
 * Can be used before validation or in cases where validation isn't needed.
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/catalogs/regions', 
 *   defaultLang(),
 *   controller.getRegions
 * );
 */
function defaultLang() {
  return (req, res, next) => {
    if (!req.query.lang) {
      req.query.lang = 'tm';
    }
    next();
  };
}

module.exports = {
  // Joi schemas (for direct use in schemaValidator)
  idValidator,
  codeValidator,
  paginationValidator,
  langQueryValidator,
  syncQueryValidator,
  
  // Validation middleware functions
  validate_id_param,
  validate_code_param,
  validate_query,
  validate_lang_query,
  validate_sync_query,
  defaultLang,
};
