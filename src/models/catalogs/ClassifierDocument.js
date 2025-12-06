/**
 * Модель связи классификатора экономических расходов с документами
 * Определяет, какие документы требуются для конкретного классификатора
 */
module.exports = (sequelize, DataTypes) => {
  const ClassifierDocument = sequelize.define(
    'ClassifierDocument',
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
      document_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Связь с документом',
      },
    },
    {
      tableName: 'classifier_documents',
      indexes: [
        {
          unique: true,
          fields: ['economic_classifier_id', 'document_id'],
          name: 'unique_classifier_document',
        },
        { fields: ['economic_classifier_id'] },
        { fields: ['document_id'] },
      ],
    }
  );

  return ClassifierDocument;
};

