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
  createArticleSchema,
  cursorPaginationQuerySchema,
  publishStatusSchema,
  scheduleContentSchema,
  reviewActionSchema,
  updateArticleSchema,
  generateArticleDraftSchema,
  improveArticleSchema,
  suggestRelatedArticlesSchema,
  type CreateArticleInput,
  type CursorPaginationQuery,
  type GenerateArticleDraftInput,
  type ImproveArticleInput,
  type ScheduleContentInput,
  type ReviewActionInput,
  type SuggestRelatedArticlesInput,
  type UpdateArticleInput,
} from '@varnarc/validation';
import { z } from 'zod';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok, okCursor } from '../../../common/utils/response';
import { ArticlesService } from './articles.service';
import { ArticleAiService } from './article-ai.service';

const articleListSchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().min(1).max(150).optional(),
  parentCategorySlug: z.string().min(1).max(150).optional(),
  featured: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
});

const limitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

const editorialSuggestionsQuerySchema = limitSchema.extend({
  parentCategorySlug: z.string().min(1).max(150).optional(),
  categorySlug: z.string().min(1).max(150).optional(),
  source: z
    .enum(['trending', 'popular', 'search_demand', 'content_gap', 'editorial', 'all'])
    .optional()
    .default('all'),
});

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly service: ArticlesService,
    private readonly articleAi: ArticleAiService,
  ) {}

  @Public()
  @Get()
  async listPublic(
    @Query(new ZodValidationPipe(articleListSchema))
    query: CursorPaginationQuery & { status?: string; categoryId?: string; featured?: boolean },
  ) {
    return okCursor(
      await this.service.list({
        ...query,
        status: 'PUBLISHED',
      }),
    );
  }

  @Get('manage')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async listManage(
    @Query(new ZodValidationPipe(articleListSchema))
    query: CursorPaginationQuery & { status?: string; categoryId?: string; featured?: boolean },
  ) {
    return okCursor(await this.service.list(query));
  }

  @Get('editorial-suggestions')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async editorialSuggestions(
    @Query(new ZodValidationPipe(editorialSuggestionsQuerySchema))
    query: z.infer<typeof editorialSuggestionsQuerySchema>,
  ) {
    const { limit, parentCategorySlug, categorySlug, source } = query;
    return ok(
      await this.service.editorialSuggestions(limit, {
        parentCategorySlug,
        categorySlug,
        source,
      }),
    );
  }

  @Get('ai/status')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async aiStatus() {
    return ok(this.articleAi.configured());
  }

  @Post('ai/generate-draft')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async generateDraft(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(generateArticleDraftSchema)) body: GenerateArticleDraftInput,
  ) {
    return ok(await this.articleAi.generateDraft(body, user.id));
  }

  @Post('ai/improve')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async improveArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(improveArticleSchema)) body: ImproveArticleInput,
  ) {
    return ok(await this.articleAi.improve(body, user.id));
  }

  @Post('ai/suggest-related')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async suggestRelated(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(suggestRelatedArticlesSchema)) body: SuggestRelatedArticlesInput,
  ) {
    return ok(await this.articleAi.suggestRelated(body, user.id));
  }

  @Public()
  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getPublishedBySlug(slug));
  }

  @Get(':id/preview')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async preview(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Get(':id/versions')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async versions(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.versions(id));
  }

  @Get(':id/versions/:versionId')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async version(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return ok(await this.service.getVersion(id, versionId));
  }

  @Post(':id/versions/:versionId/restore')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.restoreVersion(id, versionId, user));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createArticleSchema)) body: CreateArticleInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateArticleSchema)) body: UpdateArticleInput,
  ) {
    return ok(await this.service.update(id, body, user));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.ARTICLE_PUBLISH)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publish(id, user));
  }

  @Post(':id/schedule')
  @RequirePermissions(PERMISSIONS.ARTICLE_PUBLISH)
  async schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(scheduleContentSchema)) body: ScheduleContentInput,
  ) {
    return ok(await this.service.schedule(id, body, user));
  }

  @Post(':id/submit-review')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async submitReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.submitReview(id, user));
  }

  @Post(':id/approve-review')
  @RequirePermissions(PERMISSIONS.ARTICLE_REVIEW)
  async approveReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.approveReview(id, user));
  }

  @Post(':id/reject-review')
  @RequirePermissions(PERMISSIONS.ARTICLE_REVIEW)
  async rejectReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(reviewActionSchema)) body: ReviewActionInput,
  ) {
    return ok(await this.service.rejectReview(id, body.notes, user));
  }

  @Post(':id/duplicate')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.duplicate(id, user));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ARTICLE_DELETE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.remove(id, user));
  }
}
