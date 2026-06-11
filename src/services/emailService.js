import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        });
        logger.info(`Email sent to ${to}`, info.messageId);
        return true;
    } catch (error) {
        logger.error('Email send failed:', error.message);
        return false;
    }
};
export const sendWelcomeEmail = async (user, password) => {
    const html = `
    <h2>Welcome to Workspace!</h2>
    <p>Hi ${user.name},</p>
    <p>Your account has been created. Here are your login credentials:</p>
    <p>
      <strong>Email:</strong> ${user.email}<br>
      <strong>Password:</strong> ${password}
    </p>
    <p>Please log in and change your password immediately.</p>
    <p>
      <a href="${process.env.FRONTEND_URL}/login">Login Here</a>
    </p>
  `;
    return sendEmail(user.email, 'Welcome to Workspace', html);
};
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <p>
      <a href="${resetUrl}">Reset Password</a>
    </p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;
    return sendEmail(email, 'Password Reset Request', html);
};
export const sendEmailVerificationEmail = async (email, verificationToken) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const html = `
    <h2>Verify Your Email</h2>
    <p>Click the link below to verify your email address:</p>
    <p>
      <a href="${verifyUrl}">Verify Email</a>
    </p>
    <p>This link expires in 24 hours.</p>
  `;
    return sendEmail(email, 'Verify Your Email Address', html);
};