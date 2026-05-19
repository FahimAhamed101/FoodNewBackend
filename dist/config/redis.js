"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isDev = process.env.NODE_ENV === 'development';
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: isDev ? 0 : 20,
    retryStrategy: (times) => {
        if (isDev && times > 1)
            return null;
        return Math.min(times * 500, 2000);
    },
};
const client = new ioredis_1.default(redisConfig);
client.on('error', (err) => {
    if (!isDev) {
        console.error('Redis error:', err.message);
    }
});
if (!isDev || process.env.REDIS_URL || process.env.REDIS_HOST) {
    client.connect().catch(() => {
        if (isDev)
            console.log('Redis connection skipped or failed (Development Mode)');
    });
}
// In development, we want to ensure any command called on the client doesn't crash the process
// if Redis is down. ioredis commands return promises that will reject.
// We can't easily wrap all methods without a Proxy, but we can at least log that it's skipped.
const redis = client;
exports.default = redis;
