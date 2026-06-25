import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';

export const sendEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        const promotionKeywords = [
            'offer',
            'sale',
            'discount',
            'coupon',
            'newsletter',
            'promotion',
            'deal',
            'limited time',
            'special offer',
        ];

        const emailContent = `${subject} ${body}`.toLowerCase();

        const isPromotion = promotionKeywords.some(keyword =>
            emailContent.includes(keyword)
        );

        const spamKeywords = [
            'win money',
            'lottery',
            'free crypto',
            'free bitcoin',
            'claim prize',
            'congratulations you won',
            'earn money fast',
            'click here urgently',
            'guaranteed income',
            'double your money',
        ];

        const isSpam = spamKeywords.some(keyword =>
            emailContent.includes(keyword)
        );

        const userId = req.user.id;

        // Validate
        if (!to || !subject || !body) {
            return res.status(400).json({ message: 'to, subject, body required' });
        }

        // Create email
        const email = await prisma.email.create({
            data: {
                fromUserId: userId,
                subject,
                body,
                isDraft: false,
                folder: 'sent',
                isPromotion,
                recipients: {
                    create: {
                        recipientEmail: to,
                        type: 'to',
                    },
                },
            },
            include: {
                recipients: true,
                fromUser: { select: { id: true, name: true, email: true } },
            },
        });

        logger.info(`Email sent by ${userId} to ${to}`);
        res.status(201).json({ success: true, data: email });
    } catch (error) {
        logger.error('Send email error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getInbox = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                isSpam: false,

                OR: [
                    {
                        fromUserId: userId,
                        folder: 'inbox',
                    },
                    {
                        recipients: {
                            some: {
                                recipientEmail: {
                                    contains: req.user.email,
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                fromUser: { select: { id: true, name: true, email: true } },
                recipients: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        logger.error('Get inbox error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getSentEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                fromUserId: userId,
                folder: 'sent',
            },
            include: {
                recipients: true,
                fromUser: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        logger.error('Get sent emails error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getDrafts = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                fromUserId: userId,
                isDraft: true,
            },
            include: {
                recipients: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        logger.error('Get drafts error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getPromotionEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                isPromotion: true,
                OR: [
                    { fromUserId: userId },
                    {
                        recipients: {
                            some: {
                                recipientEmail: {
                                    contains: req.user.email,
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipients: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            success: true,
            data: emails,
        });
    } catch (error) {
        logger.error('Get promotion emails error:', error.message);

        res.status(500).json({
            error: error.message,
        });
    }
};

export const getSpamEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                isSpam: true,
                OR: [
                    { fromUserId: userId },
                    {
                        recipients: {
                            some: {
                                recipientEmail: {
                                    contains: req.user.email,
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipients: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            success: true,
            data: emails,
        });
    } catch (error) {
        logger.error('Get spam emails error:', error.message);

        res.status(500).json({
            error: error.message,
        });
    }
};

export const getEmailById = async (req, res) => {
    try {
        const { emailId } = req.params;
        const userId = req.user.id;

        const email = await prisma.email.findUnique({
            where: { id: emailId },
            include: {
                fromUser: { select: { id: true, name: true, email: true } },
                recipients: true,
            },
        });

        if (!email) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Mark as read
        if (email.fromUserId !== userId) {
            await prisma.email.update({
                where: { id: emailId },
                data: { isRead: true },
            });
        }

        res.status(200).json({ success: true, data: email });
    } catch (error) {
        logger.error('Get email error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const deleteEmail = async (req, res) => {
    try {
        const { emailId } = req.params;
        const userId = req.user.id;

        const email = await prisma.email.findUnique({ where: { id: emailId } });

        if (!email) {
            return res.status(404).json({ message: 'Email not found' });
        }

        if (email.fromUserId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.email.delete({ where: { id: emailId } });

        logger.info(`Email ${emailId} deleted by ${userId}`);
        res.status(200).json({ success: true, message: 'Email deleted' });
    } catch (error) {
        logger.error('Delete email error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const saveDraft = async (req, res) => {
    try {
        const { to, subject, body, draftId } = req.body;
        const userId = req.user.id;

        if (draftId) {
            // Update existing draft
            const email = await prisma.email.update({
                where: { id: draftId },
                data: {
                    subject,
                    body,
                    recipients: {
                        deleteMany: {},
                        create: {
                            recipientEmail: to,
                            type: 'to',
                        },
                    },
                },
                include: {
                    recipients: true,
                },
            });

            res.status(200).json({ success: true, data: email });
        } else {
            // Create new draft
            const email = await prisma.email.create({
                data: {
                    fromUserId: userId,
                    subject,
                    body,
                    isDraft: true,
                    recipients: {
                        create: {
                            recipientEmail: to,
                            type: 'to',
                        },
                    },
                },
                include: {
                    recipients: true,
                },
            });

            res.status(201).json({ success: true, data: email });
        }
    } catch (error) {
        logger.error('Save draft error:', error.message);
        res.status(500).json({ error: error.message });
    }
};