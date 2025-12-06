const express = require('express');
const router = express.Router();
const catalogController = require('./catalog.controller');
const { authGuard } = require('../../middlewares/auth.guard');

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
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *                 - name: ministries
 *                   version: 2
 *                   updatedAt: "2024-01-16T14:20:00Z"
 */
// Public endpoints for sync
router.get('/versions', catalogController.getVersions);

// Protected endpoints
router.get('/regions', authGuard, catalogController.getRegions);
router.post('/regions', authGuard, catalogController.createRegion);
router.put('/regions/:code', authGuard, catalogController.updateRegion);

router.get('/ministries', authGuard, catalogController.getMinistries);
router.post('/ministries', authGuard, catalogController.createMinistry);
router.put('/ministries/:code', authGuard, catalogController.updateMinistry);

router.get('/organizations', authGuard, catalogController.getOrganizations);
router.post('/organizations', authGuard, catalogController.createOrganization);
router.put('/organizations/:code', authGuard, catalogController.updateOrganization);

// Classifier Economic
router.get('/classifier_economic', authGuard, catalogController.getClassifierEconomic);
router.post('/classifier_economic', authGuard, catalogController.createClassifierEconomic);
router.put('/classifier_economic/:code', authGuard, catalogController.updateClassifierEconomic);
router.delete('/classifier_economic/:code', authGuard, catalogController.deleteClassifierEconomic);

// Classifier Purpose
router.get('/classifier_purpose', authGuard, catalogController.getClassifierPurpose);
router.post('/classifier_purpose', authGuard, catalogController.createClassifierPurpose);
router.put('/classifier_purpose/:code', authGuard, catalogController.updateClassifierPurpose);
router.delete('/classifier_purpose/:code', authGuard, catalogController.deleteClassifierPurpose);

// Classifier Functional
router.get('/classifier_functional', authGuard, catalogController.getClassifierFunctional);
router.post('/classifier_functional', authGuard, catalogController.createClassifierFunctional);
router.put('/classifier_functional/:code', authGuard, catalogController.updateClassifierFunctional);
router.delete('/classifier_functional/:code', authGuard, catalogController.deleteClassifierFunctional);

// Classifier Income
router.get('/classifier_income', authGuard, catalogController.getClassifierIncome);
router.post('/classifier_income', authGuard, catalogController.createClassifierIncome);
router.put('/classifier_income/:code', authGuard, catalogController.updateClassifierIncome);
router.delete('/classifier_income/:code', authGuard, catalogController.deleteClassifierIncome);

// Banks
router.get('/banks', authGuard, catalogController.getBanks);
router.post('/banks', authGuard, catalogController.createBank);
router.put('/banks/:id', authGuard, catalogController.updateBank);
router.delete('/banks/:id', authGuard, catalogController.deleteBank);

// Bank Accounts
router.get('/bank_accounts', authGuard, catalogController.getBankAccounts);
router.post('/bank_accounts', authGuard, catalogController.createBankAccount);
router.put('/bank_accounts/:id', authGuard, catalogController.updateBankAccount);
router.delete('/bank_accounts/:id', authGuard, catalogController.deleteBankAccount);

// Fields
router.get('/fields', authGuard, catalogController.getFields);
router.post('/fields', authGuard, catalogController.createField);
router.put('/fields/:id', authGuard, catalogController.updateField);
router.delete('/fields/:id', authGuard, catalogController.deleteField);

// Documents
router.get('/documents', authGuard, catalogController.getDocuments);
router.post('/documents', authGuard, catalogController.createDocument);
router.put('/documents/:id', authGuard, catalogController.updateDocument);
router.delete('/documents/:id', authGuard, catalogController.deleteDocument);

module.exports = router;

