import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiFeaturesController } from './ai-features.controller';
import { AiFeaturesService } from './ai-features.service';
import { AiService } from './ai.service';
import { AiJobProcessor } from './ai-job.processor';
import { LlmProviderService } from './llm-provider.service';

@Module({
  controllers: [AiController, AiFeaturesController],
  providers: [AiService, AiFeaturesService, AiJobProcessor, LlmProviderService],
  exports: [AiService, AiFeaturesService, AiJobProcessor, LlmProviderService],
})
export class AiModule {}
