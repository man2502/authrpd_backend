const Joi = require('joi');

/**
 * Login Schema
 * Validates member/client login requests
 * 
 * Rules:
 * - username: trimmed, 3-100 characters (alphanumeric, underscore, dot, @, hyphen)
 * - password: 6-128 characters (minimum security requirement)
 */
const loginSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9._@-]+$/)
    .required()
    .messages({
      'string.base': 'Username must be a string',
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 100 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, @, and hyphens',
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
});

/**
 * Refresh Token Schema
 * Validates refresh token requests
 * 
 * Rules:
 * - refresh_token: non-empty string (JWT token format)
 */
const refreshSchema = Joi.object({
  refresh_token: Joi.string()
    .trim()
    .min(10)
    .required()
    .messages({
      'string.base': 'Refresh token must be a string',
      'string.empty': 'Refresh token is required',
      'string.min': 'Refresh token is invalid',
      'any.required': 'Refresh token is required',
    }),
});

module.exports = {
  loginSchema,
  refreshSchema,
};

