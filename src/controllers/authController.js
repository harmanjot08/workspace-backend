import { logger } from '../utils/logger.js';
import * as authService from '../services/authService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { ConflictError, ValidationError, NotFoundError } from '../utils/errorHandler.js';
import prisma from '../config/database.config.js';
export const registerCompany = async (req, res) => {
    try {
        const { companyName, email, password, confirmPassword, name } = req.body;
        if (!companyName || !email || !password || !name) {
            throw new ValidationError('All fields are required');
        }
        if (password !== confirmPassword) {
            throw new ValidationError('Passwords do not match');
        }
        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }
        const existingCompany = await prisma.company.findUnique({
            where: { email },
        });
        if (existingCompany) {
            throw new ConflictError('Company email already registered');
        }
        const company = await prisma.company.create({
            data: {
                name: companyName,
                email,
            },
        });
        const user = await authService.createUser({
            name,
            email,
            password,
            companyId: company.id,
            role: req.body.role || 'user',
            department: null,
        });
        await authService.generateEmailVerificationToken(email);
        await sendWelcomeEmail(user, password);
        logger.info(`Company registered: ${company.name}`);
        res.status(201).json({
            message: 'Company registered. Please verify your email.',
            company: {
                id: company.id,
                name: company.name,
                email: company.email,
            },
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        logger.error('Register error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password required');
        }
        const result = await authService.loginUser(email, password);
        res.status(200).json({
            message: 'Login successful',
            ...result,
        });
    } catch (error) {
        logger.error('Login error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const refreshTokenHandler = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new ValidationError('Refresh token required');
        }
        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        res.status(200).json({
            message: 'Token refreshed',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        logger.error('Token refresh error:', error.message);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        await authService.logoutUser(token, req.user);

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        logger.error('Logout error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ValidationError('Email required');
        }
        await authService.generatePasswordResetToken(email);
        res.status(200).json({
            message: 'Password reset link sent to your email',
        });
    } catch (error) {
        logger.error('Forgot password error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        if (!token || !newPassword || !confirmPassword) {
            throw new ValidationError('All fields required');
        }
        if (newPassword !== confirmPassword) {
            throw new ValidationError('Passwords do not match');
        }
        if (newPassword.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }
        const user = await authService.resetPassword(token, newPassword);
        res.status(200).json({
            message: 'Password reset successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        logger.error('Reset password error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            throw new ValidationError('Verification token required');
        }
        const user = await authService.verifyEmail(token);
        res.status(200).json({
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        logger.error('Email verification error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ValidationError('Email required');
        }
        await authService.generateEmailVerificationToken(email);
        res.status(200).json({
            message: 'Verification email sent',
        });
    } catch (error) {
        logger.error('Resend email error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
export const getCurrentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                companyId: true,
                department: true,
                profilePicture: true,
            },
        });
        res.status(200).json({
            message: 'User fetched',
            user,
        });
    } catch (error) {
        logger.error('Get user error:', error.message);
        res.status(500).json({ message: error.message });
    }
};