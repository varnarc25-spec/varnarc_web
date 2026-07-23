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
  createTagSchema,
  cursorPaginationQuerySchema,
  updateTagSchema,
  type CreateTagInput,
  type CursorPaginationQuery,
  type UpdateTagInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok, okCursor } from '../../../common/utils/response';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Public()
  @Get()
  async list(
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.list(query));
  }

  @Public()
  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug));
  }

  @Public()
  @Get('slug/:slug/articles')
  async articlesBySlug(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listArticlesBySlug(slug, query));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createTagSchema)) body: CreateTagInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTagSchema)) body: UpdateTagInput,
  ) {
    return ok(await this.service.update(id, body));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ARTICLE_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.remove(id));
  }
}
