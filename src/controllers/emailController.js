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
                userEmails: {
                    some: {
                        userId,
                        folder: 'inbox',
                        isSpam: false,
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

        const inboxEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
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

        const sentEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
        }));

        res.status(200).json({ success: true, data: sentEmails });
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
                isDraft: true,
                userEmails: {
                    some: {
                        userId,
                        folder: 'drafts',
                    },
                },
            },
            include: {
                recipients: true,

                userEmails: {
                    where: {
                        userId,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const draftEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
        }));

        res.status(200).json({
            success: true,
            data: draftEmails,
        });
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
                userEmails: {
                    some: {
                        userId,
                        isPromotion: true,
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

        const promotionEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
        }));

        res.status(200).json({
            success: true,
            data: promotionEmails,
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
                userEmails: {
                    some: {
                        userId,
                        isSpam: true,
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

        const spamEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
        }));

        res.status(200).json({
            success: true,
            data: spamEmails,
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

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        if (!userEmail) {
            return res.status(404).json({
                message: 'Email not found',
            });
        }

        await prisma.userEmail.update({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
            data: {
                isStarred: !userEmail.isStarred,
            },
        });

        res.status(200).json({
            success: true,
            starred: !userEmail.isStarred,
        });
    } catch (error) {
        logger.error('Toggle starred email error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getStarredEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const starredEmails = await prisma.userEmail.findMany({
            where: {
                userId,
                isStarred: true,
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
                updatedAt: 'desc',
            },
        });

        const emails = starredEmails.map(item => ({
            ...item.email,
            isStarred: true,
        }));

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

        const starredEmails = await prisma.userEmail.findMany({
            where: {
                userId,
                isStarred: true,
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

        if (!userEmail) {
            return res.status(404).json({
                message: 'Email not found',
            });
        }

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

        if (!userEmail) {
            return res.status(404).json({
                message: 'Email not found',
            });
        }

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
                        userEmails: {
                            some: {
                                userId,
                            },
                        },
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
            },

            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log("Total emails:", emails.length);

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

            const emailWithFlags = {
                ...email,
                isStarred: userEmail.isStarred,
            };

            // Inbox
            if (
                !email.isDraft &&
                userEmail.folder === 'inbox' &&
                !userEmail.isSpam
            ) {
                groupedResults.inbox.push(emailWithFlags);
            }

            // Sent
            if (userEmail.folder === 'sent') {
                groupedResults.sent.push(emailWithFlags);
            }

            // Drafts
            if (email.isDraft && userEmail.folder === 'drafts') {
                groupedResults.drafts.push(emailWithFlags);
            }

            // Promotions
            if (userEmail.isPromotion) {
                groupedResults.promotions.push(emailWithFlags);
            }

            // Spam
            if (userEmail.isSpam) {
                groupedResults.spam.push(emailWithFlags);
            }

            // Starred
            if (userEmail.isStarred) {
                groupedResults.starred.push(emailWithFlags);
            }

            // Trash
            if (userEmail.folder === 'trash') {
                groupedResults.trash.push(emailWithFlags);
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

        const trashEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
        }));

        res.status(200).json({
            success: true,
            data: trashEmails,
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