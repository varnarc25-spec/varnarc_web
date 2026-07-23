import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class NewsletterSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsletterSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly newsletter: NewsletterService) {}

  onModuleInit() {
    if (process.env.NEWSLETTER_CRON_ENABLED === 'false') {
      this.logger.log('Newsletter scheduler disabled (NEWSLETTER_CRON_ENABLED=false)');
      return;
    }

    const intervalMs = Number(process.env.NEWSLETTER_CRON_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`Newsletter scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      const result = await this.newsletter.processScheduled();
      if (result.processed > 0) {
        this.logger.log(`Processed ${result.processed} scheduled newsletter campaign(s)`);
      }
    } catch (error) {
      this.logger.warn(
        `Newsletter scheduler tick failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
