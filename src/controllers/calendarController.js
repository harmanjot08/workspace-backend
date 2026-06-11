import prisma from '../config/database.config.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errorHandler.js';

// Create event
export const createEvent = async (req, res) => {
    try {
        const { title, description, startTime, endTime, location, attendees } = req.body;
        const { id: userId, companyId } = req.user;

        if (!title || !startTime || !endTime) {
            throw new ValidationError('Title, startTime, endTime required');
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                location,
                createdBy: userId,
                companyId,
                attendees: {
                    create: attendees?.map(id => ({ userId: id })) || [{ userId }],
                },
            },
            include: {
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });

        logger.info(`Event created: ${event.id}`);

        res.status(201).json({
            message: 'Event created',
            event,
        });
    } catch (error) {
        logger.error('Create event error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// Get all events (company)
export const getEvents = async (req, res) => {
    try {
        const { companyId } = req.user;

        const events = await prisma.event.findMany({
            where: { companyId },
            include: {
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        res.status(200).json({
            message: 'Events fetched',
            events,
            count: events.length,
        });
    } catch (error) {
        logger.error('Get events error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get user events
export const getUserEvents = async (req, res) => {
    try {
        const { id: userId, companyId } = req.user;

        const events = await prisma.event.findMany({
            where: {
                companyId, // All company events
            },
            include: {
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        res.status(200).json({
            message: 'User events fetched',
            events,
            count: events.length,
        });
    } catch (error) {
        logger.error('Get user events error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get single event
export const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });

        if (!event) {
            throw new NotFoundError('Event not found');
        }

        res.status(200).json({
            message: 'Event fetched',
            event,
        });
    } catch (error) {
        logger.error('Get event error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, description, startTime, endTime, location } = req.body;

        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: title || undefined,
                description: description || undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                location: location || undefined,
            },
            include: {
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        logger.info(`Event updated: ${eventId}`);

        res.status(200).json({
            message: 'Event updated',
            event,
        });
    } catch (error) {
        logger.error('Update event error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        await prisma.event.delete({
            where: { id: eventId },
        });

        logger.info(`Event deleted: ${eventId}`);

        res.status(200).json({
            message: 'Event deleted',
        });
    } catch (error) {
        logger.error('Delete event error:', error.message);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};