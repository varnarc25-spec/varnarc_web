import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AdsenseApiService } from './adsense-api.service';
import { AdsenseSyncScheduler } from './adsense.scheduler';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AdsenseApiService, AdsenseSyncScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
