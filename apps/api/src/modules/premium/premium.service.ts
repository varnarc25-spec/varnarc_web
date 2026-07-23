import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  BillingCycle,
  CreatePlanInput,
  PremiumSubscriptionListQuery,
  SubscribePlanInput,
  UpdatePlanInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

const PREMIUM_FLAG = 'premium.enabled';

@Injectable()
export class PremiumService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  private async requireEnabled() {
    const flag = await this.repos.featureFlags.findByKey(PREMIUM_FLAG);
    if (!flag?.enabled) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'PREMIUM_DISABLED', message: 'Premium billing is not enabled.' },
      });
    }
  }

  async isEnabled() {
    const flag = await this.repos.featureFlags.findByKey(PREMIUM_FLAG);
    return Boolean(flag?.enabled);
  }

  async status() {
    const enabled = await this.isEnabled();
    const plans = enabled ? await this.repos.plans.listActive({ limit: 20 }) : { items: [] };
    const activeSubs = await this.repos.subscriptions.listAll({ status: 'ACTIVE', limit: 1 });

    return {
      module: 'premium',
      enabled,
      provider: process.env.PREMIUM_BILLING_PROVIDER ?? 'stub',
      planCount: plans.items.length,
      activeSubscriptions: activeSubs.items.length,
    };
  }

  async listPlans() {
    await this.requireEnabled();
    const page = await this.repos.plans.listActive({ limit: 20 });
    return page.items.map((plan) => this.serializePlan(plan));
  }

  async getMySubscription(userId: string) {
    await this.requireEnabled();
    const row = await this.repos.subscriptions.findActiveForUser(userId);
    if (!row) {
      return { subscription: null, isPremium: false };
    }

    return {
      subscription: this.serializeSubscription(row),
      isPremium: row.plan.slug !== 'free',
    };
  }

  async subscribe(userId: string, input: SubscribePlanInput) {
    await this.requireEnabled();

    const plan = await this.repos.plans.findById(input.planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found or inactive.' },
      });
    }

    const existing = await this.repos.subscriptions.findActiveForUser(userId);
    if (existing?.planId === plan.id) {
      throw new BadRequestException({
        success: false,
        error: { code: 'ALREADY_SUBSCRIBED', message: 'You are already on this plan.' },
      });
    }

    await this.repos.subscriptions.cancelActiveForUser(userId);

    const amount = this.resolveAmount(plan, input.billingCycle);
    const endsAt = this.resolveEndsAt(input.billingCycle);
    const isFree = amount <= 0;

    const subscription = await this.repos.subscriptions.create({
      user: { connect: { id: userId } },
      plan: { connect: { id: plan.id } },
      status: isFree ? 'ACTIVE' : 'ACTIVE',
      startsAt: new Date(),
      endsAt,
    });

    let invoice = null;
    let payment = null;

    if (!isFree) {
      const number = await this.repos.invoices.nextNumber();
      invoice = await this.repos.invoices.create({
        number,
        amount,
        currency: 'INR',
        status: 'SUCCEEDED',
        paidAt: new Date(),
        subscription: { connect: { id: subscription.id } },
      });

      payment = await this.repos.payments.create({
        amount,
        currency: 'INR',
        status: 'SUCCEEDED',
        provider: process.env.PREMIUM_BILLING_PROVIDER ?? 'stub',
        providerRef: `stub_${subscription.id}`,
        paidAt: new Date(),
        invoice: { connect: { id: invoice.id } },
      });
    }

    await this.repos.auditLogs
      .create({
        action: 'premium.subscribe',
        entity: 'subscription',
        entityId: subscription.id,
        userId,
        newValue: { planId: plan.id, billingCycle: input.billingCycle, amount } as never,
      })
      .catch(() => undefined);

    const full = await this.repos.subscriptions.findById(subscription.id);

    return {
      subscription: full ? this.serializeSubscription(full) : null,
      invoice,
      payment,
      billingCycle: input.billingCycle,
    };
  }

  async cancel(userId: string) {
    await this.requireEnabled();
    const active = await this.repos.subscriptions.findActiveForUser(userId);
    if (!active) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription to cancel.' },
      });
    }

    const row = await this.repos.subscriptions.update(active.id, {
      status: 'CANCELED',
      canceledAt: new Date(),
    });

    await this.repos.auditLogs
      .create({
        action: 'premium.cancel',
        entity: 'subscription',
        entityId: active.id,
        userId,
      })
      .catch(() => undefined);

    return { subscription: this.serializeSubscription({ ...row, plan: active.plan }) };
  }

  async adminOverview() {
    const [plans, active, canceled] = await Promise.all([
      this.repos.plans.listAll({ limit: 100 }),
      this.repos.subscriptions.listAll({ status: 'ACTIVE', limit: 100 }),
      this.repos.subscriptions.listAll({ status: 'CANCELED', limit: 100 }),
    ]);

    return {
      enabled: await this.isEnabled(),
      counts: {
        plans: plans.items.length,
        activeSubscriptions: active.items.length,
        canceledSubscriptions: canceled.items.length,
      },
    };
  }

  adminListPlans() {
    return this.repos.plans.listAll({ limit: 100 });
  }

  async adminCreatePlan(input: CreatePlanInput, actorId: string) {
    const existing = await this.repos.plans.findBySlug(input.slug);
    if (existing) {
      throw new BadRequestException({
        success: false,
        error: { code: 'SLUG_TAKEN', message: 'Plan slug already exists.' },
      });
    }

    const row = await this.repos.plans.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      priceMonthly: input.priceMonthly ?? null,
      priceYearly: input.priceYearly ?? null,
      features: input.features ?? undefined,
      isActive: input.isActive,
      createdBy: actorId,
    });

    return this.serializePlan(row);
  }

  async adminUpdatePlan(id: string, input: UpdatePlanInput, actorId: string) {
    const existing = await this.repos.plans.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Plan not found.' },
      });
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await this.repos.plans.findBySlug(input.slug);
      if (slugTaken) {
        throw new BadRequestException({
          success: false,
          error: { code: 'SLUG_TAKEN', message: 'Plan slug already exists.' },
        });
      }
    }

    const row = await this.repos.plans.update(id, {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priceMonthly !== undefined ? { priceMonthly: input.priceMonthly } : {}),
      ...(input.priceYearly !== undefined ? { priceYearly: input.priceYearly } : {}),
      ...(input.features !== undefined ? { features: input.features ?? undefined } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedBy: actorId,
    });

    return this.serializePlan(row);
  }

  async adminDeletePlan(id: string, actorId: string) {
    const existing = await this.repos.plans.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Plan not found.' },
      });
    }

    await this.repos.plans.softDelete(id, actorId);
    return { deleted: true };
  }

  adminListSubscriptions(query: PremiumSubscriptionListQuery) {
    return this.repos.subscriptions.listAll({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status,
      userId: query.userId,
    });
  }

  private resolveAmount(
    plan: { priceMonthly: unknown; priceYearly: unknown },
    billingCycle: BillingCycle,
  ) {
    const monthly = plan.priceMonthly != null ? Number(plan.priceMonthly) : 0;
    const yearly = plan.priceYearly != null ? Number(plan.priceYearly) : monthly * 10;
    return billingCycle === 'yearly' ? yearly : monthly;
  }

  private resolveEndsAt(billingCycle: BillingCycle) {
    const endsAt = new Date();
    if (billingCycle === 'yearly') {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }
    return endsAt;
  }

  private serializePlan(plan: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    priceMonthly: unknown;
    priceYearly: unknown;
    features: unknown;
    isActive: boolean;
  }) {
    return {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly != null ? Number(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly != null ? Number(plan.priceYearly) : null,
      features: plan.features,
      isActive: plan.isActive,
    };
  }

  private serializeSubscription(row: {
    id: string;
    status: string;
    startsAt: Date;
    endsAt: Date | null;
    canceledAt: Date | null;
    plan: {
      id: string;
      slug: string;
      name: string;
      priceMonthly: unknown;
      priceYearly: unknown;
    };
  }) {
    return {
      id: row.id,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      canceledAt: row.canceledAt?.toISOString() ?? null,
      plan: {
        id: row.plan.id,
        slug: row.plan.slug,
        name: row.plan.name,
        priceMonthly: row.plan.priceMonthly != null ? Number(row.plan.priceMonthly) : null,
        priceYearly: row.plan.priceYearly != null ? Number(row.plan.priceYearly) : null,
      },
    };
  }
}
