const clientsService = require('./clients.service');
const { successResponse } = require('../../helpers/response.helper');

/**
 * Clients Controller
 * Thin controller layer - delegates to service
 */

async function list_clients(req, res, next) {
  try {
    const { page, limit, is_active, is_blocked, organization_id, region_id } = req.query;
    const result = await clientsService.getAllClients({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      is_blocked: is_blocked !== undefined ? is_blocked === 'true' : undefined,
      organization_id,
      region_id,
    });
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

async function get_client(req, res, next) {
  try {
    const client = await clientsService.getClientById(req.params.id);
    res.json(successResponse(client));
  } catch (error) {
    next(error);
  }
}

async function create_client(req, res, next) {
  try {
    const client = await clientsService.createClient(req.body);
    res.status(201).json(successResponse(client));
  } catch (error) {
    next(error);
  }
}

async function update_client(req, res, next) {
  try {
    const client = await clientsService.updateClient(req.params.id, req.body);
    res.json(successResponse(client));
  } catch (error) {
    next(error);
  }
}

async function block_client(req, res, next) {
  try {
    const client = await clientsService.blockClient(req.params.id);
    res.json(successResponse(client));
  } catch (error) {
    next(error);
  }
}

async function unblock_client(req, res, next) {
  try {
    const client = await clientsService.unblockClient(req.params.id);
    res.json(successResponse(client));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list_clients,
  get_client,
  create_client,
  update_client,
  block_client,
  unblock_client,
};
