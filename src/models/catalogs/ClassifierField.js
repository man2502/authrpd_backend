/**
 * Модель связи классификатора экономических расходов с полями
 * Определяет, какие поля требуются для конкретного классификатора
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierField = sequelize.define(
    'ClassifierField',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Уникальный идентификатор связи',
      },
      economic_classifier_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Связь с классификатором экономических расходов',
      },
      field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Связь с полем',
      },
    },
    {
      tableName: 'classifier_fields',
      indexes: [
        {
          unique: true,
          fields: ['economic_classifier_id', 'field_id'],
          name: 'unique_classifier_field',
        },
        { fields: ['economic_classifier_id'] },
        { fields: ['field_id'] },
      ],
    }
  );

  return ClassifierField;
};

