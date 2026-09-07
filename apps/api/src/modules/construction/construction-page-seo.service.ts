import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@varnarc/database';
import {
  CONSTRUCTION_CMS_PAGE_DEFAULTS,
  CONSTRUCTION_PAGE_ENTITY_TYPE,
  CONSTRUCTION_PAGE_IDS,
  CONSTRUCTION_PAGE_KEYS,
  constructionPageKeySchema,
  type ConstructionPageKey,
  type UpdateConstructionPageSeoInput,
} from '@varnarc/validation';
import { PRISMA } from '../../database/database.module';

type PageStructuredData = {
  h1?: string | null;
  intro?: string | null;
  heroImageUrl?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
};

function parsePageStructuredData(value: unknown): PageStructuredData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    h1: typeof row.h1 === 'string' ? row.h1 : null,
    intro: typeof row.intro === 'string' ? row.intro : null,
    heroImageUrl: typeof row.heroImageUrl === 'string' ? row.heroImageUrl : null,
    heroImageMediaId: typeof row.heroImageMediaId === 'string' ? row.heroImageMediaId : null,
    heroImageAlt: typeof row.heroImageAlt === 'string' ? row.heroImageAlt : null,
  };
}

@Injectable()
export class ConstructionPageSeoService {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient) {}

  listPages() {
    return CONSTRUCTION_PAGE_KEYS.map((key) => {
      const defaults = CONSTRUCTION_CMS_PAGE_DEFAULTS[key];
      return { pageKey: key, path: defaults.path, label: defaults.label };
    });
  }

  private resolvePageKey(pageKey: string): ConstructionPageKey {
    const parsed = constructionPageKeySchema.safeParse(pageKey);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Unknown construction page key.' },
      });
    }
    return parsed.data;
  }

  async getPageSeo(pageKeyInput: string) {
    const pageKey = this.resolvePageKey(pageKeyInput);
    const defaults = CONSTRUCTION_CMS_PAGE_DEFAULTS[pageKey];
    const entityId = CONSTRUCTION_PAGE_IDS[pageKey];
    const meta = await this.db.seoMetadata.findUnique({
      where: {
        entityType_entityId: { entityType: CONSTRUCTION_PAGE_ENTITY_TYPE, entityId },
      },
    });
    const structured = parsePageStructuredData(meta?.structuredData);
    let heroImageUrl = structured.heroImageUrl ?? null;
    if (!heroImageUrl && structured.heroImageMediaId) {
      const asset = await this.db.mediaAsset.findFirst({
        where: { id: structured.heroImageMediaId, deletedAt: null },
        select: { secureUrl: true, url: true },
      });
      heroImageUrl = asset?.secureUrl || asset?.url || null;
    }

    return {
      pageKey,
      entityId,
      path: defaults.path,
      label: defaults.label,
      title: meta?.title ?? defaults.title,
      description: meta?.description ?? defaults.description,
      h1: structured.h1 ?? defaults.h1,
      intro: structured.intro ?? defaults.intro,
      heroImageUrl,
      heroImageMediaId: structured.heroImageMediaId ?? null,
      heroImageAlt: structured.heroImageAlt ?? null,
      metaKeywords: meta?.metaKeywords ?? null,
      canonicalUrl: meta?.canonicalUrl ?? defaults.canonicalUrl ?? null,
    };
  }

  async upsertPageSeo(pageKeyInput: string, input: UpdateConstructionPageSeoInput) {
    const pageKey = this.resolvePageKey(pageKeyInput);
    const defaults = CONSTRUCTION_CMS_PAGE_DEFAULTS[pageKey];
    const entityId = CONSTRUCTION_PAGE_IDS[pageKey];
    const existing = await this.db.seoMetadata.findUnique({
      where: {
        entityType_entityId: { entityType: CONSTRUCTION_PAGE_ENTITY_TYPE, entityId },
      },
    });
    const existingStructured = parsePageStructuredData(existing?.structuredData);
    const structuredData: PageStructuredData = {
      h1: input.h1 !== undefined ? input.h1 : (existingStructured.h1 ?? defaults.h1),
      intro: input.intro !== undefined ? input.intro : (existingStructured.intro ?? defaults.intro),
      heroImageUrl:
        input.heroImageUrl !== undefined
          ? input.heroImageUrl?.trim() || null
          : (existingStructured.heroImageUrl ?? null),
      heroImageMediaId:
        input.heroImageMediaId !== undefined
          ? input.heroImageMediaId || null
          : (existingStructured.heroImageMediaId ?? null),
      heroImageAlt:
        input.heroImageAlt !== undefined
          ? input.heroImageAlt?.trim() || null
          : (existingStructured.heroImageAlt ?? null),
    };

    await this.db.seoMetadata.upsert({
      where: {
        entityType_entityId: { entityType: CONSTRUCTION_PAGE_ENTITY_TYPE, entityId },
      },
      create: {
        entityType: CONSTRUCTION_PAGE_ENTITY_TYPE,
        entityId,
        title: input.title ?? defaults.title,
        description: input.description ?? defaults.description,
        metaKeywords: input.metaKeywords ?? null,
        canonicalUrl: input.canonicalUrl || defaults.path,
        structuredData,
      },
      update: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.metaKeywords !== undefined ? { metaKeywords: input.metaKeywords } : {}),
        ...(input.canonicalUrl !== undefined ? { canonicalUrl: input.canonicalUrl || null } : {}),
        structuredData,
      },
    });

    return this.getPageSeo(pageKey);
  }
}
