import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  createPlanSchema,
  premiumSubscriptionListQuerySchema,
  subscribePlanSchema,
  updatePlanSchema,
  type CreatePlanInput,
  type PremiumSubscriptionListQuery,
  type SubscribePlanInput,
  type UpdatePlanInput,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { PremiumService } from './premium.service';

@ApiTags('premium')
@Controller('premium')
export class PremiumController {
  constructor(private readonly service: PremiumService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Premium module status' })
  async status() {
    return ok(await this.service.status());
  }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List active premium plans' })
  async plans() {
    return ok(await this.service.listPlans());
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user premium subscription' })
  async me(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.getMySubscription(user.id));
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a premium plan' })
  async subscribe(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(subscribePlanSchema)) body: SubscribePlanInput,
  ) {
    return ok(await this.service.subscribe(user.id, body));
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current premium subscription' })
  async cancel(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.cancel(user.id));
  }

  @Get('admin/overview')
  @RequirePermissions(PERMISSIONS.PREMIUM_VIEW)
  @ApiOperation({ summary: 'Premium billing overview (admin)' })
  async adminOverview() {
    return ok(await this.service.adminOverview());
  }

  @Get('admin/plans')
  @RequirePermissions(PERMISSIONS.PREMIUM_VIEW)
  @ApiOperation({ summary: 'List all plans (admin)' })
  async adminPlans() {
    const page = await this.service.adminListPlans();
    return ok(page.items.map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly != null ? Number(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly != null ? Number(plan.priceYearly) : null,
      features: plan.features,
      isActive: plan.isActive,
    })));
  }

  @Post('admin/plans')
  @RequirePermissions(PERMISSIONS.PREMIUM_MANAGE)
  @ApiOperation({ summary: 'Create plan (admin)' })
  async adminCreatePlan(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createPlanSchema)) body: CreatePlanInput,
  ) {
    return ok(await this.service.adminCreatePlan(body, user.id));
  }

  @Put('admin/plans/:id')
  @RequirePermissions(PERMISSIONS.PREMIUM_MANAGE)
  @ApiOperation({ summary: 'Update plan (admin)' })
  async adminUpdatePlan(
    @Param('id') id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updatePlanSchema)) body: UpdatePlanInput,
  ) {
    return ok(await this.service.adminUpdatePlan(id, body, user.id));
  }

  @Delete('admin/plans/:id')
  @RequirePermissions(PERMISSIONS.PREMIUM_MANAGE)
  @ApiOperation({ summary: 'Delete plan (admin)' })
  async adminDeletePlan(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.adminDeletePlan(id, user.id));
  }

  @Get('admin/subscriptions')
  @RequirePermissions(PERMISSIONS.PREMIUM_VIEW)
  @ApiOperation({ summary: 'List paid subscriptions (admin)' })
  async adminSubscriptions(
    @Query(new ZodValidationPipe(premiumSubscriptionListQuerySchema)) query: PremiumSubscriptionListQuery,
  ) {
    const page = await this.service.adminListSubscriptions(query);
    return okCursor({
      ...page,
      items: page.items.map((row) => ({
        id: row.id,
        status: row.status,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        canceledAt: row.canceledAt?.toISOString() ?? null,
        user: row.user,
        plan: row.plan
          ? {
              id: row.plan.id,
              slug: row.plan.slug,
              name: row.plan.name,
            }
          : null,
      })),
    });
  }
}
