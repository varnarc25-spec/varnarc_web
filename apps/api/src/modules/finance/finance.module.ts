import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceGapService } from './finance-gap.service';
import { FinanceRateFeedSchedulerService } from './finance-rate-feed.scheduler';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FinanceGapService, FinanceRateFeedSchedulerService],
  exports: [FinanceService, FinanceGapService],
})
export class FinanceModule {}
