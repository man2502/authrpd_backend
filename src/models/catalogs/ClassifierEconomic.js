/**
 * Модель классификатора экономических расходов
 * Используется для категоризации бюджетных расходов по экономическим признакам
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierEconomic = sequelize.define(
    'ClassifierEconomic',
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
        comment: 'Код классификатора (например, E1123)',
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название на туркменском',
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название на русском',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Флаг активности записи',
      },
    },
    {
      tableName: 'classifier_economic',
    }
  );

  return ClassifierEconomic;
};

