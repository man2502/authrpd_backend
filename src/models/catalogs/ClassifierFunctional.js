/**
 * Модель классификатора функциональных расходов
 * Используется для категоризации расходов по функциональным признакам
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierFunctional = sequelize.define(
    'ClassifierFunctional',
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
        comment: 'Код классификатора',
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
      tableName: 'classifier_functional',
    }
  );

  return ClassifierFunctional;
};

