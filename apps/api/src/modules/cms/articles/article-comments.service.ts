import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  BulkModerateCommentsInput,
  CommentListQuery,
  CreateCommentInput,
  ModerateCommentInput,
  UpdateCommentInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { isAdminRole } from '@varnarc/auth';
import { REPOS } from '../../../database/database.module';
import { scoreCommentSpam } from './comment-spam.util';

function sliceCursor<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}

@Injectable()
export class ArticleCommentsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  private async assertPublishedArticle(articleId: string) {
    const article = await this.repos.articles.findById(articleId);
    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async listForArticle(articleId: string, query: Pick<CommentListQuery, 'cursor' | 'limit'>) {
    await this.assertPublishedArticle(articleId);
    const limit = query.limit ?? 50;
    const rows = await this.repos.comments.listByArticle(articleId, {
      status: 'PUBLISHED',
      cursor: query.cursor,
      limit,
    });
    const page = sliceCursor(rows, limit);
    const total = await this.repos.comments.countByArticle(articleId, 'PUBLISHED');
    return { ...page, total };
  }

  async listByArticleSlug(slug: string, query: Pick<CommentListQuery, 'cursor' | 'limit'>) {
    const article = await this.repos.articles.findBySlug(slug);
    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('Article not found');
    }
    return this.listForArticle(article.id, query);
  }

  async create(input: CreateCommentInput, user: CurrentUser) {
    const article = await this.assertPublishedArticle(input.articleId);

    if (input.parentId) {
      const parent = await this.repos.comments.findById(input.parentId);
      if (!parent || parent.articleId !== article.id) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const body = input.body.trim();
    const spam = scoreCommentSpam(body);
    const autoModeration = await this.repos.featureFlags.findByKey('comments.auto-moderation.enabled');
    const status =
      autoModeration?.enabled !== false && spam.shouldReview ? 'REVIEW' : 'PUBLISHED';

    return this.repos.comments.create({
      body,
      status,
      article: { connect: { id: article.id } },
      user: { connect: { id: user.id } },
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
  }

  async update(commentId: string, input: UpdateCommentInput, user: CurrentUser) {
    const comment = await this.repos.comments.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== user.id && !isAdminRole(user.roles)) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    return this.repos.comments.update(commentId, { body: input.body.trim() });
  }

  async remove(commentId: string, user: CurrentUser) {
    const comment = await this.repos.comments.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== user.id && !isAdminRole(user.roles)) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.repos.comments.softDelete(commentId);
    return { ok: true };
  }

  async moderate(commentId: string, input: ModerateCommentInput, user: CurrentUser) {
    if (!isAdminRole(user.roles)) {
      throw new ForbiddenException('Admin access required');
    }
    const comment = await this.repos.comments.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    return this.repos.comments.update(commentId, { status: input.status });
  }

  async bulkModerate(input: BulkModerateCommentsInput, user: CurrentUser) {
    if (!isAdminRole(user.roles)) {
      throw new ForbiddenException('Admin access required');
    }
    const updated = [];
    for (const id of input.ids) {
      const comment = await this.repos.comments.findById(id);
      if (!comment) continue;
      await this.repos.comments.update(id, { status: input.status });
      updated.push(id);
    }
    return { updated: updated.length, ids: updated };
  }

  async listModeration(query: CommentListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.comments.listModeration({
      status: query.flagged ? 'REVIEW' : query.status,
      articleId: query.articleId,
      cursor: query.cursor,
      limit,
    });
    return sliceCursor(rows, limit);
  }
}
