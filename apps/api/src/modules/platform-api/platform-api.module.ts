import { Module } from '@nestjs/common';
import { HealthModule } from '../../health/health.module';
import { PlatformApiController, PlatformApiRootController } from './platform-api.controller';
import { PlatformApiService } from './platform-api.service';

@Module({
  imports: [HealthModule],
  controllers: [PlatformApiRootController, PlatformApiController],
  providers: [PlatformApiService],
  exports: [PlatformApiService],
})
export class PlatformApiModule {}
