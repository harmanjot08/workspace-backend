import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

router.use(authenticate);

// Chat routes
router.post('/', chatController.createChat);
router.get('/', chatController.getChats);
router.get('/:chatId', chatController.getChat);
router.put('/:chatId/pin', chatController.pinChat);
router.put('/:chatId/unpin', chatController.unpinChat);chatApi.js

// Message routes
router.post('/:chatId/messages', chatController.sendMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/messages/:messageId/read', chatController.markAsRead);

// Reaction routes
router.post('/messages/:messageId/reactions', chatController.addReaction);

// Member routes
router.post('/:chatId/members', chatController.addMember);
router.delete('/:chatId/members/:memberId', chatController.removeMember);

// Archive routes
router.put('/:chatId/archive', chatController.archiveChat);

export default router;