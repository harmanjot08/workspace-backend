import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';

// ===== COMPANIES =====

export const createCompany = async (req, res) => {
    try {
        const { name, email, plan } = req.body;

        if (!name || !email) {
            throw new ValidationError('Name and email required');
        }

        const company = await prisma.company.create({
            data: {
                name,
                email,
                plan: plan || 'FREE',
            },
            include: {
                subscriptions: { include: { plan: true } },
                users: { select: { id: true } },
            },
        });

        logger.info(`Company created: ${company.id}`);

        res.status(201).json({
            message: 'Company created',
            company,
        });
    } catch (error) {
        logger.error('Create company error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: {
                subscriptions: {
                    include: { plan: true },
                },
                users: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            message: 'Companies fetched',
            companies,
            count: companies.length,
        });
    } catch (error) {
        logger.error('Get companies error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: {
                subscriptions: { include: { plan: true } },
                users: { select: { id: true, name: true, email: true, role: true } },
            },
        });

        if (!company) {
            throw new NotFoundError('Company not found');
        }

        res.status(200).json({
            message: 'Company fetched',
            company,
        });
    } catch (error) {
        logger.error('Get company error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, email, plan } = req.body;

        const company = await prisma.company.update({
            where: { id: companyId },
            data: {
                name: name || undefined,
                email: email || undefined,
                plan: plan || undefined,
            },
            include: { subscriptions: { include: { plan: true } } },
        });

        logger.info(`Company updated: ${companyId}`);

        res.status(200).json({
            message: 'Company updated',
            company,
        });
    } catch (error) {
        logger.error('Update company error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        await prisma.company.delete({
            where: { id: companyId },
        });

        logger.info(`Company deleted: ${companyId}`);

        res.status(200).json({
            message: 'Company deleted',
        });
    } catch (error) {
        logger.error('Delete company error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ===== PRICING PLANS =====

export const getAllPricingPlans = async (req, res) => {
    try {
        const plans = await prisma.pricingPlan.findMany({
            include: {
                subscriptions: { select: { id: true } },
            },
            orderBy: { price: 'asc' },
        });

        res.status(200).json({
            message: 'Pricing plans fetched',
            plans,
            count: plans.length,
        });
    } catch (error) {
        logger.error('Get pricing plans error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createPricingPlan = async (req, res) => {
    try {
        const { name, description, price, billingCycle, features, maxUsers, maxStorage } = req.body;

        if (!name || !price) {
            throw new ValidationError('Name and price required');
        }

        const plan = await prisma.pricingPlan.create({
            data: {
                name,
                description,
                price,
                billingCycle: billingCycle || 'monthly',
                features: features || [],
                maxUsers: maxUsers || null,
                maxStorage: maxStorage || null,
            },
        });

        logger.info(`Pricing plan created: ${plan.id}`);

        res.status(201).json({
            message: 'Pricing plan created',
            plan,
        });
    } catch (error) {
        logger.error('Create pricing plan error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const updatePricingPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const { name, description, price, features, maxUsers, maxStorage, isActive } = req.body;

        const plan = await prisma.pricingPlan.update({
            where: { id: planId },
            data: {
                name: name || undefined,
                description: description || undefined,
                price: price || undefined,
                features: features || undefined,
                maxUsers: maxUsers || undefined,
                maxStorage: maxStorage || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });

        logger.info(`Pricing plan updated: ${planId}`);

        res.status(200).json({
            message: 'Pricing plan updated',
            plan,
        });
    } catch (error) {
        logger.error('Update pricing plan error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const deletePricingPlan = async (req, res) => {
    try {
        const { planId } = req.params;

        await prisma.pricingPlan.delete({
            where: { id: planId },
        });

        logger.info(`Pricing plan deleted: ${planId}`);

        res.status(200).json({
            message: 'Pricing plan deleted',
        });
    } catch (error) {
        logger.error('Delete pricing plan error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ===== SUBSCRIPTIONS =====

export const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            include: {
                company: { select: { id: true, name: true, email: true } },
                plan: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            message: 'Subscriptions fetched',
            subscriptions,
            count: subscriptions.length,
        });
    } catch (error) {
        logger.error('Get subscriptions error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createSubscription = async (req, res) => {
    try {
        const { companyId, planId, startDate, endDate } = req.body;

        if (!companyId || !planId) {
            throw new ValidationError('Company ID and Plan ID required');
        }

        const subscription = await prisma.subscription.create({
            data: {
                companyId,
                planId,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                renewalDate: endDate ? new Date(endDate) : null,
            },
            include: {
                company: true,
                plan: true,
            },
        });

        logger.info(`Subscription created: ${subscription.id}`);

        res.status(201).json({
            message: 'Subscription created',
            subscription,
        });
    } catch (error) {
        logger.error('Create subscription error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const updateSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { status, endDate, renewalDate } = req.body;

        const subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: status || undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                renewalDate: renewalDate ? new Date(renewalDate) : undefined,
            },
            include: {
                company: true,
                plan: true,
            },
        });

        logger.info(`Subscription updated: ${subscriptionId}`);

        res.status(200).json({
            message: 'Subscription updated',
            subscription,
        });
    } catch (error) {
        logger.error('Update subscription error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'cancelled' },
        });

        logger.info(`Subscription cancelled: ${subscriptionId}`);

        res.status(200).json({
            message: 'Subscription cancelled',
            subscription,
        });
    } catch (error) {
        logger.error('Cancel subscription error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ===== ANALYTICS =====

export const getAnalytics = async (req, res) => {
    try {
        const totalCompanies = await prisma.company.count();
        const totalUsers = await prisma.user.count();
        const activeSubscriptions = await prisma.subscription.count({
            where: { status: 'active' },
        });

        const subscriptionsByPlan = await prisma.subscription.groupBy({
            by: ['planId'],
            _count: true,
            where: { status: 'active' },
        });

        const revenue = await prisma.subscription.findMany({
            where: { status: 'active' },
            include: { plan: { select: { price: true } } },
        });

        const totalRevenue = revenue.reduce((sum, sub) => sum + (sub.plan.price || 0), 0);

        res.status(200).json({
            message: 'Analytics fetched',
            analytics: {
                totalCompanies,
                totalUsers,
                activeSubscriptions,
                totalRevenue,
                subscriptionsByPlan,
            },
        });
    } catch (error) {
        logger.error('Get analytics error:', error.message);
        res.status(500).json({ message: error.message });
    }
};