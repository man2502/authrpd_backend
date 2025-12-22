const express = require('express');
const router = express.Router();
const catalogController = require('./catalog.controller');
const { authGuard } = require('../../middlewares/auth.guard');
const require_permissions = require('../../middlewares/require_permissions');
const { validate_code_param, validate_id_param, validate_lang_query } = require('../../helpers/validators');
const schemaValidator = require('../../middlewares/schema.validator');
const {
  createRegionSchema,
  updateRegionSchema,
  createMinistrySchema,
  updateMinistrySchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  createClassifierSchema,
  updateClassifierSchema,
  createBankSchema,
  updateBankSchema,
  createBankAccountSchema,
  updateBankAccountSchema,
  createFieldSchema,
  updateFieldSchema,
  createDocumentSchema,
  updateDocumentSchema,
} = require('./catalog.schemas');

/**
 * @swagger
 * /catalogs/versions:
 *   get:
 *     tags: [Catalogs]
 *     summary: Get catalog versions
 *     description: |
 *       Retrieve version information for all catalogs.
 *       This endpoint is public and does not require authentication.
 *       Used by regional RPD systems to check for catalog updates.
 *     security: []
 *     responses:
 *       200:
 *         description: Catalog versions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - name: regions
 *                   version: 1
 *                   updated_at: "2024-01-15T10:30:00Z"
 *                 - name: ministries
 *                   version: 2
 *                   updated_at: "2024-01-16T14:20:00Z"
 */
// Public endpoints for sync
router.get('/versions', catalogController.getVersions);

// Protected endpoints
// Example usage of require_permissions middleware:
// - RBAC_MANAGE: Full RBAC administration (roles, permissions)
// - CATALOG_WRITE: Write access to catalogs (create, update, delete)
// - CATALOG_READ: Read access to catalogs (list, view)

