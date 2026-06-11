import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errorHandler.js';
import * as authService from '../services/authService.js';
export const getAllUsers = async (req, res) => {
    try {
        const { companyId } = req.user;
        const users = await prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                isActive: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            message: 'Users fetched',
            users,
            count: users.length,
        });
    } catch (error) {
        logger.error('Get users error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
export const getUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                phone: true,
                profilePicture: true,
                isActive: true,
                createdAt: true,
                company: {
                    select: { name: true },
                },
            },
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(200).json({
            message: 'User fetched',
            user,
        });
    } catch (error) {
        logger.error('Get user error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const createUser = async (req, res) => {
    try {
        const { name, email, role, department, phone } = req.body;
        const { companyId } = req.user;
        if (!name || !email || !role) {
            throw new ValidationError('Name, email, role required');
        }
        const tempPassword = Math.random().toString(36).slice(-8) + 'Temp@1';
        const user = await authService.createUser({
            name,
            email,
            password: tempPassword,
            role,
            companyId,
            department: department || null,
        });
        logger.info(`User created: ${email}`);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            },
            tempPassword,
        });
    } catch (error) {
        logger.error('Create user error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, role, department, phone, isActive } = req.body;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name || undefined,
                role: role || undefined,
                department: department || undefined,
                phone: phone || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                isActive: true,
            },
        });
        logger.info(`User updated: ${userId}`);
        res.status(200).json({
            message: 'User updated',
            user,
        });
    } catch (error) {
        logger.error('Update user error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.user.delete({
            where: { id: userId },
        });
        logger.info(`User deleted: ${userId}`);
        res.status(200).json({
            message: 'User deleted successfully',
        });
    } catch (error) {
        logger.error('Delete user error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const bulkUploadUsers = async (req, res) => {
    try {
        const { users } = req.body;
        const { companyId } = req.user;
        if (!Array.isArray(users) || users.length === 0) {
            throw new ValidationError('Users array required');
        }
        const results = [];
        for (const userData of users) {
            try {
                const tempPassword = Math.random().toString(36).slice(-8) + 'Temp@1';
                const user = await authService.createUser({
                    name: userData.name,
                    email: userData.email,
                    password: tempPassword,
                    role: userData.role || 'user',
                    companyId,
                    department: userData.department || null,
                });
                results.push({
                    success: true,
                    email: userData.email,
                    message: 'User created',
                    tempPassword,
                });
            } catch (error) {
                results.push({
                    success: false,
                    email: userData.email,
                    message: error.message,
                });
            }
        }
        logger.info(`Bulk upload completed: ${results.filter(r => r.success).length}/${results.length}`);
        res.status(200).json({
            message: 'Bulk upload completed',
            results,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        });
    } catch (error) {
        logger.error('Bulk upload error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const { companyId } = req.user;
        if (!query) {
            throw new ValidationError('Search query required');
        }
        const users = await prisma.user.findMany({
            where: {
                companyId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        res.status(200).json({
            message: 'Search results',
            users,
        });
    } catch (error) {
        logger.error('Search error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const { companyId } = req.user;
        const users = await prisma.user.findMany({
            where: {
                companyId,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
            },
        });
        res.status(200).json({
            message: `Users with role ${role}`,
            users,
            count: users.length,
        });
    } catch (error) {
        logger.error('Get by role error:', error.message);
        res.status(500).json({ message: error.message });
    }
};