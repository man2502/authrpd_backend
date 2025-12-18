'use strict';

const {
  Field,
  Document,
  ClassifierField,
  ClassifierDocument,
  ReceiverOrganization,
  Organization,
} = require('../models');

/**
 * Seeder для полей, документов и связей с классификаторами, а также получателей и департаментов
 * Покрывает требования ТЗ по тестовым данным для всех таблиц
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fields
    const fieldRecords = [];
    const fields = [
      {
        name: 'passport_number',
        title_tm: 'Pasport belgisi',
        title_ru: 'Номер паспорта',
        field_type: 'STRING',
        is_required: true,
        is_active: true,
      },
      {
        name: 'contract_date',
        title_tm: 'Şertnama senesi',
        title_ru: 'Дата контракта',
        field_type: 'DATE',
        is_required: true,
        is_active: true,
      },
    ];

    for (const field of fields) {
      const [record] = await Field.findOrCreate({
        where: { name: field.name },
        defaults: field,
      });
      fieldRecords.push(record);
    }

    // Documents
    const documentRecords = [];
    const documents = [
      {
        name: 'passport_scan',
        title_tm: 'Pasport skany',
        title_ru: 'Скан паспорта',
        is_active: true,
      },
      {
        name: 'contract_file',
        title_tm: 'Şertnama faýly',
        title_ru: 'Файл договора',
        is_active: true,
      },
    ];

    for (const document of documents) {
      const [record] = await Document.findOrCreate({
        where: { name: document.name },
        defaults: document,
      });
      documentRecords.push(record);
    }

    // Receiver organizations
    const receivers = [
      {
        taxcode: '500000001',
        name_tm: 'Kabul ediji gurama 1',
        name_ru: 'Получатель 1',
        type: 'BUDGET',
        is_active: true,
      },
      {
        taxcode: '500000002',
        name_tm: 'Kabul ediji gurama 2',
        name_ru: 'Получатель 2',
        type: 'TREASURY',
        is_active: true,
      },
    ];

    for (const receiver of receivers) {
      await ReceiverOrganization.findOrCreate({
        where: { taxcode: receiver.taxcode },
        defaults: receiver,
      });
    }

    

    // Classifier links (use existing classifier codes from other seeders)
    const economicCodes = ['E1123', 'E1155'];
    const fieldByName = Object.fromEntries(fieldRecords.map((f) => [f.name, f]));
    const documentByName = Object.fromEntries(documentRecords.map((d) => [d.name, d]));

    // Link first classifier to first field/document, second to both
    const classifierFieldLinks = [
      { economic_classifier_id: economicCodes[0], field_id: fieldByName.passport_number.id },
      { economic_classifier_id: economicCodes[1], field_id: fieldByName.contract_date.id },
    ];

    for (const link of classifierFieldLinks) {
      await ClassifierField.findOrCreate({
        where: {
          economic_classifier_id: link.economic_classifier_id,
          field_id: link.field_id,
        },
        defaults: link,
      });
    }

    const classifierDocumentLinks = [
      { economic_classifier_id: economicCodes[0], document_id: documentByName.passport_scan.id },
      { economic_classifier_id: economicCodes[1], document_id: documentByName.contract_file.id },
    ];

    for (const link of classifierDocumentLinks) {
      await ClassifierDocument.findOrCreate({
        where: {
          economic_classifier_id: link.economic_classifier_id,
          document_id: link.document_id,
        },
        defaults: link,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await ClassifierDocument.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierField.destroy({ where: {}, truncate: true, cascade: true });
    await Document.destroy({ where: {}, truncate: true, cascade: true });
    await Field.destroy({ where: {}, truncate: true, cascade: true });
    await ReceiverOrganization.destroy({ where: {}, truncate: true, cascade: true });
  },
};
