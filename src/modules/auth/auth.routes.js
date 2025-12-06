const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginSchema, refreshSchema } = require('./auth.schemas');
const schemaValidator = require('../../middlewares/schema.validator');
const { loginLimiter, refreshLimiter } = require('../../middlewares/rate.limit');
const { authGuard } = require('../../middlewares/auth.guard');

router.post('/member/login', loginLimiter, schemaValidator(loginSchema), authController.loginMember);
router.post('/client/login', loginLimiter, schemaValidator(loginSchema), authController.loginClient);
router.post('/refresh', refreshLimiter, schemaValidator(refreshSchema), authController.refresh);
router.post('/logout', authGuard, schemaValidator(refreshSchema), authController.logout);
router.get('/me', authGuard, authController.getMe);

module.exports = router;

