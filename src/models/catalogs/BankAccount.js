/**
 * Модель банковского счета
 * Справочник банковских счетов организаций
 */
module.exports = (sequelize, DataTypes) => {
  const BankAccount = sequelize.define(
    'BankAccount',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Уникальный идентификатор счета',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Название счета',
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Номер банковского счета',
      },
      bank_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Связь с банком',
      },
      expense_type: {
        type: DataTypes.ENUM('BUDGET', 'EXTRA_BUDGET', 'OTHER'),
        allowNull: true,
        comment: 'Тип расходов: бюджетный, внебюджетный, прочее',
      },
      organization_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Связь с организацией',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Флаг активности записи',
      },
    },
    {
      tableName: 'bank_accounts',
      indexes: [
        { unique: true, fields: ['account_number'] },
        { fields: ['bank_id'] },
        { fields: ['organization_id'] },
        { fields: ['is_active'] },
      ],
    }
  );

  return BankAccount;
};

