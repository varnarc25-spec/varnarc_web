import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

const reviewInclude = {
  product: true,
  author: true,
  sections: { orderBy: { sortOrder: 'asc' as const } },
  scores: true,
  pros: true,
  cons: true,
};

export class ProductRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.product, id);
  }

  findBySlug(slug: string) {
    return this.db.product.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: CursorPageParams & { category?: string; search?: string } = {}) {
    return listActiveWithCursor(this.db.product, {
      ...params,
      where: {
        ...(params.category ? { category: params.category } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return this.db.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return this.db.product.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.product, id, actorId);
  }
}

export class ReviewRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.review.findFirst({
      where: { id, deletedAt: null },
      include: reviewInclude,
    });
  }

  findBySlug(slug: string, status?: PublishStatus) {
    return this.db.review.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      include: reviewInclude,
    });
  }

  list(
    params: CursorPageParams & {
      status?: PublishStatus;
      productId?: string;
      entityType?: string;
      entityId?: string;
      reviewType?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.review, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.productId ? { productId: params.productId } : {}),
        ...(params.entityType ? { entityType: params.entityType } : {}),
        ...(params.entityId ? { entityId: params.entityId } : {}),
        ...(params.reviewType ? { reviewType: params.reviewType } : {}),
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { summary: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { product: true, author: true },
    });
  }

  create(data: Prisma.ReviewCreateInput) {
    return this.db.review.create({ data, include: reviewInclude });
  }

  async updateWithNested(
    id: string,
    data: {
      review: Prisma.ReviewUpdateInput;
      sections?: Array<{ title: string; body?: string | null; sortOrder: number }>;
      scores?: Array<{ label: string; score: number; maxScore: number }>;
      pros?: string[];
      cons?: string[];
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.sections) {
        await tx.reviewSection.deleteMany({ where: { reviewId: id } });
      }
      if (data.scores) {
        await tx.reviewScore.deleteMany({ where: { reviewId: id } });
      }
      if (data.pros) {
        await tx.reviewPro.deleteMany({ where: { reviewId: id } });
      }
      if (data.cons) {
        await tx.reviewCon.deleteMany({ where: { reviewId: id } });
      }

      return tx.review.update({
        where: { id },
        data: {
          ...data.review,
          ...(data.sections ? { sections: { create: data.sections } } : {}),
          ...(data.scores ? { scores: { create: data.scores } } : {}),
          ...(data.pros ? { pros: { create: data.pros.map((text) => ({ text })) } } : {}),
          ...(data.cons ? { cons: { create: data.cons.map((text) => ({ text })) } } : {}),
        },
        include: reviewInclude,
      });
    });
  }

  update(id: string, data: Prisma.ReviewUpdateInput) {
    return this.db.review.update({ where: { id }, data, include: reviewInclude });
  }

  publish(id: string, actorId?: string | null) {
    return this.db.review.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        ...(actorId ? { updatedBy: actorId } : {}),
      },
      include: reviewInclude,
    });
  }

  incrementViewCount(id: string) {
    return this.db.review.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.review, id, actorId);
  }

  async analytics() {
    const [totalReviews, publishedReviews, draftReviews, pendingReviews, topViewed, avgScore] =
      await Promise.all([
        this.db.review.count({ where: { deletedAt: null } }),
        this.db.review.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        this.db.review.count({ where: { deletedAt: null, status: 'DRAFT' } }),
        this.db.review.count({ where: { deletedAt: null, status: 'REVIEW' } }),
        this.db.review.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          orderBy: { viewCount: 'desc' },
          take: 10,
          select: { id: true, title: true, slug: true, viewCount: true, overallScore: true },
        }),
        this.db.review.aggregate({
          where: { deletedAt: null, status: 'PUBLISHED', overallScore: { not: null } },
          _avg: { overallScore: true },
        }),
      ]);

    const userReviewStats = await this.db.userReview.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    return {
      totalReviews,
      publishedReviews,
      draftReviews,
      pendingReviews,
      averageExpertScore: avgScore._avg.overallScore,
      topViewed,
      userReviewsByStatus: userReviewStats,
    };
  }
}

export class UserReviewRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.userReview.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        helpfulVotes: true,
      },
    });
  }

  findByUserAndEntity(userId: string, entityType: string, entityId: string) {
    return this.db.userReview.findFirst({
      where: { userId, entityType, entityId, deletedAt: null },
    });
  }

  listByEntity(
    entityType: string,
    entityId: string,
    params: CursorPageParams & { status?: PublishStatus } = {},
  ) {
    return listActiveWithCursor(this.db.userReview, {
      ...params,
      where: {
        entityType,
        entityId,
        ...(params.status ? { status: params.status } : { status: 'PUBLISHED' }),
      },
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        _count: { select: { helpfulVotes: true } },
      },
    });
  }

  listModeration(params: CursorPageParams & { status?: PublishStatus } = {}) {
    return listActiveWithCursor(this.db.userReview, {
      ...params,
      where: {
        status: params.status ?? 'REVIEW',
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  create(data: Prisma.UserReviewCreateInput) {
    return this.db.userReview.create({
      data,
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    });
  }

  update(id: string, data: Prisma.UserReviewUpdateInput) {
    return this.db.userReview.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    });
  }

  softDelete(id: string) {
    return this.db.userReview.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async entityRatingSummary(entityType: string, entityId: string) {
    const agg = await this.db.userReview.aggregate({
      where: { entityType, entityId, deletedAt: null, status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const distribution = await this.db.userReview.groupBy({
      by: ['rating'],
      where: { entityType, entityId, deletedAt: null, status: 'PUBLISHED' },
      _count: { _all: true },
    });

    return {
      averageRating: agg._avg.rating,
      totalRatings: agg._count._all,
      distribution,
    };
  }

  async voteHelpful(userReviewId: string, userId: string, vote: number) {
    return this.db.reviewHelpfulness.upsert({
      where: { userReviewId_userId: { userReviewId, userId } },
      create: { userReviewId, userId, vote },
      update: { vote },
    });
  }
}
