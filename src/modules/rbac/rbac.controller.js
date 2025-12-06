const rbacService = require('./rbac.service');
const { successResponse } = require('../../helpers/response.helper');

async function getRoles(req, res, next) {
  try {
    const roles = await rbacService.getAllRoles();
    res.json(successResponse(roles));
  } catch (error) {
    next(error);
  }
}

async function createRole(req, res, next) {
  try {
    const role = await rbacService.createRole(req.body);
    res.status(201).json(successResponse(role));
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const role = await rbacService.updateRole(req.params.id, req.body);
    res.json(successResponse(role));
  } catch (error) {
    next(error);
  }
}

async function getPermissions(req, res, next) {
  try {
    const permissions = await rbacService.getAllPermissions();
    res.json(successResponse(permissions));
  } catch (error) {
    next(error);
  }
}

async function assignPermissions(req, res, next) {
  try {
    await rbacService.assignPermissionsToRole(req.params.id, req.body.permission_ids);
    res.json(successResponse({ message: 'Permissions assigned successfully' }));
  } catch (error) {
    next(error);
  }
}

/**
 * Получает права по роли (best practice endpoint)
 * Удобно для UI-админки, кэширования и диагностики безопасности
 */
async function getRolePermissions(req, res, next) {
  try {
    const permissions = await rbacService.getRolePermissions(req.params.id);
    res.json(successResponse(permissions));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoles,
  createRole,
  updateRole,
  getPermissions,
  assignPermissions,
  getRolePermissions,
};

