import { Module } from '@nestjs/common';
import { AutomobileController } from './automobile.controller';
import { AutomobileService } from './automobile.service';
import { AutomobilePriceAiService } from './automobile-price-ai.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [AutomobileController],
  providers: [AutomobileService, AutomobilePriceAiService],
  exports: [AutomobileService, AutomobilePriceAiService],
})
export class AutomobileModule {}
