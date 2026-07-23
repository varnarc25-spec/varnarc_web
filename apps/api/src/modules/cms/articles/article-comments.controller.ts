import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PERMISSIONS } from '@varnarc/auth';
import { SECURITY_RATE_LIMITS } from '@varnarc/config';
import type { CurrentUser } from '@varnarc/types';
import {
  commentListQuerySchema,
  bulkModerateCommentsSchema,
  createCommentSchema,
  moderateCommentSchema,
  updateCommentSchema,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok, okCursor } from '../../../common/utils/response';
import { ArticleCommentsService } from './article-comments.service';

@ApiTags('article-comments')
@Controller('article-comments')
export class ArticleCommentsController {
  constructor(private readonly service: ArticleCommentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published comments for an article' })
  async list(
    @Query(new ZodValidationPipe(commentListQuerySchema)) query: unknown,
  ) {
    const parsed = commentListQuerySchema.parse(query);
    if (!parsed.articleId) {
      return ok({ items: [], total: 0, hasMore: false, nextCursor: null });
    }
    const result = await this.service.listForArticle(parsed.articleId, parsed);
    return ok({
      items: result.items,
      total: result.total,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: parsed.limit ?? 50,
      },
    });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'List published comments by article slug' })
  async listBySlug(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(commentListQuerySchema)) query: unknown,
  ) {
    const parsed = commentListQuerySchema.parse(query);
    const result = await this.service.listByArticleSlug(slug, parsed);
    return ok({
      items: result.items,
      total: result.total,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: parsed.limit ?? 50,
      },
    });
  }

  @Post()
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.contact, ttl: 60_000 } })
  @ApiOperation({ summary: 'Post a comment on an article (authenticated)' })
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createCommentSchema)) body: unknown,
  ) {
    return ok(await this.service.create(createCommentSchema.parse(body), user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit own comment' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateCommentSchema)) body: unknown,
  ) {
    return ok(await this.service.update(id, updateCommentSchema.parse(body), user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own comment (or admin)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.remove(id, user));
  }

  @Get('moderation/list')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  @ApiOperation({ summary: 'Admin comment moderation queue' })
  async moderation(
    @Query(new ZodValidationPipe(commentListQuerySchema)) query: unknown,
  ) {
    const parsed = commentListQuerySchema.parse(query);
    const result = await this.service.listModeration(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Patch(':id/moderate')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  @ApiOperation({ summary: 'Change comment status (admin)' })
  async moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(moderateCommentSchema)) body: unknown,
  ) {
    return ok(await this.service.moderate(id, moderateCommentSchema.parse(body), user));
  }

  @Post('moderation/bulk')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  @ApiOperation({ summary: 'Bulk moderate comments (admin)' })
  async bulkModerate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(bulkModerateCommentsSchema)) body: unknown,
  ) {
    return ok(await this.service.bulkModerate(bulkModerateCommentsSchema.parse(body), user));
  }
}
