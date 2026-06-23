import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Send email
router.post('/send', emailController.sendEmail);

// Get inbox
router.get('/inbox', emailController.getInbox);

// Get sent emails
router.get('/sent', emailController.getSentEmails);

// Get drafts
router.get('/drafts', emailController.getDrafts);

// Get single email
router.get('/:emailId', emailController.getEmailById);

// Save draft
router.post('/draft/save', emailController.saveDraft);

// Delete email
router.delete('/:emailId', emailController.deleteEmail);

export default router;