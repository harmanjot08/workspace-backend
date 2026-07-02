import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { deliverEmail } from '../services/internalEmailService.js';

export const sendEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body;

        const userId = req.user.id;

        if (!to || !subject || !body) {
            return res.status(400).json({
                message: 'to, subject, body required',
            });
        }

        const email = await deliverEmail({
            userId,
            to,
            subject,
            body,
        });

        res.status(201).json({
            success: true,
            data: email,
        });
    } catch (error) {
        logger.error('Send email error:', error.message);

        res.status(500).json({
            error: error.message,
        });
    }
};

export const scheduleEmail = async (req, res) => {
    try {
        const { to, subject, body, scheduledFor } = req.body;
        const userId = req.user.id;

        if (!to || !subject || !body || !scheduledFor) {
            return res.status(400).json({
                message: 'to, subject, body and scheduledFor are required',
            });
        }

        const recipientUser = await prisma.user.findUnique({
            where: {
                email: to,
            },
        });

        const email = await prisma.email.create({
            data: {
                fromUserId: userId,
                subject,
                body,
                isDraft: false,
                recipients: {
                    create: {
                        recipientEmail: to,
                        recipientUserId: recipientUser?.id,
                        type: 'to',
                    },
                },
            },
        });

        await prisma.userEmail.create({
            data: {
                emailId: email.id,
                userId,
                folder: 'scheduled',
                isScheduled: true,
                scheduledFor: new Date(scheduledFor),
                isSent: false,
                isRead: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Email scheduled successfully.',
            data: email,
        });

    } catch (error) {
        logger.error('Schedule email error:', error.message);

        res.status(500).json({
            error: error.message,
        });
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
                        isPromotion: false,
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
            isRead: item.isRead,
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

export const getImportantEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const emails = await prisma.email.findMany({
            where: {
                userEmails: {
                    some: {
                        userId,
                        isImportant: true,
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

        emails.sort(
            (a, b) =>
                (b.userEmails[0]?.importanceScore ?? 0) -
                (a.userEmails[0]?.importanceScore ?? 0)
        );

        const importantEmails = emails.map(email => ({
            ...email,
            isStarred: email.userEmails[0]?.isStarred ?? false,
            isRead: email.userEmails[0]?.isRead ?? false,
            isImportant: email.userEmails[0]?.isImportant ?? false,
            importanceScore: email.userEmails[0]?.importanceScore ?? 0,
        }));

        res.status(200).json({
            success: true,
            data: importantEmails,
        });
    } catch (error) {
        logger.error('Get important emails error:', error.message);
        res.status(500).json({
            error: error.message,
        });
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
        await prisma.userEmail.update({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
            data: {
                isRead: true,
            },
        });

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

        console.log("Delete emailId:", emailId);
        console.log("Current userId:", userId);

        const email = await prisma.email.findUnique({
            where: {
                id: emailId,
            },
        });

        console.log("Email found:", email);

        if (!email) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        if (!userEmail) {
            return res.status(403).json({
                message: 'Not authorized',
            });
        }

        await prisma.userEmail.delete({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        const remainingCopies = await prisma.userEmail.count({
            where: {
                emailId,
            },
        });

        if (remainingCopies === 0) {
            await prisma.email.delete({
                where: {
                    id: emailId,
                },
            });
        }

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

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        if (!email || !userEmail) {
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

        const userEmail = await prisma.userEmail.findUnique({
            where: {
                emailId_userId: {
                    emailId,
                    userId,
                },
            },
        });

        if (!email || !userEmail) {
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
            important: [],
            starred: [],
            trash: [],
        };

        emails.forEach((email) => {

            const userEmail = email.userEmails[0];

            if (!userEmail) return;

            const emailWithFlags = {
                ...email,
                isStarred: userEmail.isStarred,
                isRead: userEmail.isRead,
                isImportant: userEmail.isImportant,
                importanceScore: userEmail.importanceScore,
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

            // Important
            if (userEmail.isImportant) {
                groupedResults.important.push(emailWithFlags);
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
            isRead: email.userEmails[0]?.isRead ?? false,
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
                            isRead: true,
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