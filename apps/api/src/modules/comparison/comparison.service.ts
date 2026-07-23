import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  ComparisonAffiliateClickInput,
  ComparisonBulkActionInput,
  ComparisonsListQuery,
  CreateComparisonInput,
  CreateComparisonTemplateInput,
  CursorPaginationQuery,
  UpdateComparisonInput,
  UpdateComparisonTemplateInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

const CACHE_TTL = 60_000;

@Injectable()
export class ComparisonService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async audit(actorId: string, action: string, entityId: string, newValue?: object) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'comparison',
      entityId,
      newValue: newValue as never,
    });
  }

  private async bustComparisonCache(slug?: string) {
    await Promise.all([
      this.cache.del('comparisons:analytics'),
      this.cache.del('comparisons:list:published'),
      ...(slug ? [this.cache.del(`comparisons:slug:${slug}`), this.cache.del(`comparisons:related:${slug}`)] : []),
    ]);
  }

  async list(query: ComparisonsListQuery, publishedOnly = true) {
    const cacheKey = publishedOnly ? 'comparisons:list:published' : null;
    if (cacheKey && !query.cursor && !query.search && !query.entityType) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as Awaited<ReturnType<typeof this.repos.comparisons.list>>;
    }

    const page = await this.repos.comparisons.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      entityType: query.entityType,
      comparisonType: query.comparisonType,
      status: query.status ?? (publishedOnly ? 'PUBLISHED' : undefined),
    });

    if (cacheKey && !query.cursor) {
      await this.cache.set(cacheKey, page, CACHE_TTL);
    }
    return page;
  }

  listTemplates(query: CursorPaginationQuery & { entityType?: string }) {
    return this.repos.comparisonTemplates.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      entityType: query.entityType,
    });
  }

  async getById(id: string, publishedOnly = true) {
    const row = await this.repos.comparisons.findById(id);
    if (!row || (publishedOnly && row.status !== 'PUBLISHED')) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
    return row;
  }

  async getBySlug(slug: string, publishedOnly = true) {
    const cacheKey = publishedOnly ? `comparisons:slug:${slug}` : null;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as NonNullable<Awaited<ReturnType<typeof this.repos.comparisons.findBySlug>>>;
    }

    const row = await this.repos.comparisons.findBySlug(slug, publishedOnly ? 'PUBLISHED' : undefined);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }

    if (cacheKey) {
      await this.cache.set(cacheKey, row, CACHE_TTL);
    }
    return row;
  }

  async getRelated(slug: string) {
    const cacheKey = `comparisons:related:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const comparison = await this.getBySlug(slug, true);
    const related = await this.repos.comparisons.getRelatedContent(comparison.id);
    if (related) {
      await this.cache.set(cacheKey, related, CACHE_TTL);
    }
    return related;
  }

  async trackView(id: string) {
    const row = await this.repos.comparisons.findById(id);
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
    await this.repos.comparisons.incrementViewCount(id);
    return { viewCount: row.viewCount + 1 };
  }

  createTemplate(input: CreateComparisonTemplateInput, actorId: string) {
    return this.repos.comparisonTemplates.create({
      name: input.name,
      entityType: input.entityType,
      description: input.description ?? null,
      attributes: input.attributes as object,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async updateTemplate(id: string, input: UpdateComparisonTemplateInput, actorId: string) {
    const existing = await this.repos.comparisonTemplates.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found.' },
      });
    }
    return this.repos.comparisonTemplates.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.entityType !== undefined ? { entityType: input.entityType } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.attributes !== undefined ? { attributes: input.attributes as object } : {}),
      updatedBy: actorId,
    });
  }

  async deleteTemplate(id: string, actorId: string) {
    const existing = await this.repos.comparisonTemplates.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found.' },
      });
    }
    return this.repos.comparisonTemplates.softDelete(id, actorId);
  }

  create(input: CreateComparisonInput, actorId: string) {
    return this.createComparison(input, actorId);
  }

  async createComparison(input: CreateComparisonInput, actorId: string) {
    const created = await this.repos.comparisons.create({
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      comparisonType: input.comparisonType ?? null,
      entityType: input.entityType ?? null,
      recommendation: input.recommendation ?? null,
      winnerEntityType: input.winnerEntityType ?? null,
      winnerEntityId: input.winnerEntityId ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status: input.status,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
      ...(input.templateId ? { template: { connect: { id: input.templateId } } } : {}),
      items: {
        create: input.items.map((item, index) => ({
          productId: item.productId,
          entityType: item.entityType ?? null,
          entityId: item.entityId ?? null,
          label: item.label ?? null,
          sortOrder: item.sortOrder ?? index,
        })),
      },
      attributes: {
        create: input.attributes.map((attr) => ({
          key: attr.key,
          label: attr.label,
          valueType: attr.valueType,
          groupKey: attr.groupKey ?? null,
          values: attr.values as object,
          sortOrder: attr.sortOrder,
        })),
      },
    });

    let result = created;
    if (input.attributes.length && input.items.length) {
      result = (await this.repos.comparisons.updateWithNested(created.id, {
        comparison: {},
        items: input.items.map((item, index) => ({
          productId: item.productId,
          entityType: item.entityType ?? null,
          entityId: item.entityId ?? null,
          label: item.label ?? null,
          sortOrder: item.sortOrder ?? index,
        })),
        attributes: input.attributes.map((attr) => ({
          key: attr.key,
          label: attr.label,
          valueType: attr.valueType,
          groupKey: attr.groupKey ?? null,
          values: attr.values,
          sortOrder: attr.sortOrder,
          highlights: attr.highlights,
        })),
      }))!;
    }

    await this.audit(actorId, 'comparison.create', result.id, { title: result.title, slug: result.slug });
    await this.bustComparisonCache(input.slug);
    return result;
  }

  async update(id: string, input: UpdateComparisonInput, actorId: string) {
    const existing = await this.repos.comparisons.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }

    const result = await this.repos.comparisons.updateWithNested(id, {
      comparison: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.comparisonType !== undefined ? { comparisonType: input.comparisonType } : {}),
        ...(input.entityType !== undefined ? { entityType: input.entityType } : {}),
        ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
        ...(input.winnerEntityType !== undefined ? { winnerEntityType: input.winnerEntityType } : {}),
        ...(input.winnerEntityId !== undefined ? { winnerEntityId: input.winnerEntityId } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.templateId ? { template: { connect: { id: input.templateId } } } : {}),
        updatedBy: actorId,
      },
      ...(input.items
        ? {
            items: input.items.map((item, index) => ({
              productId: item.productId,
              entityType: item.entityType ?? null,
              entityId: item.entityId ?? null,
              label: item.label ?? null,
              sortOrder: item.sortOrder ?? index,
            })),
          }
        : {}),
      ...(input.attributes
        ? {
            attributes: input.attributes.map((attr) => ({
              key: attr.key,
              label: attr.label,
              valueType: attr.valueType,
              groupKey: attr.groupKey ?? null,
              values: attr.values,
              sortOrder: attr.sortOrder,
              highlights: attr.highlights,
            })),
          }
        : {}),
    });

    await this.audit(actorId, 'comparison.update', id, { title: result?.title, slug: result?.slug });
    await this.bustComparisonCache(existing.slug);
    if (input.slug && input.slug !== existing.slug) {
      await this.bustComparisonCache(input.slug);
    }
    return result;
  }

  async publish(id: string, actorId: string) {
    try {
      const existing = await this.repos.comparisons.findById(id);
      const row = await this.repos.comparisons.publish(id, actorId);
      await this.audit(actorId, 'comparison.publish', id, { slug: row.slug });
      await this.bustComparisonCache(existing?.slug);
      return row;
    } catch {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repos.comparisons.findById(id);
    const ok = await this.repos.comparisons.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
    await this.audit(actorId, 'comparison.delete', id);
    await this.bustComparisonCache(existing?.slug);
    return { deleted: true };
  }

  async clone(id: string, actorId: string) {
    const row = await this.repos.comparisons.cloneComparison(id, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
    await this.audit(actorId, 'comparison.clone', row.id, { sourceId: id, slug: row.slug });
    await this.bustComparisonCache();
    return row;
  }

  async bulkPublish(input: ComparisonBulkActionInput, actorId: string) {
    const result = await this.repos.comparisons.bulkPublish(input.ids, actorId);
    for (const id of input.ids) {
      await this.audit(actorId, 'comparison.bulk_publish', id);
    }
    await this.bustComparisonCache();
    return result;
  }

  async bulkDelete(input: ComparisonBulkActionInput, actorId: string) {
    const result = await this.repos.comparisons.bulkDelete(input.ids, actorId);
    for (const id of input.ids) {
      await this.audit(actorId, 'comparison.bulk_delete', id);
    }
    await this.bustComparisonCache();
    return result;
  }

  async trackAffiliateClick(id: string, input: ComparisonAffiliateClickInput, userId?: string | null) {
    const row = await this.repos.comparisons.findById(id);
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comparison not found.' },
      });
    }
    return this.repos.comparisons.trackAffiliateClick({
      comparisonId: id,
      affiliateUrl: input.affiliateUrl,
      userId,
      sessionId: input.sessionId,
      referrer: input.referrer,
    });
  }

  history(id: string) {
    return this.repos.auditLogs.list({ entity: 'comparison', entityId: id, limit: 50, direction: 'desc' });
  }

  async analytics() {
    const cached = await this.cache.get('comparisons:analytics');
    if (cached) return cached;

    const data = await this.repos.comparisons.analytics();
    await this.cache.set('comparisons:analytics', data, CACHE_TTL);
    return data;
  }
}
