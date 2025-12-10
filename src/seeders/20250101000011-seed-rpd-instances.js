'use strict';

const { RpdInstance, Region } = require('../models');

/**
 * Seeder для RPD Instances
 * Создает RPD instances для всех top-level регионов (без parent_id)
 * 
 * Берет информацию из regions seeder:
 * - '10' - Aşgabat (столица) → rpd_ashgabat / rpd:ashgabat
 * - '11' - Ahal → rpd_ahal / rpd:ahal
 * - '12' - Balkan → rpd_balkan / rpd:balkan
 * - '13' - Daşoguz → rpd_dashoguz / rpd:dashoguz
 * - '14' - Lebap → rpd_lebap / rpd:lebap
 * - '15' - Mary → rpd_mary / rpd:mary
 * 
 * Note: Использует Sequelize модели, поэтому используем camelCase для полей
 * Sequelize автоматически преобразует в snake_case для БД благодаря underscored: true
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Определяем mapping для RPD instances на основе кодов регионов
    // Формат: region_code => { code, audience }
    const rpdInstances = [
      {
        region_code: '10',
        code: 'rpd_ashgabat',
        audience: 'rpd:ashgabat',
      },
      {
        region_code: '11',
        code: 'rpd_ahal',
        audience: 'rpd:ahal',
      },
      {
        region_code: '12',
        code: 'rpd_balkan',
        audience: 'rpd:balkan',
      },
      {
        region_code: '13',
        code: 'rpd_dashoguz',
        audience: 'rpd:dashoguz',
      },
      {
        region_code: '14',
        code: 'rpd_lebap',
        audience: 'rpd:lebap',
      },
      {
        region_code: '15',
        code: 'rpd_mary',
        audience: 'rpd:mary',
      },
    ];

    for (const rpdData of rpdInstances) {
      // Проверяем, что регион существует и является top-level (без parent_id)
      const region = await Region.findOne({
        where: { code: rpdData.region_code, is_active: true },
        attributes: ['code', 'parent_id', 'title_tm', 'title_ru'],
      });

      if (!region) {
        console.warn(`⚠️  Region not found: ${rpdData.region_code}. Skipping RPD instance creation.`);
        continue;
      }

      // Валидация: только top-level регионы (без parent_id) могут иметь RPD instances
      if (region.parent_id) {
        console.warn(
          `⚠️  Region ${rpdData.region_code} (${region.title_tm}) is a sub-region (parent: ${region.parent_id}). ` +
          `Skipping RPD instance creation. Only top-level regions can have RPD instances.`
        );
        continue;
      }

      // Проверяем, не существует ли уже RPD instance для этого региона
      const existing = await RpdInstance.findOne({
        where: { region_id: rpdData.region_code },
      });

      if (existing) {
        console.log(`✓ RPD instance already exists for region ${rpdData.region_code}: ${existing.code}`);
        continue;
      }

      // Создаем RPD instance
      await RpdInstance.findOrCreate({
        where: { code: rpdData.code },
        defaults: {
          code: rpdData.code,
          region_id: rpdData.region_code,
          audience: rpdData.audience,
          is_active: true,
        },
      });

      console.log(
        `✓ Created RPD instance: ${rpdData.code} for region ${rpdData.region_code} (${region.title_tm} / ${region.title_ru})`
      );
    }

    console.log('✓ RPD instances seeding completed');
  },

  async down(queryInterface, Sequelize) {
    // Удаляем все RPD instances, созданные этим seeder'ом
    await RpdInstance.destroy({
      where: {
        code: [
          'rpd_ashgabat',
          'rpd_ahal',
          'rpd_balkan',
          'rpd_dashoguz',
          'rpd_lebap',
          'rpd_mary',
        ],
      },
    });
  },
};

