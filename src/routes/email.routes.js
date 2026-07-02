import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Send email
router.post('/send', emailController.sendEmail);

//schedule send
router.post('/schedule', emailController.scheduleEmail);

// Get inbox
router.get('/inbox', emailController.getInbox);

// Get sent emails
router.get('/sent', emailController.getSentEmails);

// Get drafts
router.get('/drafts', emailController.getDrafts);

// Get Promotions
router.get('/promotions', emailController.getPromotionEmails);

//Get Spam mail
router.get('/spam', emailController.getSpamEmails);

// Get Starred emails
router.get('/starred', emailController.getStarredEmails);

router.get('/important', emailController.getImportantEmails);

router.get('/trash', emailController.getTrashEmails);

//returns only the IDs of the starred emails of user
router.get('/starred/ids', emailController.getStarredEmailIds);

// endpoint to star or unstar an email
router.patch('/:emailId/star', emailController.toggleStarredEmail);

router.get('/search', emailController.searchEmails);

// Get single email
router.get('/:emailId', emailController.getEmailById);

// Save draft
router.post('/draft/save', emailController.saveDraft);

// Delete email
router.delete('/:emailId', emailController.deleteEmail);

// move email to trash
router.patch('/:emailId/trash', emailController.moveToTrash);

// restore an email from trash
router.patch('/:emailId/restore', emailController.restoreEmail);

export default router;