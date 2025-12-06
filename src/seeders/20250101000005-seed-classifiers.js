'use strict';

/**
 * Seeder для классификаторов
 * Создает тестовые данные для всех классификаторов согласно ТЗ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Classifier Economic - используем ON CONFLICT для идемпотентности
    await queryInterface.sequelize.query(`
      INSERT INTO classifier_economic (code, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        ('E1123', 'Enjam satyn almak', 'Покупка оборудования', true, NOW(), NOW()),
        ('E1155', 'Hyzmat tölegi', 'Оплата услуг', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);

    // Classifier Purpose
    await queryInterface.sequelize.query(`
      INSERT INTO classifier_purpose (code, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        ('P001', 'Bilim maksatnamasy', 'Образовательная программа', true, NOW(), NOW()),
        ('P002', 'Saglygy goraýyş maksatnamasy', 'Программа здравоохранения', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);

    // Classifier Functional
    await queryInterface.sequelize.query(`
      INSERT INTO classifier_functional (code, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        ('F001', 'Bilim funksiýasy', 'Функция образования', true, NOW(), NOW()),
        ('F002', 'Saglygy goraýyş funksiýasy', 'Функция здравоохранения', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);

    // Classifier Income
    await queryInterface.sequelize.query(`
      INSERT INTO classifier_income (code, title_tm, title_ru, is_active, created_at, updated_at)
      VALUES
        ('I001', 'Büdjet girdejileri', 'Бюджетные доходы', true, NOW(), NOW()),
        ('I002', 'Büdjetden daşary girdejiler', 'Внебюджетные доходы', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('classifier_economic', null, {});
    await queryInterface.bulkDelete('classifier_purpose', null, {});
    await queryInterface.bulkDelete('classifier_functional', null, {});
    await queryInterface.bulkDelete('classifier_income', null, {});
  },
};

