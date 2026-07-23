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
  createPageSchema,
  cursorPaginationQuerySchema,
  publishStatusSchema,
  scheduleContentSchema,
  reviewActionSchema,
  updatePageSchema,
  type CreatePageInput,
  type CursorPaginationQuery,
  type ReviewActionInput,
  type ScheduleContentInput,
  type UpdatePageInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok, okCursor } from '../../../common/utils/response';
import { PagesService } from './pages.service';

const pageListSchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
});

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly service: PagesService) {}

  @Public()
  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getPublishedBySlug(slug));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async list(
    @Query(new ZodValidationPipe(pageListSchema))
    query: CursorPaginationQuery & { status?: string },
  ) {
    return okCursor(await this.service.list(query));
  }

  @Get(':id/versions')
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async versions(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.versions(id));
  }

  @Get(':id/versions/:versionId')
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async version(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return ok(await this.service.getVersion(id, versionId));
  }

  @Post(':id/versions/:versionId/restore')
  @RequirePermissions(PERMISSIONS.PAGE_EDIT)
  async restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.restoreVersion(id, versionId, user.id));
  }

  @Get(':id/preview')
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async preview(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAGE_CREATE)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createPageSchema)) body: CreatePageInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PAGE_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updatePageSchema)) body: UpdatePageInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.PAGE_PUBLISH)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publish(id, user.id));
  }

  @Post(':id/schedule')
  @RequirePermissions(PERMISSIONS.PAGE_PUBLISH)
  async schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(scheduleContentSchema)) body: ScheduleContentInput,
  ) {
    return ok(await this.service.schedule(id, body, user.id));
  }

  @Post(':id/submit-review')
  @RequirePermissions(PERMISSIONS.PAGE_EDIT)
  async submitReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.submitReview(id, user.id));
  }

  @Post(':id/approve-review')
  @RequirePermissions(PERMISSIONS.PAGE_REVIEW)
  async approveReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.approveReview(id, user.id));
  }

  @Post(':id/reject-review')
  @RequirePermissions(PERMISSIONS.PAGE_REVIEW)
  async rejectReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(reviewActionSchema)) body: ReviewActionInput,
  ) {
    return ok(await this.service.rejectReview(id, body.notes, user.id));
  }

  @Post(':id/duplicate')
  @RequirePermissions(PERMISSIONS.PAGE_CREATE)
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.duplicate(id, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.remove(id, user.id));
  }
}
