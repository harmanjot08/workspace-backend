import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        tls: process.env.REDIS_URL?.startsWith('rediss://'),
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

await redisClient.connect();

export default redisClient;