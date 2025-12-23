const catalogService = require('./catalog.service');
const { successResponse } = require('../../helpers/response.helper');
const { cacheData } = require('../../helpers/cache.helper');
const localize = require('../../helpers/localize.helper');

/**
 * Helper function to parse is_active query parameter
 * @param {any} value - Query parameter value
 * @returns {boolean|undefined} - Parsed boolean or undefined if not provided
 */
function parseIsActive(value) {
  if (value === undefined || value === null) {
    return true; // Default to true for backward compatibility
  }
  return value === 'true' || value === true;
}

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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    // is_active from query (default: true for backward compatibility)
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:regions:localized:${lang}:active:${isActive}`
      : `catalog:regions:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const regions = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getRegions(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(regions));
  } catch (error) {
    next(error);
  }
}

async function getRegionByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    // is_active from query (default: true for backward compatibility)
    const isActive = parseIsActive(req.query.is_active);
    const region = await catalogService.getRegionByCode(req.params.code, isActive);
    const localizedRegion = shouldLocalize ? localize([region], lang)[0] : region;
    res.json(successResponse(localizedRegion));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:ministries:localized:${lang}:active:${isActive}`
      : `catalog:ministries:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const ministries = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getMinistries(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(ministries));
  } catch (error) {
    next(error);
  }
}

async function getMinistryByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const ministry = await catalogService.getMinistryByCode(req.params.code, isActive);
    const localizedMinistry = shouldLocalize ? localize([ministry], lang)[0] : ministry;
    res.json(successResponse(localizedMinistry));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:organizations:localized:${lang}:active:${isActive}`
      : `catalog:organizations:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const organizations = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getOrganizations(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(organizations));
  } catch (error) {
    next(error);
  }
}

async function getOrganizationByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const organization = await catalogService.getOrganizationByCode(req.params.code, isActive);
    const localizedOrganization = shouldLocalize ? localize([organization], lang)[0] : organization;
    res.json(successResponse(localizedOrganization));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:classifier_economic:localized:${lang}:active:${isActive}`
      : `catalog:classifier_economic:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getClassifierEconomic(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getClassifierEconomicByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getClassifierEconomicByCode(req.params.code, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:classifier_purpose:localized:${lang}:active:${isActive}`
      : `catalog:classifier_purpose:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getClassifierPurpose(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getClassifierPurposeByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getClassifierPurposeByCode(req.params.code, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:classifier_functional:localized:${lang}:active:${isActive}`
      : `catalog:classifier_functional:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getClassifierFunctional(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getClassifierFunctionalByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getClassifierFunctionalByCode(req.params.code, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:classifier_income:localized:${lang}:active:${isActive}`
      : `catalog:classifier_income:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getClassifierIncome(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getClassifierIncomeByCode(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getClassifierIncomeByCode(req.params.code, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:banks:localized:${lang}:active:${isActive}`
      : `catalog:banks:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getBanks(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getBankById(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getBankById(req.params.id, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:bank_accounts:localized:${lang}:active:${isActive}`
      : `catalog:bank_accounts:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getBankAccounts(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getBankAccountById(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getBankAccountById(req.params.id, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:fields:localized:${lang}:active:${isActive}`
      : `catalog:fields:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getFields(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getFieldById(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getFieldById(req.params.id, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
    // lang is set by validate_lang_query() middleware (default: 'tm')
    const shouldLocalize = req.query.localized !== false; // Default true for backward compatibility
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    
    // Determine cache key based on localization and is_active
    const cacheKey = shouldLocalize 
      ? `catalog:documents:localized:${lang}:active:${isActive}`
      : `catalog:documents:unlocalized:active:${isActive}`;
    
    // Get data from service and cache it
    const items = await cacheData(
      cacheKey,
      async () => {
        const rawData = await catalogService.getDocuments(isActive);
        return shouldLocalize ? localize(rawData, lang) : rawData;
      },
      21600 // TTL 6 hours
    );
    
    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
}

async function getDocumentById(req, res, next) {
  try {
    const shouldLocalize = req.query.localized !== false;
    const lang = req.query.lang || 'tm';
    const isActive = parseIsActive(req.query.is_active);
    const item = await catalogService.getDocumentById(req.params.id, isActive);
    const localizedItem = shouldLocalize ? localize([item], lang)[0] : item;
    res.json(successResponse(localizedItem));
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
  getRegionByCode,
  createRegion,
  updateRegion,
  deleteRegion,
  getMinistries,
  getMinistryByCode,
  createMinistry,
  updateMinistry,
  deleteMinistry,
  getOrganizations,
  getOrganizationByCode,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getClassifierEconomic,
  getClassifierEconomicByCode,
  createClassifierEconomic,
  updateClassifierEconomic,
  deleteClassifierEconomic,
  getClassifierPurpose,
  getClassifierPurposeByCode,
  createClassifierPurpose,
  updateClassifierPurpose,
  deleteClassifierPurpose,
  getClassifierFunctional,
  getClassifierFunctionalByCode,
  createClassifierFunctional,
  updateClassifierFunctional,
  deleteClassifierFunctional,
  getClassifierIncome,
  getClassifierIncomeByCode,
  createClassifierIncome,
  updateClassifierIncome,
  deleteClassifierIncome,
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
};

