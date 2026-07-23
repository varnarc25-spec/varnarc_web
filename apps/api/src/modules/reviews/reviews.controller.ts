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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createProductSchema,
  createReviewSchema,
  createUserReviewSchema,
  cursorPaginationQuerySchema,
  moderationActionSchema,
  reviewHelpfulnessSchema,
  reviewsListQuerySchema,
  updateReviewSchema,
  updateUserReviewSchema,
  type CreateProductInput,
  type CreateReviewInput,
  type CreateUserReviewInput,
  type CursorPaginationQuery,
  type ModerationActionInput,
  type ReviewsListQuery,
  type UpdateReviewInput,
  type UpdateUserReviewInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List review products' })
  async products(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listProducts(query));
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published reviews' })
  async list(@Query(new ZodValidationPipe(reviewsListQuerySchema)) query: ReviewsListQuery) {
    return okCursor(await this.service.listReviews(query, true));
  }

  @Get('admin')
  @RequirePermissions(PERMISSIONS.REVIEW_VIEW)
  @ApiOperation({ summary: 'Admin list of reviews' })
  async adminList(@Query(new ZodValidationPipe(reviewsListQuerySchema)) query: ReviewsListQuery) {
    return okCursor(await this.service.listReviews({ ...query, status: query.status }, false));
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.REVIEW_VIEW)
  @ApiOperation({ summary: 'Review analytics dashboard' })
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Get('moderation')
  @RequirePermissions(PERMISSIONS.REVIEW_MODERATE)
  @ApiOperation({ summary: 'List user reviews pending moderation' })
  async moderation(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listModeration(query));
  }

  @Put('moderation/:id')
  @RequirePermissions(PERMISSIONS.REVIEW_MODERATE)
  @ApiOperation({ summary: 'Moderate a user review' })
  async moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(moderationActionSchema)) body: ModerationActionInput,
  ) {
    return ok(await this.service.moderateUserReview(id, body, user.id));
  }

  @Public()
  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'User reviews and rating summary for an entity' })
  async entityReviews(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    const [reviewsPage, summary] = await Promise.all([
      this.service.listEntityUserReviews(entityType, entityId, query),
      this.service.entityRatingSummary(entityType, entityId),
    ]);
    return ok({
      summary,
      reviews: reviewsPage.items,
      pageInfo: {
        nextCursor: reviewsPage.nextCursor,
        prevCursor: reviewsPage.prevCursor,
        hasMore: reviewsPage.hasMore,
        limit: reviewsPage.limit,
      },
    });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get published review by slug' })
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getReviewBySlug(slug, true));
  }

  @Get('admin/:id')
  @RequirePermissions(PERMISSIONS.REVIEW_VIEW)
  @ApiOperation({ summary: 'Get review by id (admin)' })
  async adminById(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getReviewById(id, false));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get published review by id' })
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getReviewById(id, true));
  }

  @Post('products')
  @RequirePermissions(PERMISSIONS.REVIEW_CREATE)
  @ApiOperation({ summary: 'Create review product' })
  async createProduct(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput,
  ) {
    return ok(await this.service.createProduct(body, user.id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.REVIEW_CREATE)
  @ApiOperation({ summary: 'Create editorial review' })
  async createReview(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput,
  ) {
    return ok(await this.service.createReview(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.REVIEW_EDIT)
  @ApiOperation({ summary: 'Update editorial review' })
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateReviewSchema)) body: UpdateReviewInput,
  ) {
    return ok(await this.service.updateReview(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.REVIEW_DELETE)
  @ApiOperation({ summary: 'Delete editorial review' })
  async deleteReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteReview(id, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.REVIEW_PUBLISH)
  @ApiOperation({ summary: 'Publish editorial review' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishReview(id, user.id));
  }

  @Public()
  @Post(':id/view')
  @ApiOperation({ summary: 'Track review view' })
  async trackView(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.trackView(id));
  }

  @Post('user')
  @ApiOperation({ summary: 'Submit authenticated user review' })
  async createUserReview(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createUserReviewSchema)) body: CreateUserReviewInput,
  ) {
    return ok(await this.service.createUserReview(body, user.id));
  }

  @Put('user/:id')
  @ApiOperation({ summary: 'Update own user review' })
  async updateUserReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateUserReviewSchema)) body: UpdateUserReviewInput,
  ) {
    return ok(await this.service.updateUserReview(id, body, user.id));
  }

  @Delete('user/:id')
  @ApiOperation({ summary: 'Delete own user review' })
  async deleteUserReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteUserReview(id, user.id));
  }

  @Post('user/:id/helpful')
  @ApiOperation({ summary: 'Vote user review helpfulness' })
  async voteHelpful(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(reviewHelpfulnessSchema)) body: { vote: 1 | -1 },
  ) {
    return ok(await this.service.voteHelpful(id, user.id, body.vote));
  }
}
