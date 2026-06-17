import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { roleCheck } from '../middleware/roleCheck.middleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);

// SPECIFIC ROUTES 
router.post('/bulk/upload', roleCheck('admin'), userController.bulkUploadUsers);
router.get('/search', userController.searchUsers);
router.put('/profile-picture', userController.uploadProfilePicture);

// THEN DYNAMIC ROUTES (parameters wale)
router.get('/role/:role', userController.getUsersByRole);
router.get('/:userId', userController.getUser);
router.put('/users/:userId', userController.updateUser);

// Create user (admin/manager only)
router.post('/', roleCheck('admin', 'manager'), userController.createUser);

// Update user
router.put('/:userId', roleCheck('admin', 'manager'), userController.updateUser);

// Delete user
router.delete('/:userId', roleCheck('admin'), userController.deleteUser);

// Get all users
router.get('/', userController.getAllUsers);

export default router;