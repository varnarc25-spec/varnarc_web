/**
 * In-memory event queue (BullMQ-like without Redis).
 * Flushes when size >= maxBatch or when flush() is called (e.g. setInterval every 2s).
 */
export type QueuedAnalyticsEvent<T = unknown> = {
  payload: T;
  enqueuedAt: number;
  meta?: {
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export class AnalyticsEventQueue<T = unknown> {
  private readonly items: QueuedAnalyticsEvent<T>[] = [];
  private flushing = false;

  constructor(
    private readonly maxBatch = 50,
    private readonly onFlush: (batch: QueuedAnalyticsEvent<T>[]) => Promise<void>,
  ) {}

  get size() {
    return this.items.length;
  }

  push(payload: T, meta?: QueuedAnalyticsEvent<T>['meta']) {
    this.items.push({ payload, enqueuedAt: Date.now(), meta });
    if (this.items.length >= this.maxBatch) {
      void this.flush();
    }
  }

  pushMany(payloads: T[], meta?: QueuedAnalyticsEvent<T>['meta']) {
    for (const payload of payloads) {
      this.items.push({ payload, enqueuedAt: Date.now(), meta });
    }
    if (this.items.length >= this.maxBatch) {
      void this.flush();
    }
  }

  async flush() {
    if (this.flushing || this.items.length === 0) return { flushed: 0 };
    this.flushing = true;
    const batch = this.items.splice(0, this.maxBatch);
    try {
      await this.onFlush(batch);
      return { flushed: batch.length };
    } finally {
      this.flushing = false;
      if (this.items.length >= this.maxBatch) {
        void this.flush();
      }
    }
  }
}
