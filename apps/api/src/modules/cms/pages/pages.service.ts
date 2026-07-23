import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreatePageInput,
  CursorPaginationQuery,
  ScheduleContentInput,
  UpdatePageInput,
} from '@varnarc/validation';
import { REPOS } from '../../../database/database.module';
import {
  CACHE_MANAGER,
  cmsCacheKeys,
  invalidateCmsCache,
  type Cache,
} from '../cms-cache';
import { SearchIndexerService } from '../../search/search-indexer.service';

@Injectable()
export class PagesService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  list(query: CursorPaginationQuery & { status?: string }) {
    return this.repos.pages.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      status: query.status as never,
    });
  }

  async getById(id: string) {
    const row = await this.repos.pages.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    const seo = await this.repos.seo.findByEntity('page', id);
    return { ...row, seo };
  }

  async getPublishedBySlug(slug: string) {
    const cacheKey = cmsCacheKeys.pageSlug(slug);
    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const row = await this.repos.pages.findBySlug(slug);
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    const seo = await this.repos.seo.findByEntity('page', row.id);
    const payload = { ...row, seo };
    await this.cache.set(cacheKey, payload, 60_000);
    return payload;
  }

  private async bust(slug?: string | null) {
    if (slug) await invalidateCmsCache(this.cache, [cmsCacheKeys.pageSlug(slug)]);
  }

  private async audit(
    actorId: string,
    action: string,
    entityId: string,
    oldValue?: object,
    newValue?: object,
  ) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'page',
      entityId,
      oldValue: oldValue as never,
      newValue: newValue as never,
    });
  }

  async create(input: CreatePageInput, actorId: string) {
    const { seo, ...rest } = input;
    const page = await this.repos.pages.create({
      title: rest.title,
      slug: rest.slug,
      content: rest.content ?? null,
      status: rest.status,
      publishedAt: rest.publishedAt ?? undefined,
      metadata: rest.metadata as never,
      createdBy: actorId,
      updatedBy: actorId,
    });

    if (seo) {
      await this.repos.seo.upsert('page', page.id, {
        title: seo.title ?? undefined,
        description: seo.description ?? undefined,
        canonicalUrl: seo.canonicalUrl || undefined,
        ogImage: seo.ogImage || undefined,
        robots: seo.robots ?? undefined,
        structuredData: seo.structuredData as never,
      });
    }

    await this.audit(actorId, 'page.create', page.id, undefined, {
      title: page.title,
      slug: page.slug,
      status: page.status,
    });
    await this.bust(page.slug);

    return this.getById(page.id);
  }

  async update(id: string, input: UpdatePageInput, actorId: string) {
    const existing = await this.getById(id);
    const { seo, ...rest } = input;
    await this.repos.pages.update(id, {
      ...rest,
      metadata: rest.metadata as never,
      updatedBy: actorId,
    });

    if (seo) {
      await this.repos.seo.upsert('page', id, {
        title: seo.title ?? undefined,
        description: seo.description ?? undefined,
        canonicalUrl: seo.canonicalUrl || undefined,
        ogImage: seo.ogImage || undefined,
        robots: seo.robots ?? undefined,
        structuredData: seo.structuredData as never,
      });
    }

    const updated = await this.getById(id);
    await this.audit(actorId, 'page.update', id, { status: existing.status }, {
      status: updated.status,
      title: updated.title,
    });
    await this.bust(existing.slug);
    await this.bust(updated.slug);
    return updated;
  }

  async publish(id: string, actorId: string) {
    const existing = await this.getById(id);
    const row = await this.repos.pages.publish(id, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.publish', id, { status: existing.status }, {
      status: 'PUBLISHED',
    });
    await this.bust(existing.slug);
    void this.searchIndexer.indexPage(id);
    return this.getById(id);
  }

  async schedule(id: string, input: ScheduleContentInput, actorId: string) {
    const existing = await this.getById(id);
    const row = await this.repos.pages.schedule(id, input.publishedAt, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.schedule', id, { status: existing.status }, {
      status: 'SCHEDULED',
      publishedAt: input.publishedAt.toISOString(),
    });
    await this.bust(existing.slug);
    return this.getById(id);
  }

  async submitReview(id: string, actorId: string) {
    const existing = await this.getById(id);
    const row = await this.repos.pages.submitReview(id, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.submit_review', id, { status: existing.status }, {
      status: 'REVIEW',
    });
    return this.getById(id);
  }

  async versions(id: string) {
    await this.getById(id);
    return this.repos.pages.listVersions(id);
  }

  async getVersion(pageId: string, versionId: string) {
    await this.getById(pageId);
    const version = await this.repos.pages.findVersion(pageId, versionId);
    if (!version) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page version not found.' },
      });
    }
    return version;
  }

  async restoreVersion(pageId: string, versionId: string, actorId: string) {
    await this.getById(pageId);
    const version = await this.repos.pages.findVersion(pageId, versionId);
    if (!version) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page version not found.' },
      });
    }
    const existing = await this.getById(pageId);
    await this.repos.pages.restoreVersion(pageId, versionId, actorId);
    await this.audit(actorId, 'page.version.restore', pageId, undefined, {
      versionId,
      version: version.version,
    });
    await this.bust(existing.slug);
    return this.getById(pageId);
  }

  async approveReview(id: string, actorId: string) {
    const existing = await this.getById(id);
    if (existing.status !== 'REVIEW') {
      throw new BadRequestException('Page is not in review');
    }
    const row = await this.repos.pages.approveReview(id, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.approve_review', id, { status: existing.status }, {
      status: 'DRAFT',
    });
    return this.getById(id);
  }

  async rejectReview(id: string, notes: string | null | undefined, actorId: string) {
    const existing = await this.getById(id);
    if (existing.status !== 'REVIEW') {
      throw new BadRequestException('Page is not in review');
    }
    const row = await this.repos.pages.rejectReview(id, notes, actorId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.reject_review', id, { status: existing.status }, {
      status: 'DRAFT',
      notes: notes ?? null,
    });
    return this.getById(id);
  }

  async duplicate(id: string, actorId: string) {
    const source = await this.repos.pages.findById(id);
    if (!source) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    const seo = await this.repos.seo.findByEntity('page', id);
    const slug = `${source.slug}-copy-${Date.now().toString(36)}`;
    return this.create(
      {
        title: `${source.title} (Copy)`,
        slug,
        content: source.content,
        status: 'DRAFT',
        metadata: source.metadata as never,
        seo: seo
          ? {
              title: seo.title,
              description: seo.description,
              canonicalUrl: seo.canonicalUrl,
              ogImage: seo.ogImage,
              robots: seo.robots,
              structuredData: seo.structuredData,
            }
          : undefined,
      },
      actorId,
    );
  }

  async remove(id: string, actorId: string) {
    const existing = await this.getById(id);
    const ok = await this.repos.pages.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Page not found.' },
      });
    }
    await this.audit(actorId, 'page.delete', id, { slug: existing.slug });
    await this.bust(existing.slug);
    return { deleted: true };
  }
}
