import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiFeaturesController } from './ai-features.controller';
import { AiFeaturesService } from './ai-features.service';
import { AiService } from './ai.service';
import { AiJobProcessor } from './ai-job.processor';

@Module({
  controllers: [AiController, AiFeaturesController],
  providers: [AiService, AiFeaturesService, AiJobProcessor],
  exports: [AiService, AiFeaturesService, AiJobProcessor],
})
export class AiModule {}
