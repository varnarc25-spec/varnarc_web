import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConstructionSeoAuditService } from './construction-seo-audit.service';

const DEFAULT_INTERVAL_MS = 60 * 1000;

/**
 * Cron-style drain for Construction SEO audit queue.
 * Expensive crawl batches continue here so admin page loads stay fast.
 */
@Injectable()
export class ConstructionSeoAuditSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConstructionSeoAuditSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly audit: ConstructionSeoAuditService) {}

  onModuleInit() {
    if (process.env.CONSTRUCTION_SEO_AUDIT_CRON_ENABLED === 'false') {
      this.logger.log('Construction SEO audit scheduler disabled');
      return;
    }
    const intervalMs = Number(
      process.env.CONSTRUCTION_SEO_AUDIT_CRON_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
    );
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`Construction SEO audit scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.audit.tickQueue();
    } catch (error) {
      this.logger.warn(
        `Construction SEO audit tick failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    } finally {
      this.running = false;
    }
  }
}
