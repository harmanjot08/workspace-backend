import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
let io;
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
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
            socket.join(`meeting-${meetingId}`);
            socket.to(`meeting-${meetingId}`).emit('user-joined', socket.id);

            logger.info(`User ${socket.id} joined meeting: ${meetingId}`);
        });
        socket.on('offer', ({ meetingId, offer }) => {
            console.log("SERVER RECEIVED OFFER:", meetingId);

            socket.to(`meeting-${meetingId}`).emit('offer', {
                offer,
                sender: socket.id,
            });
        });

        socket.on('answer', ({ meetingId, answer }) => {
            console.log("SERVER RECEIVED ANSWER:", meetingId);

            socket.to(`meeting-${meetingId}`).emit('answer', {
                answer,
                sender: socket.id,
            });
        });

        socket.on('ice-candidate', ({ meetingId, candidate }) => {
            console.log("SERVER RECEIVED ICE CANDIDATE:", meetingId);

            socket.to(`meeting-${meetingId}`).emit('ice-candidate', {
                candidate,
                sender: socket.id,
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