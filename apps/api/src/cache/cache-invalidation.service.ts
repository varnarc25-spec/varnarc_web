import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export type CacheInvalidationMessage = {
  prefixes: string[];
  scope?: string;
  source?: string;
  region?: string;
};

const REDIS_CHANNEL = 'varnarc:cache:invalidate';

@Injectable()
export class CacheInvalidationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheInvalidationService.name);
  private redisSub: { quit: () => Promise<unknown> } | null = null;
  private pubsubSubscription: { close: () => void } | null = null;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    await Promise.all([this.subscribeRedis(), this.subscribeGcpPubSub()]);
  }

  async onModuleDestroy() {
    await this.redisSub?.quit().catch(() => undefined);
    this.pubsubSubscription?.close();
  }

  async publish(message: CacheInvalidationMessage) {
    const payload = JSON.stringify({
      ...message,
      region: message.region ?? process.env.GCP_REGION ?? process.env.APP_REGION ?? 'local',
      at: new Date().toISOString(),
    });

    await this.publishRedis(payload);
    await this.publishGcp(payload);
  }

  async clearPrefixes(prefixes: string[]) {
    let removed = 0;
    const store = (
      this.cache as unknown as {
        store?: { client?: { keys: (p: string) => Promise<string[]>; del: (...k: string[]) => Promise<number> } };
      }
    ).store;
    const client = store?.client;

    if (client?.keys && client?.del) {
      for (const prefix of prefixes) {
        try {
          const found = await client.keys(`${prefix}*`);
          if (found.length) {
            await client.del(...found);
            removed += found.length;
          }
        } catch (err) {
          this.logger.warn(
            `Local cache clear failed for ${prefix}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      return removed;
    }

    const reset = (this.cache as unknown as { reset?: () => Promise<void> }).reset;
    if (reset) {
      await reset().catch(() => undefined);
      return 1;
    }

    return removed;
  }

  private async publishRedis(payload: string) {
    const url = process.env.REDIS_URL?.trim();
    if (!url) return;

    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await client.connect();
      await client.publish(REDIS_CHANNEL, payload);
      await client.quit();
    } catch (err) {
      this.logger.warn(`Redis publish failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async publishGcp(payload: string) {
    const topic = process.env.CACHE_PUBSUB_TOPIC?.trim();
    const projectId = process.env.GCP_PROJECT_ID?.trim();
    if (!topic || !projectId) return;

    try {
      const { PubSub } = await import('@google-cloud/pubsub');
      const pubsub = new PubSub({ projectId });
      await pubsub.topic(topic).publishMessage({ data: Buffer.from(payload) });
    } catch (err) {
      this.logger.warn(`Pub/Sub publish failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async subscribeRedis() {
    const url = process.env.REDIS_URL?.trim();
    if (!url || process.env.CACHE_INVALIDATION_SUBSCRIBE === 'false') return;

    try {
      const { default: Redis } = await import('ioredis');
      const sub = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await sub.connect();
      await sub.subscribe(REDIS_CHANNEL);
      sub.on('message', (_channel, payload) => {
        void this.handleMessage(payload);
      });
      this.redisSub = sub;
      this.logger.log('Subscribed to Redis cache invalidation channel');
    } catch (err) {
      this.logger.warn(`Redis subscribe failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async subscribeGcpPubSub() {
    const subscription = process.env.CACHE_PUBSUB_SUBSCRIPTION?.trim();
    const projectId = process.env.GCP_PROJECT_ID?.trim();
    if (!subscription || !projectId || process.env.CACHE_INVALIDATION_SUBSCRIBE === 'false') return;

    try {
      const { PubSub } = await import('@google-cloud/pubsub');
      const pubsub = new PubSub({ projectId });
      const sub = pubsub.subscription(subscription);
      sub.on('message', (msg) => {
        void this.handleMessage(msg.data.toString('utf8')).finally(() => msg.ack());
      });
      this.pubsubSubscription = sub;
      this.logger.log(`Subscribed to Pub/Sub ${subscription}`);
    } catch (err) {
      this.logger.warn(`Pub/Sub subscribe failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async handleMessage(raw: string) {
    try {
      const message = JSON.parse(raw) as CacheInvalidationMessage;
      if (!message.prefixes?.length) return;
      const removed = await this.clearPrefixes(message.prefixes);
      this.logger.log(
        `Cache invalidated from ${message.source ?? 'remote'}: ${message.prefixes.join(', ')} (${removed} keys)`,
      );
    } catch (err) {
      this.logger.warn(`Invalid cache message: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
