const catalogService = require('../catalogs/catalog.service');
const {
  ReceiverOrganization,
  ClassifierField,
  ClassifierDocument,
  CatalogVersion,
  Field,
  Document,
  ClassifierEconomic,
} = require('../../models');
const localize = require('../../helpers/localize.helper');

/**
 * Получает данные каталога по версии
 * @param {string} catalogName - имя каталога
 * @param {number} version - версия (опционально)
 * @param {string} lang - язык
 * @returns {Promise<Object>} - данные каталога
 */
/**
 * Получает данные каталога по версии
 * Поддерживает все master-каталоги для синхронизации с RPD
 * @param {string} catalogName - имя каталога
 * @param {number} version - версия (опционально)
 * @param {string} lang - язык
 * @returns {Promise<Object>} - данные каталога
 */
async function getCatalogDataByVersion(catalogName, version = null, lang = 'tm') {
  const currentVersion = await CatalogVersion.findOne({ where: { catalog_name: catalogName } });

  // Если клиент уже на актуальной версии — отдаём пустой ответ и помечаем up_to_date
  if (version !== null && currentVersion && version >= currentVersion.version) {
    return {
      version: currentVersion.version,
      up_to_date: true,
      items: [],
    };
  }

  let data = [];

  switch (catalogName) {
    case 'regions':
      data = await catalogService.getRegions();
      break;
    case 'receiver_organizations':
      data = await ReceiverOrganization.findAll({
        where: { is_active: true },
        order: [['taxcode', 'ASC']],
      });
      break;
    case 'ministries':
      data = await catalogService.getMinistries();
      break;
    case 'organizations':
      data = await catalogService.getOrganizations();
      break;
    case 'classifier_economic':
      data = await catalogService.getClassifierEconomic();
      break;
    case 'classifier_purpose':
      data = await catalogService.getClassifierPurpose();
      break;
    case 'classifier_functional':
      data = await catalogService.getClassifierFunctional();
      break;
    case 'classifier_income':
      data = await catalogService.getClassifierIncome();
      break;
    case 'banks':
      data = await catalogService.getBanks();
      break;
    case 'bank_accounts':
      data = await catalogService.getBankAccounts();
      break;
    case 'fields':
      data = await catalogService.getFields();
      break;
    case 'documents':
      data = await catalogService.getDocuments();
      break;
    case 'classifier_fields':
      data = await ClassifierField.findAll({
        order: [['id', 'ASC']],
        include: [
          { model: ClassifierEconomic, as: 'classifier', required: false },
          { model: Field, as: 'field', required: false },
        ],
      });
      break;
    case 'classifier_documents':
      data = await ClassifierDocument.findAll({
        order: [['id', 'ASC']],
        include: [
          { model: ClassifierEconomic, as: 'classifier', required: false },
          { model: Document, as: 'document', required: false },
        ],
      });
      break;
    default:
      throw new Error(`Unknown catalog: ${catalogName}`);
  }

  // Локализуем данные
  const localized = localize(data, lang);

  return {
    version: currentVersion ? currentVersion.version : null,
    up_to_date: false,
    items: localized,
  };
}

module.exports = {
  getCatalogDataByVersion,
};

