import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';

export const deliverEmail = async ({
    userId,
    to,
    subject,
    body,
}) => {
    const promotionKeywords = [
        'offer',
        'sale',
        'discount',
        'coupon',
        'newsletter',
        'promotion',
        'deal',
        'limited time',
        'special offer',
    ];

    const emailContent = `${subject} ${body}`.toLowerCase();

    const importantSubjectKeywords = [
        'urgent',
        'important',
        'asap',
        'deadline',
        'meeting',
        'interview',
        'offer letter',
        'appointment',
        'invoice',
        'payment due',
        'verification',
        'security alert',
        'action required',
        'response required',
    ];

    const importantBodyKeywords = [
        'please respond',
        'kindly respond',
        'action required',
        'reply required',
        'confirm',
        'verify',
        'approval',
        'submit',
        'complete before',
        'due date',
        'deadline',
    ];

    let importanceScore = 0;

    if (
        importantSubjectKeywords.some(keyword =>
            subject.toLowerCase().includes(keyword)
        )
    ) {
        importanceScore += 40;
    }

    if (
        importantBodyKeywords.some(keyword =>
            body.toLowerCase().includes(keyword)
        )
    ) {
        importanceScore += 20;
    }

    if (!to.includes(',')) {
        importanceScore += 10;
    }

    const isPromotion = promotionKeywords.some(keyword =>
        emailContent.includes(keyword)
    );

    const spamKeywords = [
        'win money',
        'lottery',
        'free crypto',
        'free bitcoin',
        'claim prize',
        'congratulations you won',
        'earn money fast',
        'click here urgently',
        'guaranteed income',
        'double your money',
    ];

    const isSpam = spamKeywords.some(keyword =>
        emailContent.includes(keyword)
    );

    if (isPromotion) {
        importanceScore -= 60;
    }

    if (isSpam) {
        importanceScore -= 100;
    }

    const marketingKeywords = [
        'sale',
        'discount',
        'offer',
        'coupon',
        'buy now',
        'limited offer',
        'deal',
        'save big',
        'free shipping',
    ];

    if (
        marketingKeywords.some(keyword =>
            subject.toLowerCase().includes(keyword)
        )
    ) {
        importanceScore -= 30;
    }

    if (
        subject === subject.toUpperCase() &&
        /[A-Z]/.test(subject)
    ) {
        importanceScore += 5;
    }

    const isImportant = importanceScore >= 50;

    logger.info(
        `Importance Score: ${importanceScore}, Important: ${isImportant}`
    );

    const recipientUser = await prisma.user.findUnique({
        where: {
            email: to,
        },
    });

    const email = await prisma.email.create({
        data: {
            fromUserId: userId,
            subject,
            body,
            isDraft: false,
            recipients: {
                create: {
                    recipientEmail: to,
                    recipientUserId: recipientUser?.id,
                    type: 'to',
                },
            },
        },
        include: {
            recipients: true,
            fromUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    await prisma.userEmail.create({
        data: {
            emailId: email.id,
            userId,
            folder: 'sent',
            isRead: true,
            isSpam,
            isPromotion,
            isImportant: false,
            importanceScore: 0,
            isScheduled: false,
            isSent: true,
        },
    });

    if (recipientUser) {
        await prisma.userEmail.create({
            data: {
                emailId: email.id,
                userId: recipientUser.id,
                folder: 'inbox',
                isRead: false,
                isSpam,
                isPromotion,
                isImportant,
                importanceScore,
            },
        });
    }

    logger.info(`Email sent by ${userId} to ${to}`);

    return email;
};

export const deliverScheduledEmail = async ({
    emailId,
    senderUserId,
}) => {
    const email = await prisma.email.findUnique({
        where: {
            id: emailId,
        },
        include: {
            recipients: true,
        },
    });

    if (!email) {
        return;
    }

    const recipient = email.recipients[0];

    if (!recipient?.recipientUserId) {
        return;
    }

    const senderState = await prisma.userEmail.findUnique({
        where: {
            emailId_userId: {
                emailId,
                userId: senderUserId,
            },
        },
    });

    await prisma.userEmail.create({
        data: {
            emailId,
            userId: recipient.recipientUserId,
            folder: 'inbox',
            isRead: false,
            isSpam: senderState?.isSpam ?? false,
            isPromotion: senderState?.isPromotion ?? false,
            isImportant: senderState?.isImportant ?? false,
            importanceScore: senderState?.importanceScore ?? 0,
        },
    });

    await prisma.userEmail.update({
        where: {
            emailId_userId: {
                emailId,
                userId: senderUserId,
            },
        },
        data: {
            folder: 'sent',
            isScheduled: false,
            isSent: true,
        },
    });

    logger.info(`Scheduled email ${emailId} delivered`);
};