import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  broadcastNotificationSchema,
  createNotificationTemplateSchema,
  notificationListQuerySchema,
  notificationProvidersSchema,
  notificationTemplateListQuerySchema,
  updateNotificationTemplateSchema,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('status')
  @Public()
  status() {
    return ok({ module: 'notifications', status: 'ready' });
  }

  // --- User inbox (authenticated) ---

  @Get('me')
  async listMine(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: unknown,
  ) {
    const parsed = notificationListQuerySchema.parse(query);
    const result = await this.service.listMine(user.id, parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Get('me/unread-count')
  async unreadCount(@CurrentUserDecorator() user: CurrentUser) {
    const count = await this.service.unreadCount(user.id);
    return ok({ count });
  }

  @Patch('me/read-all')
  async markAllRead(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.markAllRead(user.id));
  }

  @Patch('me/:id/read')
  async markRead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return ok(await this.service.markRead(user.id, id));
  }

  // --- Admin ---

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Get('templates')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async listTemplates(
    @Query(new ZodValidationPipe(notificationTemplateListQuerySchema)) query: unknown,
  ) {
    const parsed = notificationTemplateListQuerySchema.parse(query);
    const result = await this.service.listTemplates(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Post('templates')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async createTemplate(
    @Body(new ZodValidationPipe(createNotificationTemplateSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(
      await this.service.createTemplate(createNotificationTemplateSchema.parse(body), user?.id),
    );
  }

  @Put('templates/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async updateTemplate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateNotificationTemplateSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(
      await this.service.updateTemplate(id, updateNotificationTemplateSchema.parse(body), user?.id),
    );
  }

  @Delete('templates/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.deleteTemplate(id, user?.id));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async listAll(@Query(new ZodValidationPipe(notificationListQuerySchema)) query: unknown) {
    const parsed = notificationListQuerySchema.parse(query);
    const result = await this.service.listAll(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Post('broadcast')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async broadcast(
    @Body(new ZodValidationPipe(broadcastNotificationSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.broadcast(broadcastNotificationSchema.parse(body), user?.id));
  }

  @Get('providers/settings')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async getProviders() {
    return ok(await this.service.getProviders());
  }

  @Put('providers/settings')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async setProviders(
    @Body(new ZodValidationPipe(notificationProvidersSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(
      await this.service.setProviders(notificationProvidersSchema.parse(body), user?.id),
    );
  }
}
