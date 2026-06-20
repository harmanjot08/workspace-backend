import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as meetingController from '../controllers/meetingController.js';

const router = express.Router();

router.use(authenticate);

// Validate meeting link
router.get('/validate/:meetingId', meetingController.validateMeeting);

export default router;