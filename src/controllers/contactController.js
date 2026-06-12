import { logger } from '../utils/logger.js';
import * as emailService from '../services/emailService.js';
import { ValidationError } from '../utils/errorHandler.js';
export const sendContactMessage = async (req, res) => {
    try {
        const { name, email, companyName, message } = req.body;
        if (!name || !email || !companyName || !message) {
            throw new ValidationError('All fields are required');
        }
        if (message.trim().length < 10) {
            throw new ValidationError('Message must be at least 10 characters');
        }
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@workspace.com';

        await emailService.sendEmail(
            adminEmail,
            `New Contact Form Submission from ${name}`,
            `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Reply to: ${email}</p>
      `
        );
        logger.info(`Contact form submitted by ${name} (${email})`);
        res.status(200).json({
            message: 'Message sent successfully! We will get back to you soon.',
        });
    } catch (error) {
        logger.error('Contact form error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};