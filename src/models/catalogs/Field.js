/**
 * Модель поля документа
 * Справочник полей, которые могут требоваться в документах
 */
module.exports = (sequelize, DataTypes) => {
  const Field = sequelize.define(
    'Field',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Уникальный идентификатор поля',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Уникальное имя поля',
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название поля на туркменском',
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название поля на русском',
      },
      field_type: {
        type: DataTypes.ENUM('STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'TEXT'),
        allowNull: false,
        defaultValue: 'STRING',
        comment: 'Тип поля',
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Обязательность поля',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Флаг активности записи',
      },
    },
    {
      tableName: 'fields',
      indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return Field;
};

