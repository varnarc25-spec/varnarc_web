import { Module } from '@nestjs/common';
import { AutomobileController } from './automobile.controller';
import { AutomobileService } from './automobile.service';
import { AutomobilePriceAiService } from './automobile-price-ai.service';

@Module({
  controllers: [AutomobileController],
  providers: [AutomobileService, AutomobilePriceAiService],
  exports: [AutomobileService, AutomobilePriceAiService],
})
export class AutomobileModule {}
