import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const PREFIXES = ['search:ac:', 'search:suggestions:'];

/**
 * Tracks search cache keys so clearCache can invalidate autocomplete/suggestions.
 * Works with in-memory and Redis-backed Nest CACHE_MANAGER.
 */
@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private readonly keys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  remember(key: string) {
    this.keys.add(key);
    // Bound memory for key registry
    if (this.keys.size > 2000) {
      const first = this.keys.values().next().value;
      if (first) this.keys.delete(first);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set(key: string, value: unknown, ttlMs = 60_000) {
    this.remember(key);
    await this.cache.set(key, value, ttlMs);
  }

  async clear() {
    let cleared = 0;
    for (const key of [...this.keys]) {
      await this.cache.del(key).catch(() => undefined);
      this.keys.delete(key);
      cleared++;
    }

    // Redis: attempt pattern delete via underlying client when present
    const store = (this.cache as unknown as { store?: { client?: { keys: (p: string) => Promise<string[]>; del: (...k: string[]) => Promise<number> } } })
      .store;
    const client = store?.client;
    if (client?.keys && client?.del) {
      try {
        for (const prefix of PREFIXES) {
          const found = await client.keys(`${prefix}*`);
          if (found.length) {
            await client.del(...found);
            cleared += found.length;
          }
        }
      } catch (err) {
        this.logger.warn(`Redis pattern clear failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      cleared: true,
      keysRemoved: cleared,
      backend: process.env.REDIS_URL ? 'redis' : 'memory',
    };
  }
}
