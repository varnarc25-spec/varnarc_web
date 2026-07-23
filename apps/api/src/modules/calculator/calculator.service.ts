import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  CalculatorListQuery,
  CloneCalculatorInput,
  CreateCalculatorCategoryInput,
  CreateCalculatorInput,
  CursorPaginationQuery,
  RunCalculatorInput,
  SaveCalculationInput,
  UpdateCalculatorCategoryInput,
  UpdateCalculatorInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { executeFormula, validateFormula } from './formula-engine';
import { SearchIndexerService } from '../search/search-indexer.service';

const SLUG_CACHE_TTL_MS = 60_000;

@Injectable()
export class CalculatorService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  private cacheKey(slug: string) {
    return `calculator:slug:${slug}`;
  }

  private async bustSlugCache(slug?: string | null) {
    if (slug) await this.cache.del(this.cacheKey(slug));
  }

  private notFound(message = 'Calculator not found.') {
    return new NotFoundException({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
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
      entity: 'calculator',
      entityId,
      oldValue: oldValue as never,
      newValue: newValue as never,
    });
  }

  list(query: CalculatorListQuery) {
    return this.repos.calculators.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      status: query.status,
      categoryId: query.categoryId,
    });
  }

  async getById(id: string) {
    const row = await this.repos.calculators.findById(id);
    if (!row) throw this.notFound();
    return row;
  }

  async getBySlug(slug: string, trackView = false, meta?: { sessionId?: string | null; device?: string | null; referrer?: string | null; userId?: string | null }) {
    const key = this.cacheKey(slug);
    let row = trackView ? null : await this.cache.get<Awaited<ReturnType<Repositories['calculators']['findBySlug']>>>(key);
    if (!row) {
      row = await this.repos.calculators.findBySlug(slug);
      if (row && row.status === 'PUBLISHED') {
        await this.cache.set(key, row, SLUG_CACHE_TTL_MS);
      }
    }
    if (!row) throw this.notFound();
    if (trackView) {
      await this.repos.calculators.recordAnalytics({
        eventType: 'view',
        sessionId: meta?.sessionId ?? null,
        device: meta?.device ?? null,
        referrer: meta?.referrer ?? null,
        userId: meta?.userId ?? null,
        calculator: { connect: { id: row.id } },
      });
    }
    return row;
  }

  async create(input: CreateCalculatorInput, actorId: string) {
    if (input.formula) {
      const check = validateFormula(input.formula);
      if (!check.ok) {
        throw new BadRequestException({
          success: false,
          error: { code: 'INVALID_FORMULA', message: check.message },
        });
      }
    }
    if (input.categoryId) {
      const cat = await this.repos.calculatorCategories.findById(input.categoryId);
      if (!cat) throw this.notFound('Category not found.');
    }

    const asset = await this.repos.calculators.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      status: input.status,
      formula: input.formula ?? null,
      resultTemplate: input.resultTemplate as never,
      settings: input.settings as never,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      fields: {
        create: input.fields.map((f) => ({
          key: f.key,
          label: f.label,
          fieldType: f.fieldType,
          defaultValue: f.defaultValue ?? null,
          sortOrder: f.sortOrder,
          required: f.required,
          options: f.options as never,
          validation: f.validation as never,
        })),
      },
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'calculator.create', asset.id, undefined, { slug: asset.slug });
    await this.bustSlugCache(asset.slug);
    return asset;
  }

  async update(id: string, input: UpdateCalculatorInput, actorId: string) {
    const existing = await this.repos.calculators.findById(id);
    if (!existing) throw this.notFound();

    if (input.formula !== undefined && input.formula !== null) {
      const check = validateFormula(input.formula);
      if (!check.ok) {
        throw new BadRequestException({
          success: false,
          error: { code: 'INVALID_FORMULA', message: check.message },
        });
      }
    }

    if (input.fields) {
      await this.repos.calculators.replaceFields(id, input.fields.map((f) => ({
        key: f.key,
        label: f.label,
        fieldType: f.fieldType,
        defaultValue: f.defaultValue ?? null,
        sortOrder: f.sortOrder ?? 0,
        required: f.required ?? true,
        options: f.options,
        validation: f.validation,
      })));
    }

    const row = await this.repos.calculators.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.formula !== undefined ? { formula: input.formula } : {}),
      ...(input.resultTemplate !== undefined ? { resultTemplate: input.resultTemplate as never } : {}),
      ...(input.settings !== undefined ? { settings: input.settings as never } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'calculator.update', id);
    await this.bustSlugCache(existing.slug);
    await this.bustSlugCache(row.slug);
    return row;
  }

  async publish(id: string, actorId: string) {
    const existing = await this.repos.calculators.findById(id);
    if (!existing) throw this.notFound();
    if (!existing.formula) {
      throw new BadRequestException({
        success: false,
        error: { code: 'MISSING_FORMULA', message: 'Cannot publish without a formula.' },
      });
    }
    const check = validateFormula(existing.formula);
    if (!check.ok) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_FORMULA', message: check.message },
      });
    }
    const row = await this.repos.calculators.publish(id, actorId);
    await this.audit(actorId, 'calculator.publish', id);
    await this.bustSlugCache(existing.slug);
    void this.searchIndexer.indexCalculator(id);
    return row;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repos.calculators.findById(id);
    const ok = await this.repos.calculators.softDelete(id, actorId);
    if (!ok) throw this.notFound();
    await this.audit(actorId, 'calculator.delete', id);
    await this.bustSlugCache(existing?.slug);
    void this.searchIndexer.remove('CALCULATOR', id);
    void this.searchIndexer.remove('FORMULA_PAGE', id);
    return { deleted: true };
  }

  async clone(id: string, input: CloneCalculatorInput, actorId: string) {
    const source = await this.repos.calculators.findById(id);
    if (!source) throw this.notFound();
    const slug = input.slug ?? `${source.slug}-copy`;
    const existing = await this.repos.calculators.findBySlug(slug);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'SLUG_EXISTS', message: 'Slug already in use.' },
      });
    }
    return this.create(
      {
        name: input.name ?? `${source.name} (Copy)`,
        slug,
        description: source.description,
        icon: source.icon,
        categoryId: source.categoryId,
        status: 'DRAFT',
        formula: source.formula,
        resultTemplate: source.resultTemplate as never,
        settings: source.settings as never,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        fields: source.fields.map((f) => ({
          key: f.key,
          label: f.label,
          fieldType: f.fieldType,
          defaultValue: f.defaultValue,
          sortOrder: f.sortOrder,
          required: f.required,
          options: f.options as never,
          validation: f.validation as never,
        })),
      },
      actorId,
    );
  }

  async calculate(
    id: string,
    input: RunCalculatorInput,
    userId?: string | null,
  ) {
    const calc = await this.repos.calculators.findById(id);
    if (!calc) throw this.notFound();

    for (const field of calc.fields) {
      if (!field.required) continue;
      const val = input.inputs[field.key];
      if (val === undefined || val === null || val === '') {
        throw new BadRequestException({
          success: false,
          error: { code: 'MISSING_INPUT', message: `Missing required field: ${field.label}` },
        });
      }
    }

    const started = Date.now();
    try {
      const outputs = await executeFormula(calc.formula, input.inputs);
      const durationMs = Date.now() - started;
      await this.repos.calculators.recordHistory({
        inputs: input.inputs as never,
        outputs: outputs as never,
        status: 'SUCCESS',
        durationMs,
        ...(userId ? { userId } : {}),
        calculator: { connect: { id } },
      });
      await this.repos.calculators.recordAnalytics({
        eventType: 'execute',
        sessionId: input.sessionId ?? null,
        device: input.device ?? null,
        referrer: input.referrer ?? null,
        durationMs,
        ...(userId ? { userId } : {}),
        calculator: { connect: { id } },
      });

      const relatedPage = calc.categoryId
        ? await this.repos.calculators.list({
            categoryId: calc.categoryId,
            status: 'PUBLISHED',
            limit: 6,
            direction: 'desc',
          })
        : { items: [] as Array<{ id: string; name: string; slug: string }> };
      const related = relatedPage.items
        .filter((c) => c.id !== id)
        .slice(0, 4)
        .map((c) => {
          const row = c as unknown as { id: string; name: string; slug: string };
          return { id: row.id, name: row.name, slug: row.slug };
        });

      return {
        calculatorId: id,
        inputs: input.inputs,
        outputs,
        resultTemplate: calc.resultTemplate,
        recommendations: related,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - started;
      await this.repos.calculators.recordHistory({
        inputs: input.inputs as never,
        outputs: undefined,
        status: 'FAILED',
        durationMs,
        ...(userId ? { userId } : {}),
        calculator: { connect: { id } },
      });
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CALCULATION_FAILED',
          message: err instanceof Error ? err.message : 'Calculation failed',
        },
      });
    }
  }

  listCategories() {
    return this.repos.calculatorCategories.list();
  }

  async createCategory(input: CreateCalculatorCategoryInput, actorId: string) {
    const existing = await this.repos.calculatorCategories.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'SLUG_EXISTS', message: 'Category slug already exists.' },
      });
    }
    const row = await this.repos.calculatorCategories.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder,
    });
    await this.audit(actorId, 'calculator.category.create', row.id);
    return row;
  }

  async updateCategory(id: string, input: UpdateCalculatorCategoryInput, actorId: string) {
    const existing = await this.repos.calculatorCategories.findById(id);
    if (!existing) throw this.notFound('Category not found.');
    const row = await this.repos.calculatorCategories.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    });
    await this.audit(actorId, 'calculator.category.update', id);
    return row;
  }

  async removeCategory(id: string, actorId: string) {
    const ok = await this.repos.calculatorCategories.softDelete(id);
    if (!ok) throw this.notFound('Category not found.');
    await this.audit(actorId, 'calculator.category.delete', id);
    return { deleted: true };
  }

  saveResult(input: SaveCalculationInput, userId: string) {
    return this.repos.savedCalculations.create({
      name: input.name,
      inputs: input.inputs as never,
      outputs: (input.outputs ?? undefined) as never,
      calculator: { connect: { id: input.calculatorId } },
      user: { connect: { id: userId } },
    });
  }

  listSaved(userId: string, query: CursorPaginationQuery) {
    return this.repos.savedCalculations.listByUser(userId, {
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  async deleteSaved(id: string, userId: string) {
    const row = await this.repos.savedCalculations.findByIdForUser(id, userId);
    if (!row) throw this.notFound('Saved calculation not found.');
    await this.repos.savedCalculations.softDelete(id, userId);
    return { deleted: true };
  }

  analytics() {
    return this.repos.calculators.analyticsSummary();
  }

  async related(id: string) {
    const calc = await this.repos.calculators.findById(id);
    if (!calc) throw this.notFound();
    const page = await this.repos.calculators.list({
      categoryId: calc.categoryId ?? undefined,
      status: 'PUBLISHED',
      limit: 8,
      direction: 'desc',
    });
    return page.items
      .filter((c) => c.id !== id)
      .slice(0, 6)
      .map((c) => {
        const row = c as unknown as {
          id: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        return { id: row.id, name: row.name, slug: row.slug, description: row.description ?? null };
      });
  }

  async relatedArticles(id: string, topic?: string) {
    const calc = await this.repos.calculators.findById(id);
    if (!calc) throw this.notFound();

    const settings = (calc.settings ?? {}) as Record<string, unknown>;
    const relatedSettings = settings.relatedArticles as
      | {
          categorySlug?: string;
          topicField?: string;
          topicCategorySlugs?: Record<string, string>;
        }
      | undefined;

    let categorySlug: string | undefined;
    if (relatedSettings?.topicField && topic && relatedSettings.topicCategorySlugs?.[topic]) {
      categorySlug = relatedSettings.topicCategorySlugs[topic];
    } else if (relatedSettings?.categorySlug) {
      categorySlug = relatedSettings.categorySlug;
    }

    const page = await this.repos.articles.list({
      status: 'PUBLISHED',
      categorySlug,
      limit: 12,
      direction: 'desc',
    });

    type ArticleListRow = {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      metadata: unknown;
      featuredImage?: { url: string; secureUrl?: string | null } | null;
      category?: {
        name: string;
        slug: string;
        parent?: { name: string; slug: string } | null;
      } | null;
    };

    let items = page.items as unknown as ArticleListRow[];
    if (!categorySlug) {
      items = items.filter((article) => {
        const meta =
          article.metadata && typeof article.metadata === 'object'
            ? (article.metadata as Record<string, unknown>)
            : null;
        const slugs = meta?.calculatorSlugs;
        return Array.isArray(slugs) && slugs.includes(calc.slug);
      });
    }

    if (topic && relatedSettings?.topicField) {
      items = items.filter((article) => {
        const meta =
          article.metadata && typeof article.metadata === 'object'
            ? (article.metadata as Record<string, unknown>)
            : null;
        const loanTypes = meta?.loanTypes;
        if (!Array.isArray(loanTypes) || loanTypes.length === 0) return true;
        return loanTypes.includes(topic);
      });
    }

    return items.slice(0, 6).map((article) => {
      const category = article.category;
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        featuredImageUrl: article.featuredImage?.secureUrl || article.featuredImage?.url || null,
        category: category
          ? {
              name: category.name,
              slug: category.slug,
              parent: category.parent
                ? { name: category.parent.name, slug: category.parent.slug }
                : null,
            }
          : null,
      };
    });
  }

  async versions(id: string) {
    const calc = await this.repos.calculators.findById(id);
    if (!calc) throw this.notFound();
    return calc.versions;
  }

  async preview(id: string, input: RunCalculatorInput) {
    return this.calculate(id, input, null);
  }
}
