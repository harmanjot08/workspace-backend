import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        tls: process.env.REDIS_URL ? true : false,
        rejectUnauthorized: false,
    },
});

client.on('error', (err) => logger.error('Redis error:', err));
client.on('connect', () => logger.info('✅ Redis Connected'));

export default client;