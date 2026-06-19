import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errorHandler.js';
import redisClient from '../config/redis.config.js';
export const authenticate = async (req, res, next) => {
    try {
        console.log("AUTH HEADER:", req.headers.authorization);

        const token = req.headers.authorization?.split(' ')[1];

        console.log("TOKEN RECEIVED:", token);

        if (!token) {
            throw new AuthError('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("DECODED:", decoded);

        req.user = decoded;
        next();
    } catch (error) {
        console.log("AUTH ERROR:", error.message);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
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