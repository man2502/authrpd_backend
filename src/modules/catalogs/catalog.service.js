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
const { invalidateCache, invalidateCachePattern } = require('../../helpers/cache.helper');
const { logEvent, auditActions } = require('../audit/audit.service');
const ApiError = require('../../helpers/api.error');
const sequelize = require('../../config/db');
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
async function getRegions() {
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
    raw: true,
  });
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

async function getRegionByCode(code) {
  const region = await Region.findOne({
    where: { code, is_active: true },
    attributes: {
      include: [
        [sequelize.col('parent.title_tm'), 'parent_tm'],
        [sequelize.col('parent.title_ru'), 'parent_ru'],
      ]
    },
    include: [
      { model: Region, as: 'parent', attributes: [] }
    ],
    raw: true,
  });
  if (!region) {
    throw new ApiError(404, 'Region not found');
  }
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
async function getMinistries() {
  return await Ministry.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']],
    raw: true,
  });
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

async function getMinistryByCode(code) {
  const ministry = await Ministry.findOne({
    where: { code, is_active: true },
    raw: true,
  });
  if (!ministry) {
    throw new ApiError(404, 'Ministry not found');
  }
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
async function getOrganizations() {
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
    raw: true,
  });
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

async function getOrganizationByCode(code) {
  const organization = await Organization.findOne({
    where: { code, is_active: true },
    attributes: {
      include: [
        [sequelize.col('region.title_tm'), 'region_tm'],
        [sequelize.col('region.title_ru'), 'region_ru'],
        [sequelize.col('ministry.title_tm'), 'ministry_tm'],
        [sequelize.col('ministry.title_ru'), 'ministry_ru'],
        [sequelize.col('parent.title_tm'), 'parent_tm'],
        [sequelize.col('parent.title_ru'), 'parent_ru'],
        [sequelize.col('classifierPurpose.title_tm'), 'classifier_purpose_tm'],
        [sequelize.col('classifierPurpose.title_ru'), 'classifier_purpose_ru'],
        [sequelize.col('classifierFunctional.title_tm'), 'classifier_functional_tm'],
        [sequelize.col('classifierFunctional.title_ru'), 'classifier_functional_ru'],
      ]
    },
    include: [
      { model: Region, as: 'region', attributes: [] },
      { model: Ministry, as: 'ministry', attributes: [] },
      { model: Organization, as: 'parent', attributes: [] },
      { model: ClassifierPurpose, as: 'classifierPurpose', attributes: [] },
      { model: ClassifierFunctional, as: 'classifierFunctional', attributes: [] },
    ],
    raw: true,
  });
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }
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
async function getClassifierEconomic() {
  return await ClassifierEconomic.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']],
    raw: true,
  });
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

async function getClassifierEconomicByCode(code) {
  const item = await ClassifierEconomic.findOne({
    where: { code, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Classifier economic not found');
  }
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
async function getClassifierPurpose() {
  return await ClassifierPurpose.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']],
    raw: true,
  });
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

async function getClassifierPurposeByCode(code) {
  const item = await ClassifierPurpose.findOne({
    where: { code, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Classifier purpose not found');
  }
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
async function getClassifierFunctional() {
  return await ClassifierFunctional.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']],
    raw: true,
  });
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

async function getClassifierFunctionalByCode(code) {
  const item = await ClassifierFunctional.findOne({
    where: { code, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Classifier functional not found');
  }
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
async function getClassifierIncome() {
  return await ClassifierIncome.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']],
    raw: true,
  });
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

async function getClassifierIncomeByCode(code) {
  const item = await ClassifierIncome.findOne({
    where: { code, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Classifier income not found');
  }
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
async function getBanks() {
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
    raw: true,
  });
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

async function getBankById(id) {
  const item = await Bank.findOne({
    where: { id, is_active: true },
    attributes: {
      include: [
        [sequelize.col('region.title_tm'), 'region_tm'],
        [sequelize.col('region.title_ru'), 'region_ru'],
      ]
    },
    include: [
      { model: Region, as: 'region', attributes: [] }
    ],
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Bank not found');
  }
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
async function getBankAccounts() {
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
    raw: true,
  });
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

async function getBankAccountById(id) {
  const item = await BankAccount.findOne({
    where: { id, is_active: true },
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
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Bank account not found');
  }
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
async function getFields() {
  return await Field.findAll({
    where: { is_active: true },
    order: [['id', 'ASC']],
    raw: true,
  });
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

async function getFieldById(id) {
  const item = await Field.findOne({
    where: { id, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Field not found');
  }
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
async function getDocuments() {
  return await Document.findAll({
    where: { is_active: true },
    order: [['id', 'ASC']],
    raw: true,
  });
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

async function getDocumentById(id) {
  const item = await Document.findOne({
    where: { id, is_active: true },
    raw: true,
  });
  if (!item) {
    throw new ApiError(404, 'Document not found');
  }
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

