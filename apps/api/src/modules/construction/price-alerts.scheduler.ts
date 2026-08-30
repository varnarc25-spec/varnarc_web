import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PriceAlertsService } from './price-alerts.service';

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class PriceAlertsSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PriceAlertsSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly priceAlerts: PriceAlertsService) {}

  onModuleInit() {
    if (process.env.PRICE_ALERTS_CRON_ENABLED === 'false') {
      this.logger.log('Price alerts scheduler disabled (PRICE_ALERTS_CRON_ENABLED=false)');
      return;
    }
    const intervalMs = Number(process.env.PRICE_ALERTS_CRON_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`Price alerts scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.priceAlerts.evaluateActiveAlerts();
      if (result.triggered > 0 || result.notified > 0) {
        this.logger.log(
          `Price alerts tick: checked=${result.checked} triggered=${result.triggered} notified=${result.notified} suppressed=${result.suppressed} stale=${result.skippedStale}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Price alerts scheduler tick failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    } finally {
      this.running = false;
    }
  }
}
