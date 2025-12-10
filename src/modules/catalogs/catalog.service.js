const {
  Region,
  Ministry,
  Organization,
  ReceiverOrganization,
  ClassifierEconomic,
  ClassifierPurpose,
  ClassifierFunctional,
  ClassifierIncome,
  Bank,
  BankAccount,
  Field,
  Document,
  CatalogVersion,
} = require('../../models');
const { cacheData, invalidateCache, invalidateCachePattern } = require('../../helpers/cache.helper');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');
const sequelize = require('../../config/db');
const localize = require('../../helpers/localize.helper');
/**
 * Инкрементирует версию каталога
 * @param {string} catalogName - имя каталога
 */
async function bumpCatalogVersion(catalogName) {
  const [version, created] = await CatalogVersion.findOrCreate({
    where: { catalog_name: catalogName },
    defaults: { version: 1, updated_at: new Date() }, // Sequelize will map to updated_at column
  });

  if (!created) {
    version.version += 1;
    version.updated_at = new Date(); // Sequelize will map to updated_at column
    await version.save();
  }

  // Инвалидируем кэш каталога (все локализации и unlocalized) и общий список версий
  await invalidateCachePattern(`catalog:${catalogName}:*`);
  await invalidateCache(`catalog:${catalogName}:unlocalized`);
  await invalidateCache('catalog:versions:all');
}

/**
 * Получает версии всех каталогов
 * @returns {Promise<Array>} - массив версий
 */
async function getCatalogVersions() {
  return await cacheData(
    'catalog:versions:all',
    async () => {
      return await CatalogVersion.findAll({
        order: [['catalog_name', 'ASC']],
      });
    },
    3600 // TTL 1 час
  );
}

// Regions
async function getRegions(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:regions:unlocalized';
  const localizedCacheKey = `catalog:regions:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Region.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
        attributes: {
          include: [
            [sequelize.col('parent.title_tm'), 'parent_tm'],
            [sequelize.col('parent.title_ru'), 'parent_ru'],
          ]
        },
        include: [
          { model: Region, as: 'parent', attributes: [] }
        ],
      });
    },
    21600 // TTL 6 часов
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600 // TTL 6 часов
  );
}

async function createRegion(data) {
  const region = await Region.create(data);
  await bumpCatalogVersion('regions');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'REGION',
    targetId: region.code,
    meta: { action: 'created' },
  });
  return region;
}

async function updateRegion(code, data) {
  const region = await Region.findByPk(code);
  if (!region) {
    throw new ApiError(404, 'Region not found');
  }
  await region.update(data);
  await bumpCatalogVersion('regions');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'REGION',
    targetId: code,
    meta: { action: 'updated' },
  });
  return region;
}

async function deleteRegion(code) {
  const region = await Region.findByPk(code);
  if (!region) {
    throw new ApiError(404, 'Region not found');
  }
  await region.update({ is_active: false });
  await bumpCatalogVersion('regions');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'REGION',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return region;
}

// Ministries
async function getMinistries(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:ministries:unlocalized';
  const localizedCacheKey = `catalog:ministries:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Ministry.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createMinistry(data) {
  const ministry = await Ministry.create(data);
  await bumpCatalogVersion('ministries');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'MINISTRY',
    targetId: ministry.code,
    meta: { action: 'created' },
  });
  return ministry;
}

async function updateMinistry(code, data) {
  const ministry = await Ministry.findByPk(code);
  if (!ministry) {
    throw new ApiError(404, 'Ministry not found');
  }
  await ministry.update(data);
  await bumpCatalogVersion('ministries');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'MINISTRY',
    targetId: code,
    meta: { action: 'updated' },
  });
  return ministry;
}

async function deleteMinistry(code) {
  const ministry = await Ministry.findByPk(code);
  if (!ministry) {
    throw new ApiError(404, 'Ministry not found');
  }
  await ministry.update({ is_active: false });
  await bumpCatalogVersion('ministries');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'MINISTRY',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return ministry;
}

