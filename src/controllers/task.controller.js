import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';

export const getTasks = async (req, res) => {
    try {
        const { companyId } = req.user;
        const tasks = await prisma.task.findMany({
            where: { companyId },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                creator: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ message: 'Tasks fetched', tasks });
    } catch (error) {
        logger.error('Get tasks error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getUserTasks = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const tasks = await prisma.task.findMany({
            where: { assignedTo: userId },
            include: {
                createdBy: { select: { id: true, name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.status(200).json({
            message: 'User tasks fetched',
            tasks,
            count: tasks.length,
        });
    } catch (error) {
        logger.error('Get user tasks error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, priority, status, dueDate, assignedTo } = req.body;
        const { id: userId, companyId } = req.user;
        if (!title) throw new ValidationError('Title required');
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'Medium',
                status: status || 'Pending',
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedTo: assignedTo || null,
                createdBy: userId,
                companyId,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true } }
            }
        });
        res.status(201).json({ message: 'Task created', task });
    } catch (error) {
        logger.error('Create task error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, priority, status, dueDate, assignedTo } = req.body;
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: title || undefined,
                description: description || undefined,
                priority: priority || undefined,
                status: status || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                assignedTo: assignedTo || undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true } }
            }
        });
        res.status(200).json({ message: 'Task updated', task });
    } catch (error) {
        logger.error('Update task error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        await prisma.task.delete({ where: { id: taskId } });
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        logger.error('Delete task error:', error.message);
        res.status(500).json({ message: error.message });
    }
};