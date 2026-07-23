import { Logger } from '@nestjs/common';
import type { QueuedAnalyticsEvent } from './analytics-queue';
import type { TrackAnalyticsEventInput } from '@varnarc/validation';

const QUEUE_NAME = 'analytics-events';
const JOB_NAME = 'persist-batch';

type BatchPayload = {
  batch: QueuedAnalyticsEvent<TrackAnalyticsEventInput>[];
};

export type BullMqAnalyticsBackend = {
  enqueueBatch: (batch: QueuedAnalyticsEvent<TrackAnalyticsEventInput>[]) => Promise<void>;
  close: () => Promise<void>;
  enabled: true;
};

/**
 * Optional BullMQ backend when REDIS_URL is set.
 * Falls back to caller's in-memory queue when unavailable.
 */
export async function createBullMqAnalyticsBackend(
  onFlush: (batch: QueuedAnalyticsEvent<TrackAnalyticsEventInput>[]) => Promise<void>,
): Promise<BullMqAnalyticsBackend | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  const logger = new Logger('AnalyticsBullMQ');

  try {
    const { Queue, Worker } = await import('bullmq');
    const IORedis = (await import('ioredis')).default;

    const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    const queue = new Queue<BatchPayload>(QUEUE_NAME, { connection });

    const worker = new Worker<BatchPayload>(
      QUEUE_NAME,
      async (job) => {
        await onFlush(job.data.batch);
      },
      {
        connection: connection.duplicate(),
        concurrency: 2,
      },
    );

    worker.on('failed', (job, err) => {
      logger.warn(`Analytics job ${job?.id} failed: ${err.message}`);
    });

    logger.log('BullMQ analytics worker started');

    return {
      enabled: true,
      enqueueBatch: async (batch) => {
        await queue.add(JOB_NAME, { batch }, { removeOnComplete: 200, removeOnFail: 50 });
      },
      close: async () => {
        await worker.close();
        await queue.close();
        connection.disconnect();
      },
    };
  } catch (err) {
    logger.warn(
      `BullMQ unavailable, using in-memory queue only: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return null;
  }
}
