import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async lpush(key, value) {
    const list = this.store.get(key) || [];
    list.unshift(value);
    this.store.set(key, list);
  }

  async ltrim(key, start, stop) {
    const list = this.store.get(key) || [];
    this.store.set(key, list.slice(start, stop + 1));
  }

  async lrange(key, start, stop) {
    const list = this.store.get(key) || [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async ping() {
    return "PONG";
  }
}

let redisClient = new MemoryCache();
let redisAvailable = false;
let redisWarningLogged = false;

export const connectRedis = async () => {
  try {
    const client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });
    client.on("error", (error) => {
      if (!redisWarningLogged) {
        redisWarningLogged = true;
        logger.warn({
          message: "Redis connection error detected, using memory cache fallback",
          error: error.message
        });
      }
    });
    await client.connect();
    await client.ping();
    redisClient = client;
    redisAvailable = true;
    redisWarningLogged = false;
    logger.info({ message: "Redis connected" });
  } catch (error) {
    redisAvailable = false;
    logger.warn({
      message: "Redis unavailable, falling back to memory cache",
      error: error.message
    });
  }
};

export const cacheRecentTransaction = async (userId, payload) => {
  const key = `recent:${userId}`;
  await redisClient.lpush(key, JSON.stringify(payload));
  await redisClient.ltrim(key, 0, 29);
};

export const getRecentTransactionsFromCache = async (userId) => {
  const values = await redisClient.lrange(`recent:${userId}`, 0, 29);
  return values.map((entry) => JSON.parse(entry));
};

export const getRedisStatus = () => ({
  available: redisAvailable
});
