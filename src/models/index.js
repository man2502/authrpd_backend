const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Import all models
const Member = require('./Member')(sequelize, DataTypes);
const Client = require('./Client')(sequelize, DataTypes);
const Role = require('./Role')(sequelize, DataTypes);
const Permission = require('./Permission')(sequelize, DataTypes);
const RolePermission = require('./RolePermission')(sequelize, DataTypes);
const CatalogVersion = require('./CatalogVersion')(sequelize, DataTypes);
const Region = require('./catalogs/Region')(sequelize, DataTypes);
const Ministry = require('./catalogs/Ministry')(sequelize, DataTypes);
const Organization = require('./catalogs/Organization')(sequelize, DataTypes);
const ReceiverOrganization = require('./catalogs/ReceiverOrganization')(sequelize, DataTypes);
const ClassifierEconomic = require('./catalogs/ClassifierEconomic')(sequelize, DataTypes);
const ClassifierPurpose = require('./catalogs/ClassifierPurpose')(sequelize, DataTypes);
const ClassifierFunctional = require('./catalogs/ClassifierFunctional')(sequelize, DataTypes);
const ClassifierIncome = require('./catalogs/ClassifierIncome')(sequelize, DataTypes);
const Bank = require('./catalogs/Bank')(sequelize, DataTypes);
const BankAccount = require('./catalogs/BankAccount')(sequelize, DataTypes);
const Field = require('./catalogs/Field')(sequelize, DataTypes);
const Document = require('./catalogs/Document')(sequelize, DataTypes);
const ClassifierField = require('./catalogs/ClassifierField')(sequelize, DataTypes);
const ClassifierDocument = require('./catalogs/ClassifierDocument')(sequelize, DataTypes);
const AuthAuditLog = require('./AuthAuditLog')(sequelize, DataTypes);
const RpdInstance = require('./RpdInstance')(sequelize, DataTypes);

// Define associations
// Member associations
Member.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Member.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Member.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

// Client associations
Client.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Client.belongsTo(Ministry, { foreignKey: 'ministry_id', as: 'ministry' });
Client.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

// Role-Permission associations
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});


// Organization associations
Organization.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Organization.belongsTo(Ministry, { foreignKey: 'ministry_id', as: 'ministry' });
Organization.belongsTo(Organization, { foreignKey: 'parent_id', as: 'parent' });
Organization.hasMany(Organization, { foreignKey: 'parent_id', as: 'children' });
Organization.belongsTo(ClassifierPurpose, { foreignKey: 'classifier_purpose_id', as: 'classifierPurpose' });
Organization.belongsTo(ClassifierFunctional, { foreignKey: 'classifier_functional_id', as: 'classifierFunctional' });

// Region associations
Region.belongsTo(Region, { foreignKey: 'parent_id', as: 'parent' });
Region.hasMany(Region, { foreignKey: 'parent_id', as: 'children' });

// RPD Instance associations
RpdInstance.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Region.hasOne(RpdInstance, { foreignKey: 'region_id', as: 'rpdInstance' });

// Bank associations
Bank.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Bank.hasMany(BankAccount, { foreignKey: 'bank_id', as: 'accounts' });

// BankAccount associations
BankAccount.belongsTo(Bank, { foreignKey: 'bank_id', as: 'bank' });
BankAccount.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// ClassifierField associations
ClassifierField.belongsTo(ClassifierEconomic, {
  foreignKey: 'economic_classifier_id',
  as: 'classifier',
});
ClassifierField.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });
ClassifierEconomic.hasMany(ClassifierField, {
  foreignKey: 'economic_classifier_id',
  as: 'fields',
});
Field.hasMany(ClassifierField, { foreignKey: 'field_id', as: 'classifiers' });

// ClassifierDocument associations
ClassifierDocument.belongsTo(ClassifierEconomic, {
  foreignKey: 'economic_classifier_id',
  as: 'classifier',
});
ClassifierDocument.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });
ClassifierEconomic.hasMany(ClassifierDocument, {
  foreignKey: 'economic_classifier_id',
  as: 'documents',
});
Document.hasMany(ClassifierDocument, { foreignKey: 'document_id', as: 'classifiers' });

// ClassifierPurpose associations
ClassifierPurpose.hasMany(Organization, { foreignKey: 'classifier_purpose_id', as: 'organizations' });

// ClassifierFunctional associations
ClassifierFunctional.hasMany(Organization, { foreignKey: 'classifier_functional_id', as: 'organizations' });

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Member,
  Client,
  Role,
  Permission,
  RolePermission,
  CatalogVersion,
  Region,
  Ministry,
  Organization,
  ReceiverOrganization,
  ClassifierEconomic,
  ClassifierPurpose,
  ClassifierFunctional,
  ClassifierIncome,
  Bank,
  BankAccount,
  Field,
  Document,
  ClassifierField,
  ClassifierDocument,
  AuthAuditLog,
  RpdInstance,
};

module.exports = db;

