import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { roleCheck } from '../middleware/roleCheck.middleware.js';
import * as taskController from '../controllers/task.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', taskController.getTasks);
router.post('/', roleCheck('manager', 'admin'), taskController.createTask);
router.put('/:taskId', roleCheck('manager', 'admin'), taskController.updateTask);
router.delete('/:taskId', roleCheck('manager', 'admin'), taskController.deleteTask);

export default router;