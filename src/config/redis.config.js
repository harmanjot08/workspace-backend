import { createClient } from 'redis';

const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false,
    },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

await redisClient.connect();

export default redisClient;