/**
 * @swagger
 * /catalogs/regions:
 *   get:
 *     tags: [Catalogs]
 *     summary: List regions
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: |
 *           true (default) returns single localized title field;
 *           false returns both title_tm and title_ru for admin editing.
 *     responses:
 *       200: { description: Regions retrieved }
 *   post:
 *     tags: [Catalogs]
 *     summary: Create region
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Region created }
 * /catalogs/regions/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update region
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete region (soft)
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/regions', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getRegions);
router.get('/regions/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getRegionByCode);
router.post('/regions', authGuard, require_permissions('CATALOG_WRITE'), catalogController.createRegion);
router.put('/regions/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.updateRegion);
router.delete('/regions/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteRegion);

/**
 * @swagger
 * /catalogs/ministries:
 *   get:
 *     tags: [Catalogs]
 *     summary: List ministries
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create ministry
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/ministries/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update ministry
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete ministry (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Catalog CRUD - protected by CATALOG_READ / CATALOG_WRITE
router.get('/ministries', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getMinistries);
router.get('/ministries/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getMinistryByCode);
router.post('/ministries', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createMinistrySchema), catalogController.createMinistry);
router.put('/ministries/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateMinistrySchema), catalogController.updateMinistry);
router.delete('/ministries/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteMinistry);

/**
 * @swagger
 * /catalogs/organizations:
 *   get:
 *     tags: [Catalogs]
 *     summary: List organizations
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create organization
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/organizations/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update organization
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete organization (soft)
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/organizations', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getOrganizations);
router.get('/organizations/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getOrganizationByCode);
router.post('/organizations', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createOrganizationSchema), catalogController.createOrganization);
router.put('/organizations/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateOrganizationSchema), catalogController.updateOrganization);
router.delete('/organizations/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteOrganization);

/**
 * @swagger
 * /catalogs/classifier_economic:
 *   get:
 *     tags: [Catalogs]
 *     summary: List economic classifiers
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create economic classifier
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/classifier_economic/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update economic classifier
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete economic classifier (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Classifier Economic
router.get('/classifier_economic', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierEconomic);
router.get('/classifier_economic/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierEconomicByCode);
router.post('/classifier_economic', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createClassifierSchema), catalogController.createClassifierEconomic);
router.put('/classifier_economic/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateClassifierSchema), catalogController.updateClassifierEconomic);
router.delete('/classifier_economic/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteClassifierEconomic);

/**
 * @swagger
 * /catalogs/classifier_purpose:
 *   get:
 *     tags: [Catalogs]
 *     summary: List purpose classifiers
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create purpose classifier
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/classifier_purpose/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update purpose classifier
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete purpose classifier (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Classifier Purpose
router.get('/classifier_purpose', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierPurpose);
router.get('/classifier_purpose/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierPurposeByCode);
router.post('/classifier_purpose', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createClassifierSchema), catalogController.createClassifierPurpose);
router.put('/classifier_purpose/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateClassifierSchema), catalogController.updateClassifierPurpose);
router.delete('/classifier_purpose/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteClassifierPurpose);

/**
 * @swagger
 * /catalogs/classifier_functional:
 *   get:
 *     tags: [Catalogs]
 *     summary: List functional classifiers
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create functional classifier
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/classifier_functional/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update functional classifier
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete functional classifier (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Classifier Functional
router.get('/classifier_functional', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierFunctional);
router.get('/classifier_functional/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierFunctionalByCode);
router.post('/classifier_functional', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createClassifierSchema), catalogController.createClassifierFunctional);
router.put('/classifier_functional/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateClassifierSchema), catalogController.updateClassifierFunctional);
router.delete('/classifier_functional/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteClassifierFunctional);

/**
 * @swagger
 * /catalogs/classifier_income:
 *   get:
 *     tags: [Catalogs]
 *     summary: List income classifiers
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create income classifier
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/classifier_income/{code}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update income classifier
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete income classifier (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Classifier Income
router.get('/classifier_income', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierIncome);
router.get('/classifier_income/:code', authGuard, validate_code_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getClassifierIncomeByCode);
router.post('/classifier_income', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createClassifierSchema), catalogController.createClassifierIncome);
router.put('/classifier_income/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateClassifierSchema), catalogController.updateClassifierIncome);
router.delete('/classifier_income/:code', authGuard, validate_code_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteClassifierIncome);

/**
 * @swagger
 * /catalogs/banks:
 *   get:
 *     tags: [Catalogs]
 *     summary: List banks
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create bank
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/banks/{id}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update bank
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete bank (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Banks
router.get('/banks', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getBanks);
router.get('/banks/:id', authGuard, validate_id_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getBankById);
router.post('/banks', authGuard, require_permissions('CATALOG_WRITE'), catalogController.createBank);
router.put('/banks/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), catalogController.updateBank);
router.delete('/banks/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteBank);

/**
 * @swagger
 * /catalogs/bank_accounts:
 *   get:
 *     tags: [Catalogs]
 *     summary: List bank accounts
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create bank account
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/bank_accounts/{id}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update bank account
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete bank account (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Bank Accounts
router.get('/bank_accounts', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getBankAccounts);
router.get('/bank_accounts/:id', authGuard, validate_id_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getBankAccountById);
router.post('/bank_accounts', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createBankAccountSchema), catalogController.createBankAccount);
router.put('/bank_accounts/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateBankAccountSchema), catalogController.updateBankAccount);
router.delete('/bank_accounts/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteBankAccount);

/**
 * @swagger
 * /catalogs/fields:
 *   get:
 *     tags: [Catalogs]
 *     summary: List fields
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create field
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/fields/{id}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update field
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete field (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Fields
router.get('/fields', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getFields);
router.get('/fields/:id', authGuard, validate_id_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getFieldById);
router.post('/fields', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createFieldSchema), catalogController.createField);
router.put('/fields/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateFieldSchema), catalogController.updateField);
router.delete('/fields/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteField);

/**
 * @swagger
 * /catalogs/documents:
 *   get:
 *     tags: [Catalogs]
 *     summary: List documents
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [tm, ru], default: tm }
 *       - in: query
 *         name: localized
 *         schema:
 *           type: boolean
 *           default: true
 *         description: true returns single localized title; false returns title_tm/title_ru
 *   post:
 *     tags: [Catalogs]
 *     summary: Create document
 *     security: [ { bearerAuth: [] } ]
 * /catalogs/documents/{id}:
 *   put:
 *     tags: [Catalogs]
 *     summary: Update document
 *     security: [ { bearerAuth: [] } ]
 *   delete:
 *     tags: [Catalogs]
 *     summary: Delete document (soft)
 *     security: [ { bearerAuth: [] } ]
 */
// Documents
router.get('/documents', authGuard, require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getDocuments);
router.get('/documents/:id', authGuard, validate_id_param(), require_permissions('CATALOG_READ'), validate_lang_query(), catalogController.getDocumentById);
router.post('/documents', authGuard, require_permissions('CATALOG_WRITE'), schemaValidator(createDocumentSchema), catalogController.createDocument);
router.put('/documents/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), schemaValidator(updateDocumentSchema), catalogController.updateDocument);
router.delete('/documents/:id', authGuard, validate_id_param(), require_permissions('CATALOG_WRITE'), catalogController.deleteDocument);

module.exports = router;

