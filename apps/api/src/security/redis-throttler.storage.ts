import type { ThrottlerStorage } from '@nestjs/throttler';

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

type RedisClient = {
  incr(key: string): Promise<number>;
  pexpire(key: string, ttl: number): Promise<number>;
  pttl(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  psetex(key: string, ttl: number, value: string): Promise<unknown>;
};

/** Redis-backed rate limit storage when REDIS_URL is configured. */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private client: RedisClient | null = null;
  private connecting: Promise<RedisClient | null> | null = null;

  constructor(private readonly redisUrl: string) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<ThrottlerStorageRecord> {
    const client = await this.getClient();
    if (!client) {
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const blockKey = `${key}:blocked`;
    const blocked = await client.get(blockKey);
    if (blocked) {
      const timeToBlockExpire = await client.pttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(timeToBlockExpire, 0),
      };
    }

    const totalHits = await client.incr(key);
    if (totalHits === 1) {
      await client.pexpire(key, ttl);
    }
    const timeToExpire = await client.pttl(key);

    if (totalHits > limit) {
      await client.psetex(blockKey, blockDuration, '1');
      const timeToBlockExpire = await client.pttl(blockKey);
      return {
        totalHits,
        timeToExpire: Math.max(timeToExpire, 0),
        isBlocked: true,
        timeToBlockExpire: Math.max(timeToBlockExpire, 0),
      };
    }

    return {
      totalHits,
      timeToExpire: Math.max(timeToExpire, 0),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  private async getClient() {
    if (this.client) return this.client;
    if (!this.connecting) {
      this.connecting = this.connect();
    }
    return this.connecting;
  }

  private async connect(): Promise<RedisClient | null> {
    try {
      const { default: Redis } = await import('ioredis');
      const redis = new Redis(this.redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
      await redis.connect();
      this.client = redis as unknown as RedisClient;
      return this.client;
    } catch {
      return null;
    }
  }
}
