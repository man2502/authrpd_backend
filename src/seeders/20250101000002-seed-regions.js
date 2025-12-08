'use strict';

const { Region } = require('../models');

/**
 * Seeder для регионов
 * Создает тестовые данные для таблицы regions согласно ТЗ
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Используем findOrCreate для идемпотентности
    const regions = [
      {
        code: '10',
        title_tm: 'Aşgabat',
        title_ru: 'Ашхабад',
        prefix_tm: '',
        prefix_ru: 'гор.',
        suffix_tm: 'şäher',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: '11',
        title_tm: 'Ahal',
        title_ru: 'Ахал',
        prefix_tm: '',
        prefix_ru: 'вел.',
        suffix_tm: 'welayaty',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: '12',
        title_tm: 'Balkan',
        title_ru: 'Балкан',
        prefix_tm: '',
        prefix_ru: 'вел.',
        suffix_tm: 'welayaty',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: '13',
        title_tm: 'Daşoguz',
        title_ru: 'Дашогуз',
        prefix_tm: '',
        prefix_ru: 'вел.',
        suffix_tm: 'welayaty',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: '14',
        title_tm: 'Lebap',
        title_ru: 'Лебап',
        prefix_tm: '',
        prefix_ru: 'вел.',
        suffix_tm: 'welayaty',
        suffix_ru: '',
        is_active: true,
      },
      {
        code: '15',
        title_tm: 'Mary',
        title_ru: 'Мары',
        prefix_tm: '',
        prefix_ru: 'вел.',
        suffix_tm: 'welayaty',
        suffix_ru: '',
        is_active: true,
      },
    ];

    for (const regionData of regions) {
      await Region.findOrCreate({
        where: { code: regionData.code },
        defaults: regionData,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await Region.destroy({ where: {}, truncate: true, cascade: true });
  },
};
