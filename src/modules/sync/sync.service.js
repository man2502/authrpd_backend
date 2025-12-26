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
 * @param {boolean} includeDeleted - включать ли удалённые записи (deleted_at IS NOT NULL)
 * @returns {Promise<Object>} - данные каталога
 */
async function getCatalogDataByVersion(catalogName, version = null, lang = 'tm', includeDeleted = false) {
  const currentVersion = await CatalogVersion.findOne({ where: { catalog_name: catalogName } });

  // Если клиент уже на актуальной версии — отдаём пустой ответ и помечаем up_to_date
  if (version !== null && currentVersion && version >= currentVersion.version) {
    return {
      version: currentVersion.version,
      up_to_date: true,
      items: [],
      deleted_items: [], // No deleted items if up to date
    };
  }

  // Build where clause for filtering deleted items
  // Sequelize with paranoid: true automatically excludes deleted_at IS NOT NULL
  // But we can explicitly control this with paranoid: !includeDeleted
  const queryOptions = {
    paranoid: !includeDeleted, // If includeDeleted=true, include soft-deleted records
    where: { is_active: true }, // Always filter by is_active
  };

  let data = [];

  switch (catalogName) {
    case 'regions':
      data = await catalogService.getRegions();
      break;
    case 'receiver_organizations':
      data = await ReceiverOrganization.findAll({
        ...queryOptions,
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
        ...queryOptions,
        order: [['id', 'ASC']],
        include: [
          { model: ClassifierEconomic, as: 'classifier', required: false, paranoid: !includeDeleted },
          { model: Field, as: 'field', required: false, paranoid: !includeDeleted },
        ],
      });
      break;
    case 'classifier_documents':
      data = await ClassifierDocument.findAll({
        ...queryOptions,
        order: [['id', 'ASC']],
        include: [
          { model: ClassifierEconomic, as: 'classifier', required: false, paranoid: !includeDeleted },
          { model: Document, as: 'document', required: false, paranoid: !includeDeleted },
        ],
      });
      break;
    default:
      throw new Error(`Unknown catalog: ${catalogName}`);
  }

  // Локализуем данные
  const localized = localize(data, lang);

  // Extract deleted items (codes/ids) if includeDeleted=false
  // Note: This is a simplified implementation. For full delta sync tracking,
  // we would need to maintain a log of deleted items per version.
  // For now, we return empty deleted_items array as tracking requires additional infrastructure.
  const deletedItems = [];

  return {
    version: currentVersion ? currentVersion.version : null,
    up_to_date: false,
    items: localized,
    deleted_items: deletedItems, // Array of codes/ids of deleted items (if include_deleted=false)
  };
}

module.exports = {
  getCatalogDataByVersion,
};

