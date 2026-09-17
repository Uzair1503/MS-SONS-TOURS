import { getRedis } from "../config/redis";

const CACHE_TTL = 300; // 5 minutes default

function getPrefix(entity: string): string {
  return `mssons:${entity}:`;
}

export const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl: number = CACHE_TTL): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch {
      // silently fail
    }
  },

  async invalidate(pattern: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // silently fail
    }
  },

  async invalidatePackages(): Promise<void> {
    await this.invalidate("mssons:packages:*");
    await this.invalidate("mssons:package:*");
    await this.invalidate("mssons:featured:*");
    await this.invalidate("mssons:sitemap:xml");
  },

  async invalidateHotels(): Promise<void> {
    await this.invalidate("mssons:hotels:*");
    await this.invalidate("mssons:hotel:*");
    await this.invalidate("mssons:sitemap:xml");
  },

  async invalidateAirlines(): Promise<void> {
    await this.invalidate("mssons:airlines:*");
    await this.invalidate("mssons:airline:*");
  },

  async invalidateUmrah(): Promise<void> {
    await this.invalidate("mssons:umrah:*");
  },

  async invalidateRoomTypes(): Promise<void> {
    await this.invalidate("mssons:roomtypes:*");
  },

  packageKey: (filters: string) => `${getPrefix("packages")}${filters}`,
  packageDetailKey: (id: string) => `${getPrefix("package")}${id}`,
  hotelKey: (filters: string) => `${getPrefix("hotels")}${filters}`,
  hotelDetailKey: (id: string) => `${getPrefix("hotel")}${id}`,
  airlineKey: (filters: string) => `${getPrefix("airlines")}${filters}`,
  roomTypeKey: () => `${getPrefix("roomtypes")}all`,
  umrahKey: () => `${getPrefix("umrah")}settings`,
  featuredKey: (days: number) => `${getPrefix("featured")}${days}`,
  calculatorKey: (hash: string) => `${getPrefix("calc")}${hash}`,
};