// Organizations
async function getOrganizations(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:organizations:unlocalized';
  const localizedCacheKey = `catalog:organizations:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Organization.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
        attributes: {
          include: [
            [sequelize.col('region.title_tm'), 'region_tm'],
            [sequelize.col('region.title_ru'), 'region_ru'],
            [sequelize.col('ministry.title_tm'), 'ministry_tm'],
            [sequelize.col('ministry.title_ru'), 'ministry_ru'],
            [sequelize.col('parent.title_tm'), 'parent_tm'],
            [sequelize.col('parent.title_ru'), 'parent_ru'],

          ]
        },
        include: [
          { model: Region, as: 'region', attributes: [] },
          { model: Ministry, as: 'ministry', attributes: [] },
          { model: Organization, as: 'parent', attributes: [] }
        ],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createOrganization(data) {
  const organization = await Organization.create(data);
  await bumpCatalogVersion('organizations');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'ORGANIZATION',
    targetId: organization.code,
    meta: { action: 'created' },
  });
  return organization;
}

async function updateOrganization(code, data) {
  const organization = await Organization.findByPk(code);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }
  await organization.update(data);
  await bumpCatalogVersion('organizations');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'ORGANIZATION',
    targetId: code,
    meta: { action: 'updated' },
  });
  return organization;
}

async function deleteOrganization(code) {
  const organization = await Organization.findByPk(code);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }
  await organization.update({ is_active: false });
  await bumpCatalogVersion('organizations');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'ORGANIZATION',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return organization;
}

// Classifier Economic
async function getClassifierEconomic(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:classifier_economic:unlocalized';
  const localizedCacheKey = `catalog:classifier_economic:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await ClassifierEconomic.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createClassifierEconomic(data) {
  const item = await ClassifierEconomic.create(data);
  await bumpCatalogVersion('classifier_economic');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_ECONOMIC',
    targetId: item.code,
    meta: { action: 'created' },
  });
  return item;
}

async function updateClassifierEconomic(code, data) {
  const item = await ClassifierEconomic.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier economic not found');
  }
  await item.update(data);
  await bumpCatalogVersion('classifier_economic');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_ECONOMIC',
    targetId: code,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteClassifierEconomic(code) {
  const item = await ClassifierEconomic.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier economic not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('classifier_economic');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_ECONOMIC',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return item;
}

// Classifier Purpose
async function getClassifierPurpose(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:classifier_purpose:unlocalized';
  const localizedCacheKey = `catalog:classifier_purpose:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await ClassifierPurpose.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createClassifierPurpose(data) {
  const item = await ClassifierPurpose.create(data);
  await bumpCatalogVersion('classifier_purpose');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_PURPOSE',
    targetId: item.code,
    meta: { action: 'created' },
  });
  return item;
}

async function updateClassifierPurpose(code, data) {
  const item = await ClassifierPurpose.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier purpose not found');
  }
  await item.update(data);
  await bumpCatalogVersion('classifier_purpose');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_PURPOSE',
    targetId: code,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteClassifierPurpose(code) {
  const item = await ClassifierPurpose.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier purpose not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('classifier_purpose');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_PURPOSE',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return item;
}

// Classifier Functional
async function getClassifierFunctional(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:classifier_functional:unlocalized';
  const localizedCacheKey = `catalog:classifier_functional:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await ClassifierFunctional.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createClassifierFunctional(data) {
  const item = await ClassifierFunctional.create(data);
  await bumpCatalogVersion('classifier_functional');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_FUNCTIONAL',
    targetId: item.code,
    meta: { action: 'created' },
  });
  return item;
}

async function updateClassifierFunctional(code, data) {
  const item = await ClassifierFunctional.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier functional not found');
  }
  await item.update(data);
  await bumpCatalogVersion('classifier_functional');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_FUNCTIONAL',
    targetId: code,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteClassifierFunctional(code) {
  const item = await ClassifierFunctional.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier functional not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('classifier_functional');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_FUNCTIONAL',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return item;
}

// Classifier Income
async function getClassifierIncome(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:classifier_income:unlocalized';
  const localizedCacheKey = `catalog:classifier_income:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await ClassifierIncome.findAll({
        where: { is_active: true },
        order: [['code', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createClassifierIncome(data) {
  const item = await ClassifierIncome.create(data);
  await bumpCatalogVersion('classifier_income');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_INCOME',
    targetId: item.code,
    meta: { action: 'created' },
  });
  return item;
}

async function updateClassifierIncome(code, data) {
  const item = await ClassifierIncome.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier income not found');
  }
  await item.update(data);
  await bumpCatalogVersion('classifier_income');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_INCOME',
    targetId: code,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteClassifierIncome(code) {
  const item = await ClassifierIncome.findByPk(code);
  if (!item) {
    throw new ApiError(404, 'Classifier income not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('classifier_income');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'CLASSIFIER_INCOME',
    targetId: code,
    meta: { action: 'deleted' },
  });
  return item;
}

// Banks
async function getBanks(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:banks:unlocalized';
  const localizedCacheKey = `catalog:banks:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Bank.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']],
        attributes: {
          include: [
            [sequelize.col('region.title_tm'), 'region_tm'],
            [sequelize.col('region.title_ru'), 'region_ru'],
          ]
        },
        include: [
          { model: Region, as: 'region', attributes: [] }
        ],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createBank(data) {
  const item = await Bank.create(data);
  await bumpCatalogVersion('banks');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK',
    targetId: item.id,
    meta: { action: 'created' },
  });
  return item;
}

