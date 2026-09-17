import Redis from "ioredis";
import { config } from "./index";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
      redis.connect().catch(() => {
        console.warn("Redis connection failed - running without cache");
        redis = null;
      });
    } catch {
      console.warn("Redis not available - running without cache");
      return null;
    }
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}