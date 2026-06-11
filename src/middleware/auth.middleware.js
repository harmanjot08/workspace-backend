import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errorHandler.js';
import redisClient from '../config/redis.config.js';
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new AuthError('No token provided');
        }
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if (isBlacklisted) {
            throw new AuthError('Token has been revoked');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (error instanceof AuthError) {
            return res.status(401).json({ message: error.message });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new AuthError('Refresh token required');
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};