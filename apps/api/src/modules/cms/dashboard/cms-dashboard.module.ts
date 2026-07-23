import { Module } from '@nestjs/common';
import { CmsDashboardController } from './cms-dashboard.controller';
import { CmsDashboardService } from './cms-dashboard.service';

@Module({
  controllers: [CmsDashboardController],
  providers: [CmsDashboardService],
})
export class CmsDashboardModule {}
