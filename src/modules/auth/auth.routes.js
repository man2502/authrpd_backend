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
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/member/login', schemaValidator(loginSchema), authController.loginMember);

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
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/client/login', schemaValidator(loginSchema), authController.loginClient);

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
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/refresh', schemaValidator(refreshSchema), authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: |
 *       Invalidates the refresh token and logs out the authenticated user.
 *       Requires valid access token in Authorization header.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           examples:
 *             example1:
 *               summary: Logout request
 *               value:
 *                 refresh_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "Logged out successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authGuard, schemaValidator(refreshSchema), authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user information
 *     description: |
 *       Returns information about the currently authenticated user.
 *       Requires valid access token in Authorization header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             examples:
 *               member:
 *                 summary: Member user
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     username: "member@example.com"
 *                     fullname: "John Doe"
 *                     position: "Administrator"
 *                     role: "ADMIN"
 *                     region_id: "10"
 *               client:
 *                 summary: Client user
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     username: "client_app_001"
 *                     fullname: "Client Application"
 *                     organization_id: "ORG001"
 *                     region_id: "10"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data:
 *                 error_code: 404
 *                 error_msg: "User not found"
 */
router.get('/me', authGuard, authController.getMe);

module.exports = router;

