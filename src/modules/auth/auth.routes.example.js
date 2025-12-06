/**
 * Example Swagger Annotations for Auth Routes
 * 
 * This file demonstrates how to add Swagger documentation to your routes.
 * Copy these annotations to your actual route files above the route definitions.
 * 
 * Key Points:
 * - Use @swagger annotation with OpenAPI 3.0 syntax
 * - Include security: [] for public endpoints
 * - Use security: [{ bearerAuth: [] }] for protected endpoints
 * - Document request/response schemas
 * - Include examples that match AuthRPD response format
 * - Add tags to group related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginSchema, refreshSchema } = require('./auth.schemas');
const schemaValidator = require('../../middlewares/schema.validator');
const { loginLimiter, refreshLimiter } = require('../../middlewares/rate.limit');
const { authGuard } = require('../../middlewares/auth.guard');

/**
 * @swagger
 * /auth/member/login:
 *   post:
 *     tags: [Auth]
 *     summary: Member login
 *     description: Authenticate a member user and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             example1:
 *               summary: Member login example
 *               value:
 *                 username: member@example.com
 *                 password: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   success: true
 *                   data:
 *                     access_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refresh_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       id: 1
 *                       username: member@example.com
 *                       role: ADMIN
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data:
 *                 error_code: 401
 *                 error_msg: Invalid username or password
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/member/login', loginLimiter, schemaValidator(loginSchema), authController.loginMember);

/**
 * @swagger
 * /auth/client/login:
 *   post:
 *     tags: [Auth]
 *     summary: Client login
 *     description: Authenticate a client application and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             example1:
 *               summary: Client login example
 *               value:
 *                 username: client_app_001
 *                 password: ClientSecret123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   success: true
 *                   data:
 *                     access_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refresh_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       id: 1
 *                       username: client_app_001
 *                       role: CLIENT
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data:
 *                 error_code: 401
 *                 error_msg: Invalid username or password
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/client/login', loginLimiter, schemaValidator(loginSchema), authController.loginClient);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Obtain a new access token using a valid refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           examples:
 *             example1:
 *               summary: Refresh token example
 *               value:
 *                 refresh_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: Successful token refresh
 *                 value:
 *                   success: true
 *                   data:
 *                     access_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refresh_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data:
 *                 error_code: 401
 *                 error_msg: Invalid or expired refresh token
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/refresh', refreshLimiter, schemaValidator(refreshSchema), authController.refresh);

module.exports = router;

