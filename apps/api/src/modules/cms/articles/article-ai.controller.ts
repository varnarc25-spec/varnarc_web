import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  generateArticleDraftSchema,
  generateArticleImageSchema,
  improveArticleSchema,
  suggestRelatedArticlesSchema,
  type GenerateArticleDraftInput,
  type GenerateArticleImageInput,
  type ImproveArticleInput,
  type SuggestRelatedArticlesInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok } from '../../../common/utils/response';
import { ArticleAiService } from './article-ai.service';

@ApiTags('article-ai')
@Controller('articles/ai')
export class ArticleAiController {
  constructor(private readonly articleAi: ArticleAiService) {}

  @Get('status')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async aiStatus() {
    return ok(await this.articleAi.configured());
  }

  @Post('generate-draft')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async generateDraft(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(generateArticleDraftSchema)) body: GenerateArticleDraftInput,
  ) {
    return ok(await this.articleAi.generateDraft(body, user.id));
  }

  @Post('improve')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async improveArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(improveArticleSchema)) body: ImproveArticleInput,
  ) {
    return ok(await this.articleAi.improve(body, user.id));
  }

  @Post('suggest-related')
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  async suggestRelated(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(suggestRelatedArticlesSchema)) body: SuggestRelatedArticlesInput,
  ) {
    return ok(await this.articleAi.suggestRelated(body, user.id));
  }

  @Post('generate-image')
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  async generateImage(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(generateArticleImageSchema)) body: GenerateArticleImageInput,
  ) {
    return ok(await this.articleAi.generateImage(body, user.id));
  }
}
