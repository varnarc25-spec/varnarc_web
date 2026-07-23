import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HealthModule } from '../../health/health.module';
import { PerformanceModule } from '../performance/performance.module';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [DatabaseModule, HealthModule, PerformanceModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
