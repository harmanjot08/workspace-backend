import prisma from '../config/database.config.js';
import { deliverScheduledEmail } from './internalEmailService.js';
import { logger } from '../utils/logger.js';

export const startEmailScheduler = () => {
    setInterval(async () => {
        try {
            const scheduledEmails = await prisma.userEmail.findMany({
                where: {
                    isScheduled: true,
                    isSent: false,
                    scheduledFor: {
                        lte: new Date(),
                    },
                },
                include: {
                    email: {
                        include: {
                            recipients: true,
                        },
                    },
                },
            });

            for (const scheduled of scheduledEmails) {
                const recipient = scheduled.email.recipients[0];

                if (!recipient) continue;

                await deliverScheduledEmail({
                    emailId: scheduled.emailId,
                    senderUserId: scheduled.userId,
                });
            }
        } catch (error) {
            logger.error('Email Scheduler:', error.message);
        }
    }, 30000); // every 30 seconds
};