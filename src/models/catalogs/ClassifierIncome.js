/**
 * Модель классификатора доходов
 * Используется для категоризации бюджетных доходов
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierIncome = sequelize.define(
    'ClassifierIncome',
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
      tableName: 'classifier_income',
    }
  );

  return ClassifierIncome;
};