async function updateBank(id, data) {
  const item = await Bank.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Bank not found');
  }
  await item.update(data);
  await bumpCatalogVersion('banks');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK',
    targetId: id,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteBank(id) {
  const item = await Bank.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Bank not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('banks');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK',
    targetId: id,
    meta: { action: 'deleted' },
  });
  return item;
}

// Bank Accounts
async function getBankAccounts(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:bank_accounts:unlocalized';
  const localizedCacheKey = `catalog:bank_accounts:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await BankAccount.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']],
        attributes: {
          include: [
            [sequelize.col('bank.title_tm'), 'bank_tm'],
            [sequelize.col('bank.title_ru'), 'bank_ru'],
            [sequelize.col('organization.title_tm'), 'organization_tm'],
            [sequelize.col('organization.title_ru'), 'organization_ru'],
          ]
        },
        include: [
          { model: Bank, as: 'bank', attributes: [] },
          { model: Organization, as: 'organization', attributes: [] }
        ],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createBankAccount(data) {
  const item = await BankAccount.create(data);
  await bumpCatalogVersion('bank_accounts');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK_ACCOUNT',
    targetId: item.id,
    meta: { action: 'created' },
  });
  return item;
}

async function updateBankAccount(id, data) {
  const item = await BankAccount.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Bank account not found');
  }
  await item.update(data);
  await bumpCatalogVersion('bank_accounts');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK_ACCOUNT',
    targetId: id,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteBankAccount(id) {
  const item = await BankAccount.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Bank account not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('bank_accounts');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'BANK_ACCOUNT',
    targetId: id,
    meta: { action: 'deleted' },
  });
  return item;
}

// Fields
async function getFields(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:fields:unlocalized';
  const localizedCacheKey = `catalog:fields:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Field.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createField(data) {
  const item = await Field.create(data);
  await bumpCatalogVersion('fields');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'FIELD',
    targetId: item.id,
    meta: { action: 'created' },
  });
  return item;
}

async function updateField(id, data) {
  const item = await Field.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Field not found');
  }
  await item.update(data);
  await bumpCatalogVersion('fields');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'FIELD',
    targetId: id,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteField(id) {
  const item = await Field.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Field not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('fields');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'FIELD',
    targetId: id,
    meta: { action: 'deleted' },
  });
  return item;
}

// Documents
async function getDocuments(lang = 'tm', shouldLocalize = true) {
  // Cache unlocalized data separately
  const unlocalizedCacheKey = 'catalog:documents:unlocalized';
  const localizedCacheKey = `catalog:documents:localized:${lang}`;
  
  // Fetch unlocalized data (cached separately)
  const rawData = await cacheData(
    unlocalizedCacheKey,
    async () => {
      return await Document.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']],
      });
    },
    21600
  );

  // Return unlocalized if requested
  if (!shouldLocalize) {
    return rawData;
  }

  // Cache localized data separately per language
  return await cacheData(
    localizedCacheKey,
    async () => {
      return localize(rawData, lang);
    },
    21600
  );
}

async function createDocument(data) {
  const item = await Document.create(data);
  await bumpCatalogVersion('documents');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'DOCUMENT',
    targetId: item.id,
    meta: { action: 'created' },
  });
  return item;
}

async function updateDocument(id, data) {
  const item = await Document.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Document not found');
  }
  await item.update(data);
  await bumpCatalogVersion('documents');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'DOCUMENT',
    targetId: id,
    meta: { action: 'updated' },
  });
  return item;
}

async function deleteDocument(id) {
  const item = await Document.findByPk(id);
  if (!item) {
    throw new ApiError(404, 'Document not found');
  }
  await item.update({ is_active: false });
  await bumpCatalogVersion('documents');
  await logEvent({
    action: auditActions.CATALOG_UPDATED,
    targetType: 'DOCUMENT',
    targetId: id,
    meta: { action: 'deleted' },
  });
  return item;
}

module.exports = {
  getCatalogVersions,
  bumpCatalogVersion,
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

