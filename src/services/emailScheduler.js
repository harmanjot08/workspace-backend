import prisma from '../config/database.config.js';
import { deliverEmail } from './internalEmailService.js';
import { logger } from '../utils/logger.js';

export const startEmailScheduler = () => {
    logger.info('Email Scheduler Started');

    setInterval(async () => {
        try {
            logger.info('Checking scheduled emails...');

            logger.info(`Current server time: ${new Date().toISOString()}`);

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

            const allScheduled = await prisma.userEmail.findMany({
                where: {
                    isScheduled: true,
                    isSent: false,
                },
                select: {
                    emailId: true,
                    scheduledFor: true,
                    isScheduled: true,
                    isSent: true,
                },
            });

            logger.info(`Pending scheduled emails: ${JSON.stringify(allScheduled)}`);

            logger.info(`Found ${scheduledEmails.length} scheduled emails`);

            for (const scheduled of scheduledEmails) {
                const recipient = scheduled.email.recipients?.[0];

                if (!recipient) continue;

                await deliverEmail({
                    userId: scheduled.userId,
                    to: recipient.recipientEmail,
                    subject: scheduled.email.subject,
                    body: scheduled.email.body,
                });

                await prisma.userEmail.update({
                    where: {
                        emailId_userId: {
                            emailId: scheduled.emailId,
                            userId: scheduled.userId,
                        },
                    },
                    data: {
                        isSent: true,
                        isScheduled: false,
                        folder: 'sent',
                    },
                });

                logger.info(`Sent scheduled email: ${scheduled.emailId}`);
            }
        } catch (error) {
            logger.error('Email Scheduler Error:', error.message);
        }
    }, 30000);
};