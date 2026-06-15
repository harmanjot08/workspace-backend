import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { roleCheck } from '../middleware/roleCheck.middleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(roleCheck('admin'));

// ===== COMPANIES =====
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/:companyId', adminController.getCompany);
router.post('/companies', adminController.createCompany);
router.put('/companies/:companyId', adminController.updateCompany);

// ===== PRICING PLANS =====
router.get('/pricing-plans', adminController.getAllPricingPlans);
router.post('/pricing-plans', adminController.createPricingPlan);
router.put('/pricing-plans/:planId', adminController.updatePricingPlan);
router.delete('/pricing-plans/:planId', adminController.deletePricingPlan);

// ===== SUBSCRIPTIONS =====
router.get('/subscriptions', adminController.getAllSubscriptions);
router.post('/subscriptions', adminController.createSubscription);
router.put('/subscriptions/:subscriptionId', adminController.updateSubscription);
router.delete('/subscriptions/:subscriptionId', adminController.cancelSubscription);

// ===== ANALYTICS =====
router.get('/analytics', adminController.getAnalytics);

export default router;