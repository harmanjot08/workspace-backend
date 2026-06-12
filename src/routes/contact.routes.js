import express from 'express';
import * as contactController from '../controllers/contactController.js';

const router = express.Router();

// Public route - no authentication needed
router.post('/send', contactController.sendContactMessage);

export default router;