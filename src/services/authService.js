import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.config.js';  // ← ADD YE
import redisClient from '../config/redis.config.js';  // ← ADD YE
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from './emailService.js';
import { ConflictError, NotFoundError, AuthError } from '../utils/errorHandler.js';
export const hashPassword = async (password) => {
    return bcryptjs.hash(password, 10);
};
export const comparePassword = async (password, hash) => {
    return bcryptjs.compare(password, hash);
};
export const createUser = async (userData) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
    });
    if (existingUser) throw new ConflictError('Email already registered');
    const passwordHash = await hashPassword(userData.password);
    return prisma.user.create({
        data: {
            name: userData.name,
            email: userData.email,
            passwordHash,
            role: userData.role ? String(userData.role).toLowerCase() : 'user', // ← ADD YE LINE
            companyId: userData.companyId,
            department: userData.department || null,
        },
    });
};
export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new NotFoundError('User not found');
    }
    if (!user.passwordHash) {
        throw new AuthError('Please use OAuth to login');
    }
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AuthError('Invalid password');
    }
    //if (!user.isEmailVerified) {
        //throw new AuthError('Please verify your email first');
    //}
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await redisClient.setEx(
        `refresh_token_${user.id}`,
        30 * 24 * 60 * 60, // 30 days
        refreshToken
    );
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        accessToken,
        refreshToken,
    };
};
export const generatePasswordResetToken = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new NotFoundError('User not found');
    }
    const resetToken = uuidv4();
    await redisClient.setEx(
        `reset_token_${email}`,
        60 * 60,
        resetToken
    );
    console.log(`\n✅ PASSWORD RESET TOKEN for ${email}:\n${resetToken}\n`);
    await sendPasswordResetEmail(email, resetToken);
    return resetToken;
};
export const resetPassword = async (token, newPassword) => {
    const keys = await redisClient.keys('reset_token_*');
    let email = null;
    for (const key of keys) {
        if (await redisClient.get(key) === token) {
            email = key.replace('reset_token_', '');
            break;
        }
    }
    if (!email) {
        throw new AuthError('Invalid or expired token');
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new NotFoundError('User not found');
    }
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
    });
    await redisClient.del(`reset_token_${email}`);
    return user;
};
export const generateEmailVerificationToken = async (email) => {
    const verifyToken = uuidv4();
    await redisClient.setEx(`verify_email_${email}`, 24 * 60 * 60, verifyToken);
    console.log(`\n✅ VERIFICATION TOKEN for ${email}:\n${verifyToken}\n`);
    await sendEmailVerificationEmail(email, verifyToken);
    return verifyToken;
};
export const verifyEmail = async (token) => {
    const keys = await redisClient.keys('verify_email_*');
    let email = null;
    for (const key of keys) {
        const storedToken = await redisClient.get(key);
        if (storedToken === token) {
            email = key.replace('verify_email_', '');
            break;
        }
    }
    if (!email) {
        throw new AuthError('Invalid or expired verification token');
    }
    const user = await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
    });
    await redisClient.del(`verify_email_${email}`);
    return user;
};
export const logoutUser = async (token, user) => {
    // Get token expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
        await redisClient.setEx(
            `blacklist_${token}`,
            expiresIn,
            'true'
        );
    }
    await redisClient.del(`refresh_token_${user.id}`);
    return true;
};
export const loginWithGoogle = async (profile) => {
    let user = await prisma.user.findUnique({
        where: { email: profile.emails[0].value },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                isEmailVerified: true,
                companyId: 'temp-company-id',
            },
        });
    } else if (!user.googleId) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
        });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        accessToken,
        refreshToken,
    };
};