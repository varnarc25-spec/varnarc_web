import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

const comparisonInclude = {
  template: true,
  items: { include: { product: true, values: true }, orderBy: { sortOrder: 'asc' as const } },
  attributes: { orderBy: { sortOrder: 'asc' as const }, include: { cellValues: true } },
};

export class ComparisonTemplateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.comparisonTemplate, id);
  }

  list(params: CursorPageParams & { entityType?: string; search?: string } = {}) {
    return listActiveWithCursor(this.db.comparisonTemplate, {
      ...params,
      where: {
        ...(params.entityType ? { entityType: params.entityType } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  create(data: Prisma.ComparisonTemplateCreateInput) {
    return this.db.comparisonTemplate.create({ data });
  }

  update(id: string, data: Prisma.ComparisonTemplateUpdateInput) {
    return this.db.comparisonTemplate.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.comparisonTemplate, id, actorId);
  }
}

export class ComparisonRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.comparison.findFirst({
      where: { id, deletedAt: null },
      include: comparisonInclude,
    });
  }

  findBySlug(slug: string, status?: PublishStatus) {
    return this.db.comparison.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      include: comparisonInclude,
    });
  }

  findByEntity(entityType: string, entityId: string, limit = 5) {
    return this.db.comparison.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        items: { some: { entityType, entityId } },
      },
      take: limit,
      select: { id: true, title: true, slug: true, recommendation: true, entityType: true },
      orderBy: { viewCount: 'desc' },
    });
  }

  list(
    params: CursorPageParams & {
      status?: PublishStatus;
      entityType?: string;
      comparisonType?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.comparison, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.entityType ? { entityType: params.entityType } : {}),
        ...(params.comparisonType ? { comparisonType: params.comparisonType } : {}),
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { items: true } }, template: true },
    });
  }

  create(data: Prisma.ComparisonCreateInput) {
    return this.db.comparison.create({ data, include: comparisonInclude });
  }

  async updateWithNested(
    id: string,
    data: {
      comparison: Prisma.ComparisonUpdateInput;
      items?: Array<{
        productId: string;
        entityType?: string | null;
        entityId?: string | null;
        label?: string | null;
        sortOrder: number;
      }>;
      attributes?: Array<{
        key: string;
        label: string;
        valueType: string;
        groupKey?: string | null;
        values: unknown;
        sortOrder: number;
        highlights?: string[];
      }>;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.items) {
        await tx.comparisonValue.deleteMany({ where: { item: { comparisonId: id } } });
        await tx.comparisonItem.deleteMany({ where: { comparisonId: id } });
      }
      if (data.attributes) {
        await tx.comparisonValue.deleteMany({ where: { attribute: { comparisonId: id } } });
        await tx.comparisonAttribute.deleteMany({ where: { comparisonId: id } });
      }

      const comparison = await tx.comparison.update({
        where: { id },
        data: {
          ...data.comparison,
          ...(data.items
            ? {
                items: {
                  create: data.items.map((item) => ({
                    productId: item.productId,
                    entityType: item.entityType ?? null,
                    entityId: item.entityId ?? null,
                    label: item.label ?? null,
                    sortOrder: item.sortOrder,
                  })),
                },
              }
            : {}),
          ...(data.attributes
            ? {
                attributes: {
                  create: data.attributes.map((attr) => ({
                    key: attr.key,
                    label: attr.label,
                    valueType: attr.valueType,
                    groupKey: attr.groupKey ?? null,
                    values: attr.values as object,
                    sortOrder: attr.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: comparisonInclude,
      });

      if (data.items && data.attributes) {
        const items = await tx.comparisonItem.findMany({ where: { comparisonId: id }, orderBy: { sortOrder: 'asc' } });
        const attrs = await tx.comparisonAttribute.findMany({ where: { comparisonId: id }, orderBy: { sortOrder: 'asc' } });
        for (let ai = 0; ai < attrs.length; ai++) {
          const attr = attrs[ai]!;
          const inputAttr = data.attributes[ai];
          const values = Array.isArray(inputAttr?.values)
            ? inputAttr.values
            : typeof inputAttr?.values === 'object' && inputAttr?.values
              ? Object.values(inputAttr.values as Record<string, unknown>)
              : [];
          for (let ii = 0; ii < items.length; ii++) {
            const item = items[ii]!;
            const highlight = inputAttr?.highlights?.[ii] ?? null;
            await tx.comparisonValue.create({
              data: {
                comparisonItemId: item.id,
                comparisonAttributeId: attr.id,
                value: (values[ii] ?? null) as object,
                highlight,
              },
            });
          }
        }
        return tx.comparison.findFirst({ where: { id }, include: comparisonInclude });
      }

      return comparison;
    });
  }

  update(id: string, data: Prisma.ComparisonUpdateInput) {
    return this.db.comparison.update({ where: { id }, data, include: comparisonInclude });
  }

  publish(id: string, actorId?: string | null) {
    return this.db.comparison.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        ...(actorId ? { updatedBy: actorId } : {}),
      },
      include: comparisonInclude,
    });
  }

  incrementViewCount(id: string) {
    return this.db.comparison.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.comparison, id, actorId);
  }

  async analytics() {
    const [total, published, draft, topViewed, byEntityType] = await Promise.all([
      this.db.comparison.count({ where: { deletedAt: null } }),
      this.db.comparison.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.comparison.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      this.db.comparison.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, title: true, slug: true, viewCount: true, entityType: true },
      }),
      this.db.comparison.groupBy({
        by: ['entityType'],
        where: { deletedAt: null, status: 'PUBLISHED' },
        _count: { _all: true },
      }),
    ]);

    const templateCount = await this.db.comparisonTemplate.count({ where: { deletedAt: null } });

    const affiliateClicks = await this.db.affiliateClick.count({
      where: { entityType: 'comparison' },
    });

    const topAffiliateComparisons = await this.db.affiliateClick.groupBy({
      by: ['entityId'],
      where: { entityType: 'comparison' },
      _count: { _all: true },
      orderBy: { _count: { entityId: 'desc' } },
      take: 10,
    });

    const comparisonIds = topAffiliateComparisons.map((r) => r.entityId);
    const comparisonTitles = comparisonIds.length
      ? await this.db.comparison.findMany({
          where: { id: { in: comparisonIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];

    const titleById = Object.fromEntries(comparisonTitles.map((c) => [c.id, c]));

    return {
      total,
      published,
      draft,
      templateCount,
      topViewed,
      byEntityType,
      affiliateClicks,
      topAffiliateComparisons: topAffiliateComparisons.map((row) => ({
        comparisonId: row.entityId,
        clicks: row._count._all,
        title: titleById[row.entityId]?.title ?? 'Unknown',
        slug: titleById[row.entityId]?.slug ?? null,
      })),
    };
  }

  trackAffiliateClick(input: {
    comparisonId: string;
    affiliateUrl: string;
    userId?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
  }) {
    return this.db.affiliateClick.create({
      data: {
        entityType: 'comparison',
        entityId: input.comparisonId,
        affiliateUrl: input.affiliateUrl,
        userId: input.userId,
        sessionId: input.sessionId,
        referrer: input.referrer,
      },
    });
  }

  async cloneComparison(sourceId: string, actorId: string) {
    const source = await this.findById(sourceId);
    if (!source) return null;

    const slug = `${source.slug}-copy-${Date.now().toString(36)}`;
    const created = await this.db.comparison.create({
      data: {
        title: `${source.title} (Copy)`,
        slug,
        description: source.description,
        comparisonType: source.comparisonType,
        entityType: source.entityType,
        recommendation: source.recommendation,
        winnerEntityType: source.winnerEntityType,
        winnerEntityId: source.winnerEntityId,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        status: 'DRAFT',
        templateId: source.templateId,
        createdBy: actorId,
        updatedBy: actorId,
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            entityType: item.entityType,
            entityId: item.entityId,
            label: item.label,
            sortOrder: item.sortOrder,
          })),
        },
        attributes: {
          create: source.attributes.map((attr) => ({
            key: attr.key,
            label: attr.label,
            valueType: attr.valueType,
            groupKey: attr.groupKey,
            values: attr.values as object,
            sortOrder: attr.sortOrder,
          })),
        },
      },
      include: comparisonInclude,
    });

    const items = await this.db.comparisonItem.findMany({
      where: { comparisonId: created.id },
      orderBy: { sortOrder: 'asc' },
    });
    const attrs = await this.db.comparisonAttribute.findMany({
      where: { comparisonId: created.id },
      orderBy: { sortOrder: 'asc' },
    });

    for (let ai = 0; ai < attrs.length; ai++) {
      const sourceAttr = source.attributes[ai]!;
      const values = Array.isArray(sourceAttr.values) ? (sourceAttr.values as unknown[]) : [];
      for (let ii = 0; ii < items.length; ii++) {
        const sourceItem = source.items[ii]!;
        const sourceCell = sourceItem.values?.find(
          (v) => v.comparisonAttributeId === sourceAttr.id,
        );
        await this.db.comparisonValue.create({
          data: {
            comparisonItemId: items[ii]!.id,
            comparisonAttributeId: attrs[ai]!.id,
            value: (values[ii] ?? sourceCell?.value ?? null) as object,
            highlight: sourceCell?.highlight ?? null,
          },
        });
      }
    }

    return this.findById(created.id);
  }

  async bulkPublish(ids: string[], actorId: string) {
    const result = await this.db.comparison.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: 'PUBLISHED', publishedAt: new Date(), updatedBy: actorId },
    });
    return { updated: result.count };
  }

  async bulkDelete(ids: string[], actorId: string) {
    let count = 0;
    for (const id of ids) {
      const ok = await softDeleteById(this.db.comparison, id, actorId);
      if (ok) count += 1;
    }
    return { deleted: count };
  }

  async getRelatedContent(comparisonId: string) {
    const comparison = await this.findById(comparisonId);
    if (!comparison) return null;

    const entityPairs = comparison.items
      .filter((i) => i.entityType && i.entityId)
      .map((i) => ({ entityType: i.entityType!, entityId: i.entityId! }));

    const productIds = comparison.items.map((i) => i.productId);

    const [reviews, articles, calculators, sponsoredAds] = await Promise.all([
      this.db.review.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          OR: [
            ...entityPairs.map((p) => ({ entityType: p.entityType, entityId: p.entityId })),
            { productId: { in: productIds } },
          ],
        },
        take: 8,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, overallScore: true, entityType: true },
      }),
      this.db.article.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          OR: [
            { title: { contains: comparison.comparisonType ?? 'compare', mode: 'insensitive' } },
            { title: { contains: comparison.entityType ?? 'product', mode: 'insensitive' } },
          ],
        },
        take: 6,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, excerpt: true },
      }),
      this.db.calculator.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        take: 6,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, slug: true, description: true },
      }),
      this.db.advertisement.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, targetUrl: true, type: true },
      }),
    ]);

    const affiliateOffers: Array<{
      label: string;
      url: string;
      entityType: string;
      entityId: string;
      sponsored?: boolean;
    }> = [];

    for (const item of comparison.items) {
      if (item.entityType === 'vehicle' && item.entityId) {
        const vehicle = await this.db.automobileVehicle.findFirst({
          where: { id: item.entityId, deletedAt: null },
          select: { name: true, affiliateUrl: true, sponsored: true },
        });
        if (vehicle?.affiliateUrl) {
          affiliateOffers.push({
            label: vehicle.name,
            url: vehicle.affiliateUrl,
            entityType: 'vehicle',
            entityId: item.entityId,
            sponsored: vehicle.sponsored,
          });
        }
      }
      if (item.entityType === 'loan_product' && item.entityId) {
        const loan = await this.db.loan.findFirst({
          where: { id: item.entityId, deletedAt: null },
          select: { name: true, affiliateUrl: true },
        });
        if (loan?.affiliateUrl) {
          affiliateOffers.push({
            label: loan.name,
            url: loan.affiliateUrl,
            entityType: 'loan_product',
            entityId: item.entityId,
          });
        }
      }
    }

    const domainComparisons: Array<{ module: string; title: string; slug: string; href: string }> = [];

    if (comparison.entityType === 'vehicle') {
      const auto = await this.db.automobileComparison.findFirst({
        where: { deletedAt: null, status: 'PUBLISHED', slug: { contains: 'swift' } },
        select: { title: true, slug: true },
      });
      if (auto) {
        domainComparisons.push({
          module: 'automobile',
          title: auto.title,
          slug: auto.slug,
          href: `/automobile/comparisons/${auto.slug}`,
        });
      }
    }

    if (comparison.entityType === 'construction_material') {
      const con = await this.db.constructionComparison.findFirst({
        where: { deletedAt: null, status: 'PUBLISHED' },
        select: { title: true, slug: true },
      });
      if (con) {
        domainComparisons.push({
          module: 'construction',
          title: con.title,
          slug: con.slug,
          href: `/construction/compare?saved=${con.slug}`,
        });
      }
    }

    const financeComparisons = await this.db.financeComparison.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      take: 3,
      select: { title: true, slug: true, entityType: true },
    });
    for (const fc of financeComparisons) {
      domainComparisons.push({
        module: 'finance',
        title: fc.title,
        slug: fc.slug,
        href: `/finance/compare?type=${fc.entityType}`,
      });
    }

    return {
      reviews,
      articles,
      calculators,
      affiliateOffers,
      sponsoredAds,
      domainComparisons,
      products: comparison.items.map((i) => ({
        id: i.product.id,
        name: i.label || i.product.name,
        slug: i.product.slug,
      })),
    };
  }
}
