const catalogService = require('../catalogs/catalog.service');
const { Region, Ministry, Organization } = require('../../models');
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
  let data = [];

  switch (catalogName) {
    case 'regions':
      data = await catalogService.getRegions(lang);
      break;
    case 'ministries':
      data = await catalogService.getMinistries(lang);
      break;
    case 'organizations':
      data = await catalogService.getOrganizations(lang);
      break;
    case 'classifier_economic':
      data = await catalogService.getClassifierEconomic(lang);
      break;
    case 'classifier_purpose':
      data = await catalogService.getClassifierPurpose(lang);
      break;
    case 'classifier_functional':
      data = await catalogService.getClassifierFunctional(lang);
      break;
    case 'classifier_income':
      data = await catalogService.getClassifierIncome(lang);
      break;
    case 'banks':
      data = await catalogService.getBanks(lang);
      break;
    case 'bank_accounts':
      data = await catalogService.getBankAccounts(lang);
      break;
    default:
      throw new Error(`Unknown catalog: ${catalogName}`);
  }

  // Локализуем данные
  const localized = localize(data, lang);

  return localized;
}

module.exports = {
  getCatalogDataByVersion,
};

