const express = require('express');
const router = express.Router();
const rbacController = require('./rbac.controller');
const { authGuard } = require('../../middlewares/auth.guard');

router.get('/roles', authGuard, rbacController.getRoles);
router.post('/roles', authGuard, rbacController.createRole);
router.put('/roles/:id', authGuard, rbacController.updateRole);
router.get('/roles/:id/permissions', authGuard, rbacController.getRolePermissions); // Best practice endpoint
router.get('/permissions', authGuard, rbacController.getPermissions);
router.post('/roles/:id/permissions', authGuard, rbacController.assignPermissions);

module.exports = router;

