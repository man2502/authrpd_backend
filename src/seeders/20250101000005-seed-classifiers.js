'use strict';

const {
  ClassifierEconomic,
  ClassifierPurpose,
  ClassifierFunctional,
  ClassifierIncome,
} = require('../models');

/**
 * Seeder для классификаторов
 * Создает тестовые данные для всех классификаторов согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Classifier Economic - используем findOrCreate для идемпотентности
    const economicClassifiers = [
      {
        code: 'E1123',
        title_tm: 'Enjam satyn almak',
        title_ru: 'Покупка оборудования',
        is_active: true,
      },
      {
        code: 'E1155',
        title_tm: 'Hyzmat tölegi',
        title_ru: 'Оплата услуг',
        is_active: true,
      },
    ];

    for (const classifier of economicClassifiers) {
      await ClassifierEconomic.findOrCreate({
        where: { code: classifier.code },
        defaults: classifier,
      });
    }

    // Classifier Purpose
    const purposeClassifiers = [
      {
        code: 'P001',
        title_tm: 'Bilim maksatnamasy',
        title_ru: 'Образовательная программа',
        is_active: true,
      },
      {
        code: 'P002',
        title_tm: 'Saglygy goraýyş maksatnamasy',
        title_ru: 'Программа здравоохранения',
        is_active: true,
      },
    ];

    for (const classifier of purposeClassifiers) {
      await ClassifierPurpose.findOrCreate({
        where: { code: classifier.code },
        defaults: classifier,
      });
    }

    // Classifier Functional
    const functionalClassifiers = [
      {
        code: 'F001',
        title_tm: 'Bilim funksiýasy',
        title_ru: 'Функция образования',
        is_active: true,
      },
      {
        code: 'F002',
        title_tm: 'Saglygy goraýyş funksiýasy',
        title_ru: 'Функция здравоохранения',
        is_active: true,
      },
    ];

    for (const classifier of functionalClassifiers) {
      await ClassifierFunctional.findOrCreate({
        where: { code: classifier.code },
        defaults: classifier,
      });
    }

    // Classifier Income
    const incomeClassifiers = [
      {
        code: 'I001',
        title_tm: 'Büdjet girdejileri',
        title_ru: 'Бюджетные доходы',
        is_active: true,
      },
      {
        code: 'I002',
        title_tm: 'Büdjetden daşary girdejiler',
        title_ru: 'Внебюджетные доходы',
        is_active: true,
      },
    ];

    for (const classifier of incomeClassifiers) {
      await ClassifierIncome.findOrCreate({
        where: { code: classifier.code },
        defaults: classifier,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await ClassifierEconomic.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierPurpose.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierFunctional.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierIncome.destroy({ where: {}, truncate: true, cascade: true });
  },
};
