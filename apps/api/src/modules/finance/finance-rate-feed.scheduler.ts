import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FinanceGapService } from './finance-gap.service';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class FinanceRateFeedSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinanceRateFeedSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly financeGap: FinanceGapService) {}

  onModuleInit() {
    if (process.env.FINANCE_RATE_CRON_ENABLED === 'false') {
      this.logger.log('Finance rate feed scheduler disabled (FINANCE_RATE_CRON_ENABLED=false)');
      return;
    }

    const intervalMs = Number(process.env.FINANCE_RATE_CRON_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`Finance rate feed scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      const result = await this.financeGap.syncEnabledFeeds();
      if (result.processed > 0) {
        this.logger.log(`Synced ${result.processed} finance rate feed(s)`);
      }
    } catch (error) {
      this.logger.warn(
        `Finance rate feed scheduler tick failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
