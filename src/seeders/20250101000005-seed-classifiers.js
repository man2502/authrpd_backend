'use strict';

const fs = require('fs');
const path = require('path');
const {
  ClassifierEconomic,
  ClassifierPurpose,
  ClassifierFunctional,
  ClassifierIncome,
} = require('../models');

/**
 * Seeder для классификаторов
 * Загружает данные из JSON файлов в папке data/
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dataDir = path.join(__dirname, 'data');

    /**
     * Helper function to load and seed classifiers from JSON file
     * @param {string} filename - Name of the JSON file (e.g., 'classifier_economic.json')
     * @param {Model} Model - Sequelize model class
     * @param {string} classifierName - Name for logging purposes
     */
    async function seedFromJson(filename, Model, classifierName) {
      const filePath = path.join(dataDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: ${filename} not found in ${dataDir}, skipping ${classifierName} seeding`);
        return;
      }

      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const classifiers = JSON.parse(fileContent);

        if (!Array.isArray(classifiers)) {
          throw new Error(`${filename} must contain a JSON array`);
        }

        console.log(`Loading ${classifiers.length} ${classifierName} classifiers from ${filename}`);

        for (const classifier of classifiers) {
          await Model.findOrCreate({
            where: { code: classifier.code },
            defaults: classifier,
          });
        }

        console.log(`Successfully seeded ${classifierName} classifiers`);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        throw error;
      }
    }

    // Seed all classifiers from JSON files
    await seedFromJson('classifier_economic.json', ClassifierEconomic, 'Economic');
    await seedFromJson('classifier_purpose.json', ClassifierPurpose, 'Purpose');
    await seedFromJson('classifier_functional.json', ClassifierFunctional, 'Functional');
    
    // Classifier Income - check if JSON file exists, otherwise use fallback
    const incomeJsonPath = path.join(dataDir, 'classifier_income.json');
    if (fs.existsSync(incomeJsonPath)) {
      await seedFromJson('classifier_income.json', ClassifierIncome, 'Income');
    } else {
      // Fallback to hardcoded data if JSON file doesn't exist
      console.log('classifier_income.json not found, using fallback data');
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
    }
  },

  async down(queryInterface, Sequelize) {
    await ClassifierEconomic.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierPurpose.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierFunctional.destroy({ where: {}, truncate: true, cascade: true });
    await ClassifierIncome.destroy({ where: {}, truncate: true, cascade: true });
  },
};
