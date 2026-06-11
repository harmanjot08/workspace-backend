import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import passport from '../config/passport.config.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';
const router = express.Router();
// Public routes
router.post('/register', authController.registerCompany);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshTokenHandler);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user;
        const token = generateAccessToken(user.user);
        const refreshToken = generateRefreshToken(user.user);
        res.redirect(
            `http://localhost:5173/login?accessToken=${token}&refreshToken=${refreshToken}&user=${JSON.stringify(user.user)}`
        );
    }
);
export default router;