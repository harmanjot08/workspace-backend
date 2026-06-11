import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as calendarController from '../controllers/calendarController.js';

const router = express.Router();

router.use(authenticate);

// Get all events (company)
router.get('/', calendarController.getEvents);

// Get user events
router.get('/my-events', calendarController.getUserEvents);

// Get single event
router.get('/:eventId', calendarController.getEvent);

// Create event
router.post('/', calendarController.createEvent);

// Update event
router.put('/:eventId', calendarController.updateEvent);

// Delete event
router.delete('/:eventId', calendarController.deleteEvent);

export default router;