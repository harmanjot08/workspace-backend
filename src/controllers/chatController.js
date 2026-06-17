import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';
export const createChat = async (req, res) => {
    try {
        const { participantIds, chatName, isGroup } = req.body;
        const { id: userId, companyId } = req.user;
        if (!participantIds || participantIds.length === 0) {
            throw new ValidationError('Participant IDs required');
        }
        if (!isGroup && participantIds.length !== 1) {
            throw new ValidationError('DM requires exactly 1 participant');
        }
        if (!isGroup) {
            const existingChat = await prisma.chat.findFirst({
                where: {
                    isGroup: false,
                    chatMembers: {
                        every: {
                            userId: {
                                in: [...participantIds, userId],
                            },
                        },
                    },
                },
            });
            if (existingChat) {
                return res.status(200).json({
                    message: 'Chat already exists',
                    chat: existingChat,
                });
            }
        }
        const chat = await prisma.chat.create({
            data: {
                name: isGroup ? chatName : null,
                isGroup,
                createdBy: userId,
                companyId,
                chatMembers: {
                    create: [
                        { userId },
                        ...participantIds.map(id => ({ userId: id })),
                    ],
                },
            },
            include: {
                chatMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        logger.info(`Chat created: ${chat.id}`);
        res.status(201).json({
            message: 'Chat created',
            chat,
        });
    } catch (error) {
        logger.error('Create chat error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const getChats = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const chats = await prisma.chat.findMany({
            where: {
                chatMembers: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                chatMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        content: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.status(200).json({
            message: 'Chats fetched',
            chats,
            count: chats.length,
        });
    } catch (error) {
        logger.error('Get chats error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
export const getChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { id: userId } = req.user;
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                chatMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        reactions: true,
                        readReceipts: true,
                    },
                },
            },
        });
        if (!chat) {
            throw new NotFoundError('Chat not found');
        }
        res.status(200).json({
            message: 'Chat fetched',
            chat,
        });
    } catch (error) {
        logger.error('Get chat error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const { id: userId } = req.user;  // Current user se ID le

        if (!content || content.trim() === '') {
            throw new ValidationError('Message content required');
        }

        const message = await prisma.message.create({
            data: {
                content,
                chatId,
                userId,  // Ye correct user ID hona chahiye
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info(`Message sent: ${message.id}`);
        res.status(201).json({
            message: 'Message sent',
            data: message,
        });
    } catch (error) {
        logger.error('Send message error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const { id: userId } = req.user;
        if (!emoji) {
            throw new ValidationError('Emoji required');
        }
        const reaction = await prisma.reaction.create({
            data: {
                emoji,
                messageId,
                userId,
            },
        });
        logger.info(`Reaction added: ${reaction.id}`);
        res.status(201).json({
            message: 'Reaction added',
            reaction,
        });
    } catch (error) {
        logger.error('Add reaction error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { deleteType } = req.body; // 'everyone' or 'me'
        const { id: userId } = req.user;

        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundError('Message not found');
        }

        if (message.userId !== userId) {
            throw new ValidationError('Can only delete own messages');
        }

        if (deleteType === 'everyone') {
            // Delete for everyone - remove message completely
            await prisma.message.delete({
                where: { id: messageId },
            });
            logger.info(`Message deleted for everyone: ${messageId}`);
        } else if (deleteType === 'me') {
            // Delete for me - just mark as deleted
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    content: '[This message was deleted]',
                    isDeleted: true,
                },
            });
            logger.info(`Message deleted for user: ${messageId}`);
        }

        res.status(200).json({
            message: 'Message deleted',
            deleteType,
        });
    } catch (error) {
        logger.error('Delete message error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { id: userId } = req.user;
        const existing = await prisma.readReceipt.findFirst({
            where: {
                messageId,
                userId,
            },
        });
        if (existing) {
            return res.status(200).json({
                message: 'Already marked as read',
            });
        }
        await prisma.readReceipt.create({
            data: {
                messageId,
                userId,
            },
        });
        logger.info(`Message marked as read: ${messageId}`);
        res.status(200).json({
            message: 'Message marked as read',
        });
    } catch (error) {
        logger.error('Mark as read error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const addMember = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId: newMemberId } = req.body;
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
        });
        if (!chat || !chat.isGroup) {
            throw new ValidationError('Can only add members to group chats');
        }
        const member = await prisma.chatMember.create({
            data: {
                chatId,
                userId: newMemberId,
            },
        });
        logger.info(`Member added to chat: ${chatId}`);
        res.status(201).json({
            message: 'Member added',
            member,
        });
    } catch (error) {
        logger.error('Add member error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const removeMember = async (req, res) => {
    try {
        const { chatId, memberId } = req.params;
        await prisma.chatMember.deleteMany({
            where: {
                chatId,
                userId: memberId,
            },
        });
        logger.info(`Member removed from chat: ${chatId}`);
        res.status(200).json({
            message: 'Member removed',
        });
    } catch (error) {
        logger.error('Remove member error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const archiveChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await prisma.chat.update({
            where: { id: chatId },
            data: { isArchived: true },
        });
        logger.info(`Chat archived: ${chatId}`);
        res.status(200).json({
            message: 'Chat archived',
            chat,
        });
    } catch (error) {
        logger.error('Archive chat error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};