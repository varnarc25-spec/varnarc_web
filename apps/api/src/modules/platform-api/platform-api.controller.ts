import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  apiLogListQuerySchema,
  createApiKeySchema,
  createWebhookSchema,
  cursorPaginationQuerySchema,
  updateApiKeySchema,
  updateWebhookSchema,
  webhookTestSchema,
  type ApiLogListQuery,
  type CreateApiKeyInput,
  type CreateWebhookInput,
  type CursorPaginationQuery,
  type UpdateApiKeyInput,
  type UpdateWebhookInput,
  type WebhookTestInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { PlatformApiService } from './platform-api.service';

@ApiTags('platform')
@Controller()
export class PlatformApiRootController {
  constructor(private readonly service: PlatformApiService) {}

  @Public()
  @Get('version')
  @ApiOperation({ summary: 'API version metadata' })
  version() {
    return ok(this.service.version());
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'API runtime status' })
  async status() {
    return ok(await this.service.status());
  }

  @Public()
  @Get('developers')
  @ApiOperation({ summary: 'Developer portal metadata (docs, SDK, webhooks)' })
  developers() {
    return ok(this.service.developers());
  }
}

@ApiTags('platform')
@Controller('platform')
export class PlatformApiController {
  constructor(private readonly service: PlatformApiService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async overview() {
    return ok(await this.service.overview());
  }

  @Get('logs')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async logs(@Query(new ZodValidationPipe(apiLogListQuerySchema)) query: ApiLogListQuery) {
    const page = await this.service.listLogs(query);
    return okCursor(page);
  }

  @Post('logs/prune')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async pruneLogs() {
    return ok(await this.service.pruneLogs());
  }

  @Get('keys')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async keys(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listKeys(query));
  }

  @Post('keys')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async createKey(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createApiKeySchema)) body: CreateApiKeyInput,
  ) {
    return ok(await this.service.createKey(body, user.id));
  }

  @Put('keys/:id')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async updateKey(
    @Param('id') id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateApiKeySchema)) body: UpdateApiKeyInput,
  ) {
    return ok(await this.service.updateKey(id, body, user.id));
  }

  @Delete('keys/:id')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async revokeKey(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.revokeKey(id, user.id));
  }

  @Get('webhooks')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async webhooks(
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listWebhooks(query));
  }

  @Post('webhooks')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async createWebhook(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createWebhookSchema)) body: CreateWebhookInput,
  ) {
    return ok(await this.service.createWebhook(body, user.id));
  }

  @Put('webhooks/:id')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async updateWebhook(
    @Param('id') id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateWebhookSchema)) body: UpdateWebhookInput,
  ) {
    return ok(await this.service.updateWebhook(id, body, user.id));
  }

  @Delete('webhooks/:id')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async deleteWebhook(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteWebhook(id, user.id));
  }

  @Post('webhooks/:id/test')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async testWebhook(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(webhookTestSchema)) body: WebhookTestInput,
  ) {
    return ok(await this.service.testWebhook(id, body));
  }

  @Get('webhooks/:id/deliveries')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async webhookDeliveries(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listWebhookDeliveries(id, query));
  }

  @Get('rate-limits')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  rateLimits() {
    return ok(this.service.rateLimits());
  }
}
