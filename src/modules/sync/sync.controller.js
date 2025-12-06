const syncService = require('./sync.service');
const { successResponse } = require('../../helpers/response.helper');

async function getCatalogByVersion(req, res, next) {
  try {
    const { name } = req.params;
    const version = req.query.version ? parseInt(req.query.version, 10) : null;
    const lang = req.query.lang || 'tm';

    const data = await syncService.getCatalogDataByVersion(name, version, lang);
    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCatalogByVersion,
};

