/**
 * Модель документа
 * Справочник типов документов, используемых в системе
 */
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Уникальный идентификатор документа',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Уникальное имя типа документа',
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название документа на туркменском',
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название документа на русском',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Флаг активности записи',
      },
    },
    {
      tableName: 'documents',
      indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return Document;
};

