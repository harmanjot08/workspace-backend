import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { roleCheck } from '../middleware/roleCheck.middleware.js';
import * as roleController from '../controllers/role.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', roleController.getRoles);
router.post('/', roleCheck('manager', 'admin'), roleController.createRole);
router.delete('/:roleId', roleCheck('manager', 'admin'), roleController.deleteRole);
router.post('/:roleId/assign', roleCheck('manager', 'admin'), roleController.assignUserToRole);
router.delete('/:roleId/users/:userId', roleCheck('manager', 'admin'), roleController.removeUserFromRole);

export default router;