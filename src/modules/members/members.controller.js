const membersService = require('./members.service');
const { successResponse } = require('../../helpers/response.helper');

/**
 * Members Controller
 * Thin controller layer - delegates to service
 */

async function list_members(req, res, next) {
  try {
    const { page, limit, is_active, role_id, region_id } = req.query;
    const result = await membersService.getAllMembers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      role_id: role_id ? parseInt(role_id) : undefined,
      region_id,
    });
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

async function get_member(req, res, next) {
  try {
    const member = await membersService.getMemberById(req.params.id);
    res.json(successResponse(member));
  } catch (error) {
    next(error);
  }
}

async function create_member(req, res, next) {
  try {
    const member = await membersService.createMember(req.body);
    res.status(201).json(successResponse(member));
  } catch (error) {
    next(error);
  }
}

async function update_member(req, res, next) {
  try {
    const member = await membersService.updateMember(req.params.id, req.body);
    res.json(successResponse(member));
  } catch (error) {
    next(error);
  }
}

async function disable_member(req, res, next) {
  try {
    const member = await membersService.disableMember(req.params.id);
    res.json(successResponse(member));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list_members,
  get_member,
  create_member,
  update_member,
  disable_member,
};
