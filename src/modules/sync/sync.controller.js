const syncService = require('./sync.service');
const { successResponse } = require('../../helpers/response.helper');

async function getCatalogByVersion(req, res, next) {
  try {
    const { name } = req.params;
    // lang is set by validate_sync_query() middleware (default: 'tm')
    const version = req.query.version ? parseInt(req.query.version, 10) : null;
    const lang = req.query.lang || 'tm';
    const includeDeleted = req.query.include_deleted === 'true' || req.query.include_deleted === true;

    const data = await syncService.getCatalogDataByVersion(name, version, lang, includeDeleted);
    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCatalogByVersion,
};

