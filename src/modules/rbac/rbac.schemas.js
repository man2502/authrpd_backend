const Joi = require('joi');

/**
 * RBAC Schema Validators
 * Validates request bodies for RBAC endpoints
 */

/**
 * Create Role Schema
 */
const createRoleSchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Title (TM) must be a string',
      'string.empty': 'Title (TM) is required',
      'string.min': 'Title (TM) must be at least 1 character',
      'string.max': 'Title (TM) must not exceed 255 characters',
      'any.required': 'Title (TM) is required',
    }),
  title_ru: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Title (RU) must be a string',
      'string.empty': 'Title (RU) is required',
      'string.min': 'Title (RU) must be at least 1 character',
      'string.max': 'Title (RU) must not exceed 255 characters',
      'any.required': 'Title (RU) is required',
    }),
  name: Joi.string().trim().uppercase().min(1).max(100).pattern(/^[A-Z0-9_]+$/)
    .required()
    .messages({
      'string.base': 'Role name must be a string',
      'string.empty': 'Role name is required',
      'string.min': 'Role name must be at least 1 character',
      'string.max': 'Role name must not exceed 100 characters',
      'string.pattern.base': 'Role name must contain only uppercase letters, numbers, and underscores',
      'any.required': 'Role name is required',
    }),
  is_active: Joi.boolean().optional(),
});

/**
 * Update Role Schema
 */
const updateRoleSchema = Joi.object({
  title_tm: Joi.string().trim().min(1).max(255).optional()
    .messages({
      'string.base': 'Title (TM) must be a string',
      'string.min': 'Title (TM) must be at least 1 character',
      'string.max': 'Title (TM) must not exceed 255 characters',
    }),
  title_ru: Joi.string().trim().min(1).max(255).optional()
    .messages({
      'string.base': 'Title (RU) must be a string',
      'string.min': 'Title (RU) must be at least 1 character',
      'string.max': 'Title (RU) must not exceed 255 characters',
    }),
  name: Joi.string().trim().uppercase().min(1).max(100).pattern(/^[A-Z0-9_]+$/)
    .optional()
    .messages({
      'string.base': 'Role name must be a string',
      'string.min': 'Role name must be at least 1 character',
      'string.max': 'Role name must not exceed 100 characters',
      'string.pattern.base': 'Role name must contain only uppercase letters, numbers, and underscores',
    }),
  is_active: Joi.boolean().optional(),
});

/**
 * Assign Permissions Schema
 */
const assignPermissionsSchema = Joi.object({
  permission_ids: Joi.array().items(
    Joi.number().integer().positive()
  ).min(1).required()
    .messages({
      'array.base': 'Permission IDs must be an array',
      'array.min': 'At least one permission ID is required',
      'any.required': 'Permission IDs are required',
    }),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
};
