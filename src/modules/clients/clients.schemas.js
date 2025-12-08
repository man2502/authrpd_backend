const Joi = require('joi');

/**
 * Clients Schema Validators
 * Validates request bodies for client management endpoints
 */

/**
 * Create Client Schema
 */
const createClientSchema = Joi.object({
  username: Joi.string().trim().min(3).max(100).pattern(/^[a-zA-Z0-9._@-]+$/)
    .required()
    .messages({
      'string.base': 'Username must be a string',
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 100 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, @, and hyphens',
      'any.required': 'Username is required',
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
  fullname: Joi.string().trim().min(1).max(255).required()
    .messages({
      'string.base': 'Full name must be a string',
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 1 character',
      'string.max': 'Full name must not exceed 255 characters',
      'any.required': 'Full name is required',
    }),
  phone: Joi.string().trim().max(50).allow(null, '').optional(),
  email: Joi.string().trim().email().max(255).allow(null, '').optional()
    .messages({
      'string.email': 'Email must be a valid email address',
    }),
  phone_verified: Joi.boolean().optional(),
  email_verified: Joi.boolean().optional(),
  organization_id: Joi.string().trim().max(50).allow(null, '').optional(),
  ministry_id: Joi.string().trim().max(50).allow(null, '').optional(),
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
  is_blocked: Joi.boolean().optional(),
});

/**
 * Update Client Schema
 */
const updateClientSchema = Joi.object({
  username: Joi.string().trim().min(3).max(100).pattern(/^[a-zA-Z0-9._@-]+$/)
    .optional()
    .messages({
      'string.base': 'Username must be a string',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 100 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, @, and hyphens',
    }),
  password: Joi.string().min(6).max(128).optional()
    .messages({
      'string.base': 'Password must be a string',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must not exceed 128 characters',
    }),
  fullname: Joi.string().trim().min(1).max(255).optional()
    .messages({
      'string.base': 'Full name must be a string',
      'string.min': 'Full name must be at least 1 character',
      'string.max': 'Full name must not exceed 255 characters',
    }),
  phone: Joi.string().trim().max(50).allow(null, '').optional(),
  email: Joi.string().trim().email().max(255).allow(null, '').optional()
    .messages({
      'string.email': 'Email must be a valid email address',
    }),
  phone_verified: Joi.boolean().optional(),
  email_verified: Joi.boolean().optional(),
  organization_id: Joi.string().trim().max(50).allow(null, '').optional(),
  ministry_id: Joi.string().trim().max(50).allow(null, '').optional(),
  region_id: Joi.string().trim().max(50).allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
  is_blocked: Joi.boolean().optional(),
});

module.exports = {
  createClientSchema,
  updateClientSchema,
};
