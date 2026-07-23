import { CacheModule } from '@nestjs/cache-manager';
import type { DynamicModule } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Redis when REDIS_URL is set; otherwise in-memory (local/dev).
 * Search autocomplete/suggestions use this global cache.
 */
export function buildCacheModule(): DynamicModule {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return CacheModule.register({
      isGlobal: true,
      ttl: 30_000,
    });
  }

  return CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async () => {
      try {
        const store = await redisStore({
          url: redisUrl,
          ttl: 30_000,
        });
        return {
          store: () => store,
          ttl: 30_000,
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `[cache] Redis unavailable (${err instanceof Error ? err.message : String(err)}); using in-memory cache`,
        );
        return { ttl: 30_000 };
      }
    },
  });
}
