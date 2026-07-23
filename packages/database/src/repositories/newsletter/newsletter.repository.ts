import type { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository, listActiveWithCursor } from '../base.repository';

export type NewsletterSubscriberStatus = 'subscribed' | 'unsubscribed';

export class NewsletterSubscriberRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByEmail(email: string) {
    return this.db.newsletterSubscriber.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  findByEmailIncludingDeleted(email: string) {
    return this.db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  create(data: Prisma.NewsletterSubscriberCreateInput) {
    return this.db.newsletterSubscriber.create({ data });
  }

  update(id: string, data: Prisma.NewsletterSubscriberUpdateInput) {
    return this.db.newsletterSubscriber.update({ where: { id }, data });
  }

  list(params: {
    cursor?: string;
    limit?: number;
    direction?: 'asc' | 'desc';
    status?: NewsletterSubscriberStatus | 'all';
    search?: string;
  }) {
    const status =
      params.status && params.status !== 'all' ? { status: params.status } : {};
    const search = params.search?.trim();
    return listActiveWithCursor(this.db.newsletterSubscriber, {
      cursor: params.cursor,
      limit: params.limit,
      direction: params.direction,
      where: {
        ...status,
        ...(search
          ? {
              email: { contains: search.toLowerCase(), mode: 'insensitive' as const },
            }
          : {}),
      },
    });
  }

  async summary() {
    const [subscribed, unsubscribed, total] = await Promise.all([
      this.db.newsletterSubscriber.count({
        where: { deletedAt: null, status: 'subscribed' },
      }),
      this.db.newsletterSubscriber.count({
        where: { deletedAt: null, status: 'unsubscribed' },
      }),
      this.db.newsletterSubscriber.count({ where: { deletedAt: null } }),
    ]);
    return { subscribed, unsubscribed, total };
  }

  listSubscribedEmails() {
    return this.db.newsletterSubscriber.findMany({
      where: { deletedAt: null, status: 'subscribed' },
      select: { id: true, email: true },
      orderBy: { subscribedAt: 'asc' },
    });
  }
}

export class NewsletterTemplateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.newsletterTemplate.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.db.newsletterTemplate.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: { cursor?: string; limit?: number; direction?: 'asc' | 'desc'; search?: string }) {
    const search = params.search?.trim();
    return listActiveWithCursor(this.db.newsletterTemplate, {
      cursor: params.cursor,
      limit: params.limit,
      direction: params.direction,
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : undefined,
    });
  }

  create(data: Prisma.NewsletterTemplateCreateInput) {
    return this.db.newsletterTemplate.create({ data });
  }

  update(id: string, data: Prisma.NewsletterTemplateUpdateInput) {
    return this.db.newsletterTemplate.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return this.db.newsletterTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId ?? undefined },
    });
  }

  count() {
    return this.db.newsletterTemplate.count({ where: { deletedAt: null } });
  }
}

export class NewsletterCampaignRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.newsletterCampaign.findFirst({
      where: { id, deletedAt: null },
      include: { template: true },
    });
  }

  findBySlug(slug: string) {
    return this.db.newsletterCampaign.findFirst({
      where: { slug, deletedAt: null },
      include: { template: true },
    });
  }

  list(params: { cursor?: string; limit?: number; direction?: 'asc' | 'desc'; status?: string }) {
    const where =
      params.status && params.status !== 'all'
        ? { status: params.status as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' | 'REVIEW' }
        : undefined;
    return listActiveWithCursor(this.db.newsletterCampaign, {
      cursor: params.cursor,
      limit: params.limit,
      direction: params.direction,
      where,
      include: { template: { select: { id: true, name: true, slug: true, subject: true } } },
    });
  }

  create(data: Prisma.NewsletterCampaignCreateInput) {
    return this.db.newsletterCampaign.create({ data, include: { template: true } });
  }

  update(id: string, data: Prisma.NewsletterCampaignUpdateInput) {
    return this.db.newsletterCampaign.update({
      where: { id },
      data,
      include: { template: true },
    });
  }

  markSent(id: string, actorId?: string | null) {
    return this.db.newsletterCampaign.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        sentAt: new Date(),
        updatedBy: actorId ?? undefined,
      },
      include: { template: true },
    });
  }

  schedule(id: string, scheduledAt: Date, actorId?: string | null) {
    return this.db.newsletterCampaign.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt,
        updatedBy: actorId ?? undefined,
      },
      include: { template: true },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return this.db.newsletterCampaign.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId ?? undefined },
    });
  }

  listDueScheduled(now = new Date()) {
    return this.db.newsletterCampaign.findMany({
      where: {
        deletedAt: null,
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: { template: true },
    });
  }

  countByStatus() {
    return this.db.newsletterCampaign.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
  }
}
