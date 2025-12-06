/**
 * Модель классификатора целевых расходов
 * Используется для категоризации расходов по целевому назначению
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierPurpose = sequelize.define(
    'ClassifierPurpose',
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
      tableName: 'classifier_purpose',
    }
  );

  return ClassifierPurpose;
};

