import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConstructionSearchOpportunityService } from './construction-search-opportunity.service';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // hourly

@Injectable()
export class ConstructionSearchOpportunitySchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ConstructionSearchOpportunitySchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly service: ConstructionSearchOpportunityService) {}

  onModuleInit() {
    if (process.env.CONSTRUCTION_SEARCH_OPP_CRON_ENABLED === 'false') {
      this.logger.log('Construction search opportunity scheduler disabled');
      return;
    }
    const intervalMs = Number(
      process.env.CONSTRUCTION_SEARCH_OPP_CRON_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
    );
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    // First run shortly after boot
    setTimeout(() => void this.tick(), 15_000);
    this.logger.log(`Construction search opportunity scheduler started (every ${intervalMs}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.service.aggregateAllWindows();
    } catch (error) {
      this.logger.warn(
        `Search opportunity aggregation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    } finally {
      this.running = false;
    }
  }
}
