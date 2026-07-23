import { Module } from '@nestjs/common';
import { HealthModule } from '../../health/health.module';
import { SearchModule } from '../search/search.module';
import { PerformanceController, PerformanceMetricsController } from './performance.controller';
import { PerformanceService } from './performance.service';

@Module({
  imports: [HealthModule, SearchModule],
  controllers: [PerformanceMetricsController, PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
