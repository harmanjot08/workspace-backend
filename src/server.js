import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import passport from './config/passport.config.js';
import redisClient from './config/redis.config.js';
import session from 'express-session';
import { createServer } from 'http';
import { initializeSocket } from './config/socket.config.js';
import roleRoutes from './routes/role.routes.js';
import taskRoutes from './routes/task.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import adminRoutes from './routes/admin.routes.js';
import contactRoutes from './routes/contact.routes.js';
import meetingRoutes from './routes/meetingRoutes.js'; 
dotenv.config();
const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(morgan('dev'));

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
    },
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running ✅' });
});
app.use('/api/auth', authRoutes);
import userRoutes from './routes/user.routes.js';
app.use('/api/users', userRoutes);
import chatRoutes from './routes/chat.routes.js';
app.use('/api/chats', chatRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});
app.use(passport.initialize());
app.use(passport.session());
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
initializeSocket(httpServer);
httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 Socket.io enabled`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});
export default app;