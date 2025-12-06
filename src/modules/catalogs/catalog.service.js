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
const { cacheData, invalidateCache } = require('../../helpers/cache.helper');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');

/**
 * Инкрементирует версию каталога
 * @param {string} catalogName - имя каталога
 */
async function bumpCatalogVersion(catalogName) {
  const [version, created] = await CatalogVersion.findOrCreate({
    where: { catalog_name: catalogName },
    defaults: { version: 1, updatedAt: new Date() }, // Sequelize will map to updated_at column
  });

  if (!created) {
    version.version += 1;
    version.updatedAt = new Date(); // Sequelize will map to updated_at column
    await version.save();
  }

  // Инвалидируем кэш каталога
  await invalidateCache(`catalog:${catalogName}:*`);
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
async function getRegions(lang = 'tm') {
  return await cacheData(
    `catalog:regions:${lang}`,
    async () => {
      return await Region.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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

// Ministries
async function getMinistries(lang = 'tm') {
  return await cacheData(
    `catalog:ministries:${lang}`,
    async () => {
      return await Ministry.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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

// Organizations
async function getOrganizations(lang = 'tm') {
  return await cacheData(
    `catalog:organizations:${lang}`,
    async () => {
      return await Organization.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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

// Classifier Economic
async function getClassifierEconomic(lang = 'tm') {
  return await cacheData(
    `catalog:classifier_economic:${lang}`,
    async () => {
      return await ClassifierEconomic.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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
async function getClassifierPurpose(lang = 'tm') {
  return await cacheData(
    `catalog:classifier_purpose:${lang}`,
    async () => {
      return await ClassifierPurpose.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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
async function getClassifierFunctional(lang = 'tm') {
  return await cacheData(
    `catalog:classifier_functional:${lang}`,
    async () => {
      return await ClassifierFunctional.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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
async function getClassifierIncome(lang = 'tm') {
  return await cacheData(
    `catalog:classifier_income:${lang}`,
    async () => {
      return await ClassifierIncome.findAll({
        where: { isActive: true },
        order: [['code', 'ASC']],
      });
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
async function getBanks(lang = 'tm') {
  return await cacheData(
    `catalog:banks:${lang}`,
    async () => {
      return await Bank.findAll({
        where: { isActive: true },
        order: [['id', 'ASC']],
      });
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
async function getBankAccounts(lang = 'tm') {
  return await cacheData(
    `catalog:bank_accounts:${lang}`,
    async () => {
      return await BankAccount.findAll({
        where: { isActive: true },
        order: [['id', 'ASC']],
      });
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
async function getFields(lang = 'tm') {
  return await cacheData(
    `catalog:fields:${lang}`,
    async () => {
      return await Field.findAll({
        where: { isActive: true },
        order: [['id', 'ASC']],
      });
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
async function getDocuments(lang = 'tm') {
  return await cacheData(
    `catalog:documents:${lang}`,
    async () => {
      return await Document.findAll({
        where: { isActive: true },
        order: [['id', 'ASC']],
      });
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
  getMinistries,
  createMinistry,
  updateMinistry,
  getOrganizations,
  createOrganization,
  updateOrganization,
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

