const catalogService = require('./catalog.service');
const { successResponse } = require('../../helpers/response.helper');
const localize = require('../../helpers/localize.helper');

async function getVersions(req, res, next) {
  try {
    const versions = await catalogService.getCatalogVersions();
    res.json(successResponse(versions));
  } catch (error) {
    next(error);
  }
}

async function getRegions(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const regions = await catalogService.getRegions(lang);
    const localized = localize(regions, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createRegion(req, res, next) {
  try {
    const region = await catalogService.createRegion(req.body);
    res.status(201).json(successResponse(region));
  } catch (error) {
    next(error);
  }
}

async function updateRegion(req, res, next) {
  try {
    const region = await catalogService.updateRegion(req.params.code, req.body);
    res.json(successResponse(region));
  } catch (error) {
    next(error);
  }
}

async function deleteRegion(req, res, next) {
  try {
    await catalogService.deleteRegion(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

async function getMinistries(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const ministries = await catalogService.getMinistries(lang);
    const localized = localize(ministries, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createMinistry(req, res, next) {
  try {
    const ministry = await catalogService.createMinistry(req.body);
    res.status(201).json(successResponse(ministry));
  } catch (error) {
    next(error);
  }
}

async function updateMinistry(req, res, next) {
  try {
    const ministry = await catalogService.updateMinistry(req.params.code, req.body);
    res.json(successResponse(ministry));
  } catch (error) {
    next(error);
  }
}

async function deleteMinistry(req, res, next) {
  try {
    await catalogService.deleteMinistry(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

async function getOrganizations(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const organizations = await catalogService.getOrganizations(lang);
    const localized = localize(organizations, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createOrganization(req, res, next) {
  try {
    const organization = await catalogService.createOrganization(req.body);
    res.status(201).json(successResponse(organization));
  } catch (error) {
    next(error);
  }
}

async function updateOrganization(req, res, next) {
  try {
    const organization = await catalogService.updateOrganization(req.params.code, req.body);
    res.json(successResponse(organization));
  } catch (error) {
    next(error);
  }
}

async function deleteOrganization(req, res, next) {
  try {
    await catalogService.deleteOrganization(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Classifier Economic
async function getClassifierEconomic(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getClassifierEconomic(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createClassifierEconomic(req, res, next) {
  try {
    const item = await catalogService.createClassifierEconomic(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateClassifierEconomic(req, res, next) {
  try {
    const item = await catalogService.updateClassifierEconomic(req.params.code, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteClassifierEconomic(req, res, next) {
  try {
    await catalogService.deleteClassifierEconomic(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Classifier Purpose
async function getClassifierPurpose(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getClassifierPurpose(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createClassifierPurpose(req, res, next) {
  try {
    const item = await catalogService.createClassifierPurpose(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateClassifierPurpose(req, res, next) {
  try {
    const item = await catalogService.updateClassifierPurpose(req.params.code, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteClassifierPurpose(req, res, next) {
  try {
    await catalogService.deleteClassifierPurpose(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Classifier Functional
async function getClassifierFunctional(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getClassifierFunctional(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createClassifierFunctional(req, res, next) {
  try {
    const item = await catalogService.createClassifierFunctional(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateClassifierFunctional(req, res, next) {
  try {
    const item = await catalogService.updateClassifierFunctional(req.params.code, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteClassifierFunctional(req, res, next) {
  try {
    await catalogService.deleteClassifierFunctional(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Classifier Income
async function getClassifierIncome(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getClassifierIncome(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createClassifierIncome(req, res, next) {
  try {
    const item = await catalogService.createClassifierIncome(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateClassifierIncome(req, res, next) {
  try {
    const item = await catalogService.updateClassifierIncome(req.params.code, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteClassifierIncome(req, res, next) {
  try {
    await catalogService.deleteClassifierIncome(req.params.code);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Banks
async function getBanks(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getBanks(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createBank(req, res, next) {
  try {
    const item = await catalogService.createBank(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateBank(req, res, next) {
  try {
    const item = await catalogService.updateBank(req.params.id, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteBank(req, res, next) {
  try {
    await catalogService.deleteBank(req.params.id);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Bank Accounts
async function getBankAccounts(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getBankAccounts(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createBankAccount(req, res, next) {
  try {
    const item = await catalogService.createBankAccount(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateBankAccount(req, res, next) {
  try {
    const item = await catalogService.updateBankAccount(req.params.id, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteBankAccount(req, res, next) {
  try {
    await catalogService.deleteBankAccount(req.params.id);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Fields
async function getFields(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getFields(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createField(req, res, next) {
  try {
    const item = await catalogService.createField(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateField(req, res, next) {
  try {
    const item = await catalogService.updateField(req.params.id, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteField(req, res, next) {
  try {
    await catalogService.deleteField(req.params.id);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

// Documents
async function getDocuments(req, res, next) {
  try {
    const lang = req.query.lang || 'tm';
    const items = await catalogService.getDocuments(lang);
    const localized = localize(items, lang);
    res.json(successResponse(localized));
  } catch (error) {
    next(error);
  }
}

async function createDocument(req, res, next) {
  try {
    const item = await catalogService.createDocument(req.body);
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function updateDocument(req, res, next) {
  try {
    const item = await catalogService.updateDocument(req.params.id, req.body);
    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
}

async function deleteDocument(req, res, next) {
  try {
    await catalogService.deleteDocument(req.params.id);
    res.json(successResponse({ message: 'Deleted successfully' }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVersions,
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  getMinistries,
  createMinistry,
  updateMinistry,
  deleteMinistry,
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getClassifierEconomic,
  createClassifierEconomic,
  updateClassifierEconomic,
  deleteClassifierEconomic,
  getClassifierPurpose,
  createClassifierPurpose,
  updateClassifierPurpose,
  deleteClassifierPurpose,
  getClassifierFunctional,
  createClassifierFunctional,
  updateClassifierFunctional,
  deleteClassifierFunctional,
  getClassifierIncome,
  createClassifierIncome,
  updateClassifierIncome,
  deleteClassifierIncome,
  getBanks,
  createBank,
  updateBank,
  deleteBank,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getFields,
  createField,
  updateField,
  deleteField,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
};

