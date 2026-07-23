import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from '../auth/users.service';
import { UserProfileService } from './user-profile.service';
import { CurrentUserDecorator } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '@varnarc/auth';
import {
  activityListQuerySchema,
  assignUserRolesSchema,
  bookmarkListQuerySchema,
  createBookmarkSchema,
  paginationQuerySchema,
  recordReadingHistorySchema,
  readingHistoryListQuerySchema,
  setAvatarSchema,
  updateContentSubscriptionsSchema,
  toggleContentSubscriptionSchema,
  checkContentSubscriptionsSchema,
  subscriptionFeedQuerySchema,
  updateProfileSchema,
  updateUserStatusSchema,
  userPreferencesSchema,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ok, okCursor } from '../common/utils/response';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: UserProfileService,
  ) {}

  // --- Current user (must be before :id routes) ---

  @Public()
  @Get('profile/:username')
  async publicProfile(@Param('username') username: string) {
    return ok(await this.usersService.getPublicProfileByUsername(username));
  }

  @Get('me')
  async getMe(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.profileService.getMe(user.id));
  }

  @Put('me')
  async updateMe(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    const input = updateProfileSchema.parse(body);
    await this.usersService.updateProfile(user.id, input, user.id);
    return ok(await this.profileService.getMe(user.id));
  }

  @Put('me/profile')
  async updateMyProfile(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    const input = updateProfileSchema.parse(body);
    await this.usersService.updateProfile(user.id, input, user.id);
    return ok(await this.profileService.getMe(user.id));
  }

  @Post('me/avatar')
  async setAvatar(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(setAvatarSchema)) body: unknown,
  ) {
    return ok(await this.profileService.setAvatar(user.id, setAvatarSchema.parse(body), user.id));
  }

  @Post('me/avatar/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return ok(await this.profileService.uploadAvatar(user.id, file, user.id));
  }

  @Get('me/preferences')
  async getPreferences(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.profileService.getPreferences(user.id));
  }

  @Put('me/preferences')
  async updatePreferences(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(userPreferencesSchema)) body: unknown,
  ) {
    return ok(await this.profileService.updatePreferences(user.id, userPreferencesSchema.parse(body)));
  }

  @Get('me/bookmarks')
  async listBookmarks(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(bookmarkListQuerySchema)) query: unknown,
  ) {
    const parsed = bookmarkListQuerySchema.parse(query);
    const result = await this.profileService.listBookmarks(user.id, parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Post('me/bookmarks')
  async createBookmark(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createBookmarkSchema)) body: unknown,
  ) {
    return ok(await this.profileService.createBookmark(user.id, createBookmarkSchema.parse(body)));
  }

  @Delete('me/bookmarks/:id')
  async deleteBookmark(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.profileService.deleteBookmark(user.id, id));
  }

  @Get('me/activity')
  async listMyActivity(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(activityListQuerySchema)) query: unknown,
  ) {
    const parsed = activityListQuerySchema.parse(query);
    const result = await this.profileService.listActivity(user.id, parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Post('me/reading-history')
  async recordReadingHistory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(recordReadingHistorySchema)) body: unknown,
  ) {
    return ok(await this.profileService.recordReadingView(user.id, recordReadingHistorySchema.parse(body)));
  }

  @Get('me/reading-history')
  async listReadingHistory(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(readingHistoryListQuerySchema)) query: unknown,
  ) {
    const parsed = readingHistoryListQuerySchema.parse(query);
    const result = await this.profileService.listReadingHistory(user.id, parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Delete('me/reading-history')
  async clearReadingHistory(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.profileService.clearReadingHistory(user.id));
  }

  @Delete('me/reading-history/:id')
  async deleteReadingHistoryItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.profileService.deleteReadingHistoryItem(user.id, id));
  }

  @Get('me/subscriptions')
  async listMySubscriptions(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.profileService.listSubscriptions(user.id));
  }

  @Put('me/subscriptions')
  async updateMySubscriptions(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateContentSubscriptionsSchema)) body: unknown,
  ) {
    return ok(
      await this.profileService.updateSubscriptions(
        user.id,
        updateContentSubscriptionsSchema.parse(body),
      ),
    );
  }

  @Post('me/subscriptions/toggle')
  async toggleMySubscription(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(toggleContentSubscriptionSchema)) body: unknown,
  ) {
    return ok(
      await this.profileService.toggleSubscription(
        user.id,
        toggleContentSubscriptionSchema.parse(body),
      ),
    );
  }

  @Post('me/subscriptions/check')
  async checkMySubscriptions(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(checkContentSubscriptionsSchema)) body: unknown,
  ) {
    return ok(
      await this.profileService.checkSubscriptions(
        user.id,
        checkContentSubscriptionsSchema.parse(body),
      ),
    );
  }

  @Get('me/subscriptions/feed')
  async mySubscriptionFeed(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(subscriptionFeedQuerySchema)) query: unknown,
  ) {
    const parsed = subscriptionFeedQuerySchema.parse(query);
    return ok(await this.profileService.subscriptionFeed(user.id, parsed.limit ?? 20));
  }

  @Get('me/subscriptions/catalog')
  async subscriptionCatalog(@CurrentUserDecorator() user: CurrentUser) {
    void user;
    return ok(await this.profileService.subscriptionCatalog());
  }

  // --- Admin ---

  @Get('activity')
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async adminActivity(@Query(new ZodValidationPipe(activityListQuerySchema)) query: unknown) {
    const parsed = activityListQuerySchema.parse(query);
    const result = await this.profileService.adminActivityDashboard(parsed);
    return ok({
      recentCount: result.recentCount,
      items: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: parsed.limit ?? 25,
      },
    });
  }

  @Get('subscriptions')
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async adminSubscriptions(
    @Query(new ZodValidationPipe(bookmarkListQuerySchema)) query: unknown,
  ) {
    const parsed = bookmarkListQuerySchema.parse(query);
    const result = await this.profileService.adminSubscriptionsDashboard(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: unknown) {
    const result = await this.usersService.list(paginationQuerySchema.parse(query));
    return { success: true, ...result };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.usersService.getById(id) };
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    const input = updateProfileSchema.parse(body);
    await this.usersService.updateProfile(id, input, actor.id);
    return { success: true, data: await this.usersService.getById(id) };
  }

  @Put(':id/status')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) body: unknown,
  ) {
    const input = updateUserStatusSchema.parse(body);
    return {
      success: true,
      data: await this.usersService.updateStatus(id, input.status, actor.id),
    };
  }

  @Put(':id/roles')
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
    @Body(new ZodValidationPipe(assignUserRolesSchema)) body: unknown,
  ) {
    const input = assignUserRolesSchema.parse(body);
    return {
      success: true,
      data: await this.usersService.assignRoles(id, input, actor.id),
    };
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USER_DELETE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
  ) {
    return {
      success: true,
      data: await this.usersService.softDelete(id, actor.id),
    };
  }

  @Get(':id/login-history')
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async loginHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: unknown,
  ) {
    const result = await this.usersService.loginHistory(
      id,
      paginationQuerySchema.parse(query),
    );
    return { success: true, ...result };
  }

  @Get(':id/audit-logs')
  @RequirePermissions(PERMISSIONS.USER_VIEW)
  async auditLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: unknown,
  ): Promise<{ success: true; data: unknown; meta: unknown }> {
    const result = await this.usersService.auditLogs(id, paginationQuerySchema.parse(query));
    return { success: true, ...result };
  }
}
