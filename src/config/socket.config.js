import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
let io;
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        } else {
            next(new Error('No token provided'));
        }
    });

    const onlineUsers = new Map();
    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.id}`);
        socket.on('user-online', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('user-status', {
                userId,
                status: 'online',
                onlineCount: onlineUsers.size,
            });
            logger.info(`User online: ${userId}`);
        });
        socket.on('join-chat', (chatId) => {
            socket.join(`chat-${chatId}`);
            logger.info(`User ${socket.id} joined chat: ${chatId}`);
        });
        socket.on('send-message', (data) => {
            io.to(`chat-${data.chatId}`).emit('receive-message', {
                id: data.id,
                content: data.content,
                chatId: data.chatId,
                userId: data.userId,
                userName: data.userName,
                createdAt: new Date(),
            });
            logger.info(`Message sent in chat: ${data.chatId}`);
        });
        socket.on('typing', (data) => {
            io.to(`chat-${data.chatId}`).emit('user-typing', {
                chatId: data.chatId,
                userId: data.userId,
                userName: data.userName,
            });
        });
        socket.on('stop-typing', (data) => {
            io.to(`chat-${data.chatId}`).emit('user-stopped-typing', {
                chatId: data.chatId,
                userId: data.userId,
            });
        });
        socket.on('add-reaction', (data) => {
            io.to(`chat-${data.chatId}`).emit('reaction-added', {
                messageId: data.messageId,
                emoji: data.emoji,
                userId: data.userId,
            });
        });
        socket.on('join-meeting', (meetingId) => {
            // Add expiry check at the start
            const parts = meetingId.split('-');
            const createdAt = parseInt(parts[1]);
            const now = Date.now();
            const expiryTime = 60 * 60 * 1000; // 1 hour

            if (now - createdAt > expiryTime) {
                socket.emit('meeting-expired', {
                    message: 'Meeting link has expired. Please ask for a new link.'
                });
                logger.info(`User ${socket.id} tried to join expired meeting: ${meetingId}`);
                return; // Exit - don't join
            }

            // If not expired, proceed with original code
            socket.join(`meeting-${meetingId}`);

            const room = io.sockets.adapter.rooms.get(`meeting-${meetingId}`);
            const participantsInRoom = Array.from(room || []).filter(id => id !== socket.id);

            // Get user data for all participants
            const participants = [];
            participantsInRoom.forEach(socketId => {
                const socketObj = io.sockets.sockets.get(socketId);
                if (socketObj?.user?.name) {
                    participants.push({
                        socketId: socketId,
                        userName: socketObj.user.name
                    });
                }
            });

            socket.emit('existing-participants', {
                participants: participants  // ✅ Now includes userName
            });

            socket.to(`meeting-${meetingId}`).emit('user-joined', {
                socketId: socket.id,
                userName: socket.user?.name || 'User'
            });

            logger.info(`User ${socket.id} joined meeting: ${meetingId}`);
        });

        socket.on('raise-hand', ({ meetingId, socketId, userName, userId }) => {
            io.to(`meeting-${meetingId}`).emit('raise-hand', {
                socketId,
                userName,
                userId,
            });
            logger.info(`${userName} raised hand in meeting: ${meetingId}`);
        });

        socket.on('lower-hand', ({ meetingId, userId }) => {
            io.to(`meeting-${meetingId}`).emit('lower-hand', {
                userId,
            });
            logger.info(`User ${userId} lowered hand in meeting: ${meetingId}`);
        });

        socket.on('screen-share-start', ({ meetingId, socketId, userName, userId }) => {
            io.to(`meeting-${meetingId}`).emit('screen-share-start', {
                socketId,
                userName,
                userId,
            });
            logger.info(`${userName} started screen sharing in meeting: ${meetingId}`);
        });

        socket.on('screen-share-stop', ({ meetingId, userId }) => {
            io.to(`meeting-${meetingId}`).emit('screen-share-stop', {
                userId,
            });
            logger.info(`User ${userId} stopped screen sharing in meeting: ${meetingId}`);
        });

        socket.on('offer', ({ meetingId, offer, targetId }) => {
            io.to(targetId).emit('offer', {
                offer,
                fromId: socket.id,
            });
        });

        socket.on('answer', ({ meetingId, answer, targetId }) => {
            io.to(targetId).emit('answer', {
                answer,
                fromId: socket.id,
            });
        });

        socket.on('ice-candidate', ({ meetingId, candidate, targetId }) => {
            io.to(targetId).emit('ice-candidate', {
                candidate,
                fromId: socket.id,
            });
        });

        socket.on('send-meeting-message', ({ meetingId, message, userName, userId }) => {
            io.to(`meeting-${meetingId}`).emit('receive-meeting-message', {
                id: Date.now(),
                message,
                userName,
                userId,
                createdAt: new Date(),
            });
        });

        socket.on('disconnect', () => {
            let offlineUserId;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    offlineUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (offlineUserId) {
                io.emit('user-status', {
                    userId: offlineUserId,
                    status: 'offline',
                    onlineCount: onlineUsers.size,
                });
            }
            logger.info(`User disconnected: ${socket.id}`);
        });
    });
    return io;
};
export const getIO = () => io;