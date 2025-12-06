/**
 * Модель банка
 * Справочник банков, участвующих в бюджетной системе
 */
module.exports = (sequelize, DataTypes) => {
  const Bank = sequelize.define(
    'Bank',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Уникальный идентификатор банка',
      },
      title_tm: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название банка на туркменском',
      },
      title_ru: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название банка на русском',
      },
      code_mfo: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'МФО код банка',
      },
      code_bab: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'БАБ код банка',
      },
      region_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Связь с регионом',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Флаг активности записи',
      },
    },
    {
      tableName: 'banks',
      indexes: [
        { fields: ['region_id'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return Bank;
};

