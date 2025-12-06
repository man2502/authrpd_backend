const Joi = require('joi');
const ApiError = require('../helpers/api.error');

/**
 * Schema Validation Middleware for AuthRPD API
 * 
 * This module provides:
 * 1. Generic schema validator middleware
 * 2. Reusable Joi validators for common patterns (ID, code, pagination)
 * 3. Input hardening through strict validation
 * 
 * Why Input Validation is Critical:
 * - Prevents injection attacks (SQL, NoSQL, command injection)
 * - Ensures data integrity and type safety
 * - Protects against malformed requests
 * - Provides clear error messages for API consumers
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function schemaValidator(schema) {
  return (req, res, next) => {
    // Validate request body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Collect all errors, not just the first one
      stripUnknown: true, // Remove unknown fields (security: prevents parameter pollution)
      convert: true, // Convert types when possible (e.g., "123" -> 123)
    });

    if (error) {
      // Return first error detail (can be enhanced to return all errors)
      const details = error.details[0];
      return next(
        new ApiError(422, details.message, details.path.join('.'))
      );
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

/**
 * Reusable Joi Validators
 * 
 * Common validation patterns used throughout the AuthRPD API.
 * These validators ensure consistency and reduce code duplication.
 */

/**
 * ID Validator
 * 
 * Validates database ID fields (integer, positive, required).
 * Used for route parameters like /users/:id
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
 * Code Validator
 * 
 * Validates catalog codes and other code fields.
 * Rules: uppercase letters and numbers, 1-50 characters.
 * 
 * @type {Joi.StringSchema}
 */
const codeValidator = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z0-9]+$/)
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.base': 'Code must be a string',
    'string.pattern.base': 'Code must contain only uppercase letters and numbers',
    'string.min': 'Code must be at least 1 character',
    'string.max': 'Code must not exceed 50 characters',
    'any.required': 'Code is required',
  });

/**
 * Pagination Validator
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
 * Query Parameters Validator Middleware
 * 
 * Validates query parameters (not body) using a Joi schema.
 * Useful for GET requests with query parameters.
 * 
 * @param {Joi.Schema} schema - Joi validation schema for query parameters
 * @returns {Function} Express middleware function
 */
function queryValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details[0];
      return next(
        new ApiError(422, details.message, details.path.join('.'))
      );
    }

    req.query = value;
    next();
  };
}

/**
 * URL Parameter Validator Middleware
 * 
 * Validates URL parameters (e.g., /users/:id) using a Joi schema.
 * 
 * @param {Joi.Schema} schema - Joi validation schema for URL parameters
 * @returns {Function} Express middleware function
 */
function paramsValidator(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details[0];
      return next(
        new ApiError(422, details.message, details.path.join('.'))
      );
    }

    req.params = value;
    next();
  };
}

module.exports = schemaValidator;
module.exports.queryValidator = queryValidator;
module.exports.paramsValidator = paramsValidator;
module.exports.validators = {
  id: idValidator,
  code: codeValidator,
  pagination: paginationValidator,
};
