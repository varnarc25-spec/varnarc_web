import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  aiJobListQuerySchema,
  createAiJobSchema,
  createAiModelSchema,
  createAiPromptSchema,
  cursorPaginationQuerySchema,
  runAiPromptTestSchema,
  updateAiModelSchema,
  updateAiPromptSchema,
  type AiJobListQuery,
  type CreateAiJobInput,
  type CreateAiModelInput,
  type CreateAiPromptInput,
  type CursorPaginationQuery,
  type RunAiPromptTestInput,
  type UpdateAiModelInput,
  type UpdateAiPromptInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get('usage')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async usage() {
    return ok(await this.service.getUsage());
  }

  @Get('overview')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async overview() {
    return ok(await this.service.getOverview());
  }

  @Get('settings')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async settings() {
    return ok(this.service.getSettings());
  }

  @Get('models')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async models(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listModels(query));
  }

  @Post('models')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async createModel(@Body(new ZodValidationPipe(createAiModelSchema)) body: CreateAiModelInput) {
    return ok(await this.service.createModel(body));
  }

  @Put('models/:id')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async updateModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAiModelSchema)) body: UpdateAiModelInput,
  ) {
    return ok(await this.service.updateModel(id, body));
  }

  @Delete('models/:id')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async deleteModel(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.deleteModel(id));
  }

  @Get('prompts')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async prompts(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listPrompts(query));
  }

  @Post('prompts')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async createPrompt(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAiPromptSchema)) body: CreateAiPromptInput,
  ) {
    return ok(await this.service.createPrompt(body, user.id));
  }

  @Put('prompts/:id')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async updatePrompt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAiPromptSchema)) body: UpdateAiPromptInput,
  ) {
    return ok(await this.service.updatePrompt(id, body, user.id));
  }

  @Delete('prompts/:id')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async deletePrompt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deletePrompt(id, user.id));
  }

  @Get('jobs')
  @RequirePermissions(PERMISSIONS.AI_OPS_VIEW)
  async jobs(@Query(new ZodValidationPipe(aiJobListQuerySchema)) query: AiJobListQuery) {
    const result = await this.service.listJobs(query);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
      limit: query.limit ?? 25,
    });
  }

  @Post('jobs')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async createJob(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAiJobSchema)) body: CreateAiJobInput,
  ) {
    return ok(await this.service.createJob(body, user.id));
  }

  @Post('jobs/:id/retry')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async retryJob(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.retryJob(id));
  }

  @Post('run-test')
  @RequirePermissions(PERMISSIONS.AI_OPS_MANAGE)
  async runTest(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(runAiPromptTestSchema)) body: RunAiPromptTestInput,
  ) {
    return ok(await this.service.runPromptTest(body, user.id));
  }
}
