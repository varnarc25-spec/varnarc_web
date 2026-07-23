import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  calculatorAssistSchema,
  editorialEnrichSchema,
  generateAiSeoSchema,
  summarizeBatchSchema,
  summarizeContentSchema,
  type CalculatorAssistInput,
  type EditorialEnrichInput,
  type GenerateAiSeoInput,
  type SummarizeBatchInput,
  type SummarizeContentInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok } from '../../common/utils/response';
import { AiFeaturesService } from './ai-features.service';

@ApiTags('ai-features')
@Controller('ai/features')
export class AiFeaturesController {
  constructor(private readonly service: AiFeaturesService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'AI feature availability' })
  status() {
    return ok(this.service.status());
  }

  @Public()
  @Post('summarize')
  @ApiOperation({ summary: 'Summarize long-form content' })
  async summarize(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(summarizeContentSchema)) body: SummarizeContentInput,
  ) {
    return ok(await this.service.summarize(body, user?.id ?? null));
  }

  @Post('summarize/batch')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  @ApiOperation({ summary: 'Batch summarize multiple documents' })
  async summarizeBatch(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(summarizeBatchSchema)) body: SummarizeBatchInput,
  ) {
    return ok(await this.service.summarizeBatch(body, user.id));
  }

  @Post('editorial/enrich-drafts')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  @ApiOperation({ summary: 'AI-enrich draft articles with excerpt and SEO' })
  async enrichDrafts(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(editorialEnrichSchema)) body: EditorialEnrichInput,
  ) {
    return ok(await this.service.enrichDraftArticles(body, user.id));
  }

  @Public()
  @Post('seo')
  @ApiOperation({ summary: 'Generate SEO metadata from content' })
  async seo(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(generateAiSeoSchema)) body: GenerateAiSeoInput,
  ) {
    return ok(await this.service.generateSeo(body, user?.id ?? null));
  }

  @Public()
  @Post('calculator-assist')
  @ApiOperation({ summary: 'Explain calculator inputs and outputs' })
  async calculatorAssist(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(calculatorAssistSchema)) body: CalculatorAssistInput,
  ) {
    return ok(await this.service.calculatorAssist(body, user?.id ?? null));
  }
}
