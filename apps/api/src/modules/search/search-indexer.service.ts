import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories, SearchIndexUpsertInput } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import { SEARCH_ENGINE_ADAPTER, type SearchEngineAdapter } from './search-engine.adapter';

type EntityType =
  | 'ARTICLE'
  | 'PAGE'
  | 'AI_TOOL'
  | 'VENDOR'
  | 'BUSINESS'
  | 'CALCULATOR'
  | 'FORMULA_PAGE';

/**
 * Incremental indexer — call from content modules on publish/update/delete.
 */
@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(SEARCH_ENGINE_ADAPTER) private readonly engine: SearchEngineAdapter,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async upsert(doc: SearchIndexUpsertInput) {
    try {
      await this.engine.upsert(doc);
    } catch (err) {
      this.logger.warn(`Search upsert failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async remove(entityType: EntityType, entityId: string) {
    try {
      await this.engine.remove(entityType, entityId);
    } catch (err) {
      this.logger.warn(`Search remove failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async indexArticle(id: string) {
    const article = await this.repos.articles.findById(id);
    if (!article || (article as { deletedAt?: Date | null }).deletedAt) {
      await this.remove('ARTICLE', id);
      return;
    }
    const a = article as {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      body?: string | null;
      status: string;
      seoTitle?: string | null;
      seoDescription?: string | null;
      publishedAt?: Date | null;
      viewCount?: number;
      category?: { name?: string } | null;
      author?: { displayName?: string | null; email?: string | null } | null;
      tags?: Array<{ tag?: { name?: string } | null }>;
    };
    if (a.status !== 'PUBLISHED') {
      await this.remove('ARTICLE', id);
      return;
    }
    const tagNames = (a.tags ?? [])
      .map((t) => t.tag?.name)
      .filter(Boolean)
      .join(' ');
    await this.upsert({
      entityType: 'ARTICLE',
      entityId: a.id,
      title: a.title,
      summary: a.excerpt ?? null,
      content: typeof a.body === 'string' ? a.body.slice(0, 8000) : null,
      keywords: tagNames || null,
      tags: tagNames || null,
      slug: a.slug,
      url: `/articles/${a.slug}`,
      category: a.category?.name || 'Articles',
      author: a.author?.displayName || a.author?.email || null,
      seoTitle: a.seoTitle ?? null,
      seoDescription: a.seoDescription ?? null,
      status: 'PUBLISHED',
      publishedAt: a.publishedAt ?? null,
      viewCount: a.viewCount ?? 0,
    });
  }

  async indexPage(id: string) {
    const page = (await this.repos.pages.findById(id)) as {
      id: string;
      title: string;
      slug: string;
      status: string;
      seoTitle?: string | null;
      seoDescription?: string | null;
      publishedAt?: Date | null;
      deletedAt?: Date | null;
    } | null;
    if (!page || page.deletedAt || page.status !== 'PUBLISHED') {
      await this.remove('PAGE', id);
      return;
    }
    await this.upsert({
      entityType: 'PAGE',
      entityId: page.id,
      title: page.title,
      slug: page.slug,
      url: `/p/${page.slug}`,
      category: 'Pages',
      seoTitle: page.seoTitle ?? null,
      seoDescription: page.seoDescription ?? null,
      status: 'PUBLISHED',
      publishedAt: page.publishedAt ?? null,
    });
  }

  async indexAiTool(id: string) {
    const tool = (await this.repos.aiTools.findById(id)) as {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      shortDescription?: string | null;
      status: string;
      featured?: boolean;
      sponsored?: boolean;
      publishedAt?: Date | null;
      deletedAt?: Date | null;
      category?: { name?: string } | null;
      company?: {
        id: string;
        name: string;
        slug: string;
        description?: string | null;
      } | null;
    } | null;
    if (!tool || tool.deletedAt || tool.status !== 'PUBLISHED') {
      await this.remove('AI_TOOL', id);
      return;
    }
    await this.upsert({
      entityType: 'AI_TOOL',
      entityId: tool.id,
      title: tool.name,
      summary: tool.shortDescription || tool.description,
      slug: tool.slug,
      url: `/ai-tools/${tool.slug}`,
      category: tool.category?.name || 'AI Tools',
      featured: tool.featured,
      sponsored: tool.sponsored,
      status: 'PUBLISHED',
      publishedAt: tool.publishedAt ?? null,
    });
    if (tool.company) {
      await this.upsert({
        entityType: 'VENDOR',
        entityId: tool.company.id,
        title: tool.company.name,
        summary: tool.company.description ?? null,
        slug: tool.company.slug,
        url: `/directory/${tool.company.slug}`,
        category: 'Vendors',
        status: 'PUBLISHED',
      });
    }
  }

  async indexBusiness(id: string) {
    const b = (await this.repos.businesses.findById(id)) as {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      status: string;
      featured?: boolean;
      sponsored?: boolean;
      verificationStatus?: string;
      publishedAt?: Date | null;
      deletedAt?: Date | null;
      locations?: Array<{ city?: string | null; state?: string | null; country?: string | null }>;
    } | null;
    if (!b || b.deletedAt || b.status !== 'APPROVED') {
      await this.remove('BUSINESS', id);
      return;
    }
    const loc = b.locations?.[0];
    const location = loc
      ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
      : null;
    await this.upsert({
      entityType: 'BUSINESS',
      entityId: b.id,
      title: b.name,
      summary: b.description,
      slug: b.slug,
      url: `/directory/${b.slug}`,
      category: 'Directory',
      location,
      verified: b.verificationStatus === 'VERIFIED',
      featured: b.featured,
      sponsored: b.sponsored,
      status: 'PUBLISHED',
      publishedAt: b.publishedAt ?? null,
    });
  }

  async indexCalculator(id: string) {
    const c = (await this.repos.calculators.findById(id)) as {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      formula?: string | null;
      status: string;
      seoTitle?: string | null;
      seoDescription?: string | null;
      publishedAt?: Date | null;
      deletedAt?: Date | null;
    } | null;
    if (!c || c.deletedAt || c.status !== 'PUBLISHED') {
      await this.remove('CALCULATOR', id);
      await this.remove('FORMULA_PAGE', id);
      return;
    }
    await this.upsert({
      entityType: 'CALCULATOR',
      entityId: c.id,
      title: c.name,
      summary: c.description,
      slug: c.slug,
      url: `/calculators/${c.slug}`,
      category: 'Calculators',
      seoTitle: c.seoTitle ?? null,
      seoDescription: c.seoDescription ?? null,
      status: 'PUBLISHED',
      publishedAt: c.publishedAt ?? null,
    });
    if (c.formula) {
      await this.upsert({
        entityType: 'FORMULA_PAGE',
        entityId: c.id,
        title: `${c.name} formula`,
        summary: c.formula,
        slug: c.slug,
        url: `/calculators/${c.slug}`,
        category: 'Formulas',
        status: 'PUBLISHED',
      });
    } else {
      await this.remove('FORMULA_PAGE', id);
    }
  }
}
