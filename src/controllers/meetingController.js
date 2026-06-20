import { prisma } from '../config/db.js';

export const validateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Meeting dhundo
        const meeting = await prisma.meeting.findUnique({
            where: { meetingId },
        });

        if (!meeting) {
            return res.json({
                valid: false,
                message: 'Meeting not found',
            });
        }

        // Status check - active hai?
        if (meeting.status !== 'ACTIVE') {
            return res.json({
                valid: false,
                message: 'Meeting link has expired or been replaced',
            });
        }

        // Time check - 1 hour se pehle?
        const now = Date.now();
        const createdTime = new Date(meeting.createdAt).getTime();
        const expiryTime = 60 * 60 * 1000; // 1 hour

        if (now - createdTime > expiryTime) {
            // Expired mark karo
            await prisma.meeting.update({
                where: { id: meeting.id },
                data: { status: 'INACTIVE' },
            });

            return res.json({
                valid: false,
                message: 'Meeting link has expired (1 hour)',
            });
        }

        // Valid!
        res.json({
            valid: true,
            meeting,
        });
    } catch (error) {
        console.error('validateMeeting error:', error);
        res.status(500).json({ error: error.message });
    }
};