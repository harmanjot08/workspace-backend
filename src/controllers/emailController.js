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

        console.log('isSpam:', isSpam);
        console.log('subject:', subject);

        const userId = req.user.id;

        // Validate
        if (!to || !subject || !body) {
            return res.status(400).json({ message: 'to, subject, body required' });
        }

        const recipientUser = await prisma.user.findUnique({
            where: {
                email: to,
            },
        });

        // Create email
        const email = await prisma.email.create({
            data: {
                fromUserId: userId,
                subject,
                body,
                isDraft: false,
                folder: 'sent',
                isPromotion,
                isSpam,
                recipients: {
                    create: {
                        recipientEmail: to,
                        recipientUserId: recipientUser?.id,
                        type: 'to',
                    },
                },
            },
            include: {
                recipients: true,
                fromUser: { select: { id: true, name: true, email: true } },
            },
        });

        // Create sender's email state
        await prisma.userEmail.create({
            data: {
                emailId: email.id,
                userId,
                folder: 'sent',
                isRead: true,
                isSpam,
                isPromotion,
            },
        });

        // Create recipient's email state
        if (recipientUser) {
            await prisma.userEmail.create({
                data: {
                    emailId: email.id,
                    userId: recipientUser.id,
                    folder: 'inbox',
                    isRead: false,
                    isSpam,
                    isPromotion,
                },
            });
        }

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

                userEmails: {
                    some: {
                        userId,
                        folder: 'inbox',
                    },
                },
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

                userEmails: {
                    where: {
                        userId,
                    },
                },

                starredBy: {
                    where: {
                        userId,
                    },
                    select: {
                        id: true,
                    },
                },
            },

            orderBy: {
                createdAt: 'desc',
            },
        });

        const inboxEmails = emails.map(email => ({
            ...email,
            isStarred: email.starredBy.length > 0,
        }));

        res.status(200).json({
            success: true,
            data: inboxEmails,
        });
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
                userEmails: {
                    some: {
                        userId,
                        folder: 'sent',
                    },
                },
            },
            include: {
                recipients: true,
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },

                userEmails: {
                    where: {
                        userId,
                    },
                },
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

export const toggleStarredEmail = async (req, res) => {
    try {
        const { emailId } = req.params;
        const userId = req.user.id;

        const existingStar = await prisma.starredEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        if (existingStar) {
            await prisma.starredEmail.delete({
                where: {
                    emailId_userId: {
                        emailId,
                        userId,
                    },
                },
            });

            return res.status(200).json({
                success: true,
                starred: false,
            });
        }

        await prisma.starredEmail.create({
            data: {
                emailId,
                userId,
            },
        });

        res.status(200).json({
            success: true,
            starred: true,
        });
    } catch (error) {
        logger.error('Toggle starred email error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getStarredEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const starredEmails = await prisma.starredEmail.findMany({
            where: {
                userId,
            },
            include: {
                email: {
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
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const emails = starredEmails.map((item) => item.email);

        res.status(200).json({
            success: true,
            data: emails,
        });
    } catch (error) {
        logger.error('Get starred emails error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getStarredEmailIds = async (req, res) => {
    try {
        const userId = req.user.id;

        const starredEmails = await prisma.starredEmail.findMany({
            where: {
                userId,
            },
            select: {
                emailId: true,
            },
        });

        res.status(200).json({
            success: true,
            data: starredEmails.map(email => email.emailId),
        });
    } catch (error) {
        logger.error('Get starred email ids error:', error.message);
        res.status(500).json({ error: error.message });
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

export const moveToTrash = async (req, res) => {
    try {
        const { emailId } = req.params;
        const userId = req.user.id;

        const email = await prisma.email.findUnique({
            where: {
                id: emailId,
            },
        });

        if (!email) {
            return res.status(404).json({
                message: 'Email not found',
            });
        }

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        await prisma.userEmail.update({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
            data: {
                previousFolder: userEmail.folder,
                folder: 'trash',
            },
        });

        logger.info(`Email ${emailId} moved to trash by ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Email moved to trash',
        });
    } catch (error) {
        logger.error('Move to trash error:', error.message);
        res.status(500).json({
            error: error.message,
        });
    }
};

export const restoreEmail = async (req, res) => {
    try {
        const { emailId } = req.params;
        const userId = req.user.id;

        const email = await prisma.email.findUnique({
            where: {
                id: emailId,
            },
        });

        if (!email) {
            return res.status(404).json({
                message: 'Email not found',
            });
        }

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        await prisma.userEmail.update({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
            data: {
                folder: userEmail.previousFolder,
                previousFolder: null,
            },
        });

        logger.info(`Email ${emailId} restored by ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Email restored successfully',
        });
    } catch (error) {
        logger.error('Restore email error:', error.message);

        res.status(500).json({
            error: error.message,
        });
    }
};

export const searchEmails = async (req, res) => {
    console.log("searchEmails endpoint hit");

    try {
        const userId = req.user.id;
        const search = req.query.q?.trim();

        if (!search) {
            return res.status(400).json({
                message: 'Search query is required',
            });
        }

        const emails = await prisma.email.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                fromUserId: userId,
                            },
                            {
                                recipients: {
                                    some: {
                                        recipientEmail: req.user.email,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        OR: [
                            {
                                subject: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                body: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                fromUser: {
                                    name: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                            {
                                fromUser: {
                                    email: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                            {
                                recipients: {
                                    some: {
                                        recipientEmail: {
                                            contains: search,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            },
                        ],
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

                userEmails: {
                    where: {
                        userId,
                    },
                },

                starredBy: {
                    where: {
                        userId,
                    },
                },
            },

            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(
            emails.map(email => ({
                subject: email.subject,
                folder: email.userEmails[0]?.folder,
                isSpam: email.userEmails[0]?.isSpam,
                isStarred: email.starredBy.length > 0,
            }))
        );

        const groupedResults = {
            inbox: [],
            sent: [],
            drafts: [],
            promotions: [],
            spam: [],
            starred: [],
            trash: [],
        };

        emails.forEach((email) => {

            const userEmail = email.userEmails[0];

            if (!userEmail) return;

            // Inbox
            if (
                !email.isDraft &&
                userEmail.folder === 'inbox' &&
                !userEmail.isSpam
            ) {
                groupedResults.inbox.push(email);
            }

            // Sent
            if (userEmail.folder === 'sent') {
                groupedResults.sent.push(email);
            }

            // Drafts
            if (email.isDraft && userEmail.folder === 'drafts') {
                groupedResults.drafts.push(email);
            }

            // Promotions
            if (userEmail.isPromotion) {
                groupedResults.promotions.push(email);
            }

            // Spam
            if (userEmail.isSpam) {
                groupedResults.spam.push(email);
            }

            // Starred
            if (email.starredBy.length > 0) {
                groupedResults.starred.push(email);
            }

            // Trash
            if (userEmail.folder === 'trash') {
                groupedResults.trash.push(email);
            }

        });

        const total = emails.length;

        res.status(200).json({
            success: true,
            total,
            results: groupedResults,
        });

    } catch (error) {
        logger.error('Search email error:', error.message);

        res.status(500).json({
            error: error.message,
        });
    }
};

export const getTrashEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                userEmails: {
                    some: {
                        userId,
                        folder: 'trash',
                    },
                },
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

                userEmails: {
                    where: {
                        userId,
                    },
                },
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
        logger.error('Get trash emails error:', error.message);
        res.status(500).json({
            error: error.message,
        });
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
                    userEmails: {
                        create: {
                            userId,
                            folder: 'drafts',
                        },
                    },
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