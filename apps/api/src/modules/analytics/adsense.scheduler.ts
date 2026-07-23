import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { getAdsenseApiConfig } from './adsense-api.service';

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdsenseSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdsenseSyncScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly analytics: AnalyticsService) {}

  onModuleInit() {
    if (process.env.ADSENSE_SYNC_ENABLED !== 'true') {
      this.logger.log('AdSense sync scheduler disabled (ADSENSE_SYNC_ENABLED!=true)');
      return;
    }
    if (!getAdsenseApiConfig()) {
      this.logger.warn('AdSense sync enabled but OAuth credentials are missing');
      return;
    }

    const intervalMs = Number(process.env.ADSENSE_SYNC_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`AdSense sync scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      await this.analytics.syncAdsenseFromApi();
      this.logger.log('AdSense API sync completed');
    } catch (error) {
      this.logger.warn(
        `AdSense sync failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
