import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateProductInput,
  CreateReviewInput,
  CreateUserReviewInput,
  CursorPaginationQuery,
  ModerationActionInput,
  ReviewsListQuery,
  UpdateReviewInput,
  UpdateUserReviewInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

@Injectable()
export class ReviewsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  listProducts(query: CursorPaginationQuery) {
    return this.repos.products.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
  }

  listReviews(query: ReviewsListQuery, publishedOnly = true) {
    return this.repos.reviews.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      productId: query.productId,
      entityType: query.entityType,
      entityId: query.entityId,
      reviewType: query.reviewType,
      status: query.status ?? (publishedOnly ? 'PUBLISHED' : undefined),
    });
  }

  async getReviewById(id: string, publishedOnly = true) {
    const row = await this.repos.reviews.findById(id);
    if (!row || (publishedOnly && row.status !== 'PUBLISHED')) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }
    return row;
  }

  async getReviewBySlug(slug: string, publishedOnly = true) {
    const row = await this.repos.reviews.findBySlug(slug, publishedOnly ? 'PUBLISHED' : undefined);
    if (!row) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }
    return row;
  }

  async trackView(id: string) {
    const row = await this.repos.reviews.findById(id);
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }
    await this.repos.reviews.incrementViewCount(id);
    return { viewCount: row.viewCount + 1 };
  }

  createProduct(input: CreateProductInput, actorId: string) {
    return this.repos.products.create({
      name: input.name,
      slug: input.slug,
      category: input.category ?? null,
      description: input.description ?? null,
      metadata: input.metadata as never,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  createReview(input: CreateReviewInput, authorId: string) {
    return this.repos.reviews.create({
      title: input.title,
      slug: input.slug,
      reviewType: input.reviewType,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      body: input.body ?? null,
      verdict: input.verdict ?? null,
      recommendation: input.recommendation ?? null,
      status: input.status,
      overallScore: input.overallScore ?? undefined,
      featuredMediaId: input.featuredMediaId ?? null,
      metadata: (input.metadata ?? null) as never,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      product: { connect: { id: input.productId } },
      author: { connect: { id: authorId } },
      sections: { create: input.sections },
      scores: { create: input.scores },
      pros: { create: input.pros.map((text) => ({ text })) },
      cons: { create: input.cons.map((text) => ({ text })) },
      createdBy: authorId,
      updatedBy: authorId,
    });
  }

  async updateReview(id: string, input: UpdateReviewInput, actorId: string) {
    const existing = await this.repos.reviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }

    return this.repos.reviews.updateWithNested(id, {
      review: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.reviewType !== undefined ? { reviewType: input.reviewType } : {}),
        ...(input.entityType !== undefined ? { entityType: input.entityType } : {}),
        ...(input.entityId !== undefined ? { entityId: input.entityId } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.verdict !== undefined ? { verdict: input.verdict } : {}),
        ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.overallScore !== undefined ? { overallScore: input.overallScore } : {}),
        ...(input.featuredMediaId !== undefined ? { featuredMediaId: input.featuredMediaId } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.productId ? { product: { connect: { id: input.productId } } } : {}),
        updatedBy: actorId,
      },
      ...(input.sections ? { sections: input.sections } : {}),
      ...(input.scores ? { scores: input.scores } : {}),
      ...(input.pros ? { pros: input.pros } : {}),
      ...(input.cons ? { cons: input.cons } : {}),
    });
  }

  async deleteReview(id: string, actorId: string) {
    const existing = await this.repos.reviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }
    return this.repos.reviews.softDelete(id, actorId);
  }

  async publishReview(id: string, actorId: string) {
    const existing = await this.repos.reviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
    }
    return this.repos.reviews.publish(id, actorId);
  }

  analytics() {
    return this.repos.reviews.analytics();
  }

  listModeration(query: CursorPaginationQuery) {
    return this.repos.userReviews.listModeration({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  async moderateUserReview(id: string, input: ModerationActionInput, actorId: string) {
    const existing = await this.repos.userReviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'User review not found.' } });
    }

    const status =
      input.status === 'APPROVED' || input.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : input.status === 'REJECTED'
          ? 'ARCHIVED'
          : input.status;

    return this.repos.userReviews.update(id, {
      status,
      updatedAt: new Date(),
      ...(actorId ? {} : {}),
    });
  }

  async createUserReview(input: CreateUserReviewInput, userId: string) {
    const duplicate = await this.repos.userReviews.findByUserAndEntity(
      userId,
      input.entityType,
      input.entityId,
    );
    if (duplicate) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE_REVIEW', message: 'You already reviewed this item.' },
      });
    }

    return this.repos.userReviews.create({
      entityType: input.entityType,
      entityId: input.entityId,
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment ?? null,
      status: 'REVIEW',
      user: { connect: { id: userId } },
      productId: input.productId ?? null,
      ...(input.reviewId ? { review: { connect: { id: input.reviewId } } } : {}),
    });
  }

  async updateUserReview(id: string, input: UpdateUserReviewInput, userId: string) {
    const existing = await this.repos.userReviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'User review not found.' } });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException({ success: false, error: { code: 'FORBIDDEN', message: 'Not your review.' } });
    }

    return this.repos.userReviews.update(id, {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      status: 'REVIEW',
    });
  }

  async deleteUserReview(id: string, userId: string) {
    const existing = await this.repos.userReviews.findById(id);
    if (!existing) {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'User review not found.' } });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException({ success: false, error: { code: 'FORBIDDEN', message: 'Not your review.' } });
    }
    return this.repos.userReviews.softDelete(id);
  }

  async voteHelpful(userReviewId: string, userId: string, vote: number) {
    const existing = await this.repos.userReviews.findById(userReviewId);
    if (!existing || existing.status !== 'PUBLISHED') {
      throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: 'User review not found.' } });
    }
    if (existing.userId === userId) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_VOTE', message: 'Cannot vote on your own review.' },
      });
    }
    return this.repos.userReviews.voteHelpful(userReviewId, userId, vote);
  }

  listEntityUserReviews(entityType: string, entityId: string, query: CursorPaginationQuery) {
    return this.repos.userReviews.listByEntity(entityType, entityId, {
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  entityRatingSummary(entityType: string, entityId: string) {
    return this.repos.userReviews.entityRatingSummary(entityType, entityId);
  }
}
