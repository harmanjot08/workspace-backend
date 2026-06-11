import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';

export const getRoles = async (req, res) => {
    try {
        const { companyId } = req.user;
        const roles = await prisma.role.findMany({
            where: { companyId },
            include: {
                userRoles: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, department: true }
                        }
                    }
                }
            }
        });
        res.status(200).json({ message: 'Roles fetched', roles });
    } catch (error) {
        logger.error('Get roles error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createRole = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { companyId } = req.user;
        if (!name) throw new ValidationError('Role name required');
        const role = await prisma.role.create({
            data: { name, description, companyId }
        });
        res.status(201).json({ message: 'Role created', role });
    } catch (error) {
        logger.error('Create role error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        await prisma.role.delete({ where: { id: roleId } });
        res.status(200).json({ message: 'Role deleted' });
    } catch (error) {
        logger.error('Delete role error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const assignUserToRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { userId } = req.body;
        if (!userId) throw new ValidationError('User ID required');
        const userRole = await prisma.userRole.create({
            data: { userId, roleId }
        });
        res.status(201).json({ message: 'User assigned to role', userRole });
    } catch (error) {
        logger.error('Assign role error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const removeUserFromRole = async (req, res) => {
    try {
        const { roleId, userId } = req.params;
        await prisma.userRole.deleteMany({
            where: { roleId, userId }
        });
        res.status(200).json({ message: 'User removed from role' });
    } catch (error) {
        logger.error('Remove role error:', error.message);
        res.status(500).json({ message: error.message });
    }
};