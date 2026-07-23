import type { Repositories } from '@varnarc/database';

export type ResolvedBookmark = {
  title: string;
  href: string | null;
  subtitle?: string | null;
};

function fallback(entityType: string, entityId: string): ResolvedBookmark {
  return {
    title: `${entityType} · ${entityId.slice(0, 8)}…`,
    href: null,
    subtitle: entityType,
  };
}

/** Resolve bookmark entity to a human title and public path. */
export async function resolveBookmarkEntity(
  repos: Repositories,
  entityType: string,
  entityId: string,
): Promise<ResolvedBookmark> {
  const type = entityType.toLowerCase();

  switch (type) {
    case 'article': {
      const row = await repos.articles.findById(entityId);
      return row
        ? { title: row.title, href: `/articles/${row.slug}`, subtitle: 'Article' }
        : fallback(entityType, entityId);
    }
    case 'page': {
      const row = await repos.pages.findById(entityId);
      return row
        ? { title: row.title, href: `/p/${row.slug}`, subtitle: 'Page' }
        : fallback(entityType, entityId);
    }
    case 'review': {
      const row = await repos.reviews.findById(entityId);
      return row
        ? { title: row.title, href: `/reviews/${row.slug}`, subtitle: 'Review' }
        : fallback(entityType, entityId);
    }
    case 'calculator': {
      const row = await repos.calculators.findById(entityId);
      return row
        ? { title: row.name, href: `/calculators/${row.slug}`, subtitle: 'Calculator' }
        : fallback(entityType, entityId);
    }
    case 'ai_tool':
    case 'ai-tool': {
      const row = await repos.aiTools.findById(entityId);
      return row
        ? { title: row.name, href: `/ai-tools/${row.slug}`, subtitle: 'AI Tool' }
        : fallback(entityType, entityId);
    }
    case 'comparison': {
      const row = await repos.comparisons.findById(entityId);
      return row
        ? { title: row.title, href: `/compare/${row.slug}`, subtitle: 'Comparison' }
        : fallback(entityType, entityId);
    }
    case 'business':
    case 'directory':
    case 'directory_listing': {
      const row = await repos.businesses.findById(entityId);
      return row
        ? { title: row.name, href: `/directory/${row.slug}`, subtitle: 'Directory' }
        : fallback(entityType, entityId);
    }
    case 'finance_guide': {
      const row = await repos.financeGuides.findById(entityId);
      return row
        ? { title: row.title, href: `/finance/guides/${row.slug}`, subtitle: 'Finance guide' }
        : fallback(entityType, entityId);
    }
    case 'loan': {
      const row = await repos.loans.findById(entityId);
      return row
        ? { title: row.name, href: `/finance/loans/${row.id}`, subtitle: 'Loan' }
        : fallback(entityType, entityId);
    }
    case 'credit_card': {
      const row = await repos.creditCards.findById(entityId);
      return row
        ? { title: row.name, href: `/finance/credit-cards/${row.id}`, subtitle: 'Credit card' }
        : fallback(entityType, entityId);
    }
    case 'bank': {
      const row = await repos.banks.findById(entityId);
      return row
        ? { title: row.name, href: `/finance/banks/${row.slug}`, subtitle: 'Bank' }
        : fallback(entityType, entityId);
    }
    case 'construction_material': {
      const row = await repos.constructionMaterials.findById(entityId);
      return row
        ? { title: row.name, href: `/construction/materials/${row.id}`, subtitle: 'Material' }
        : fallback(entityType, entityId);
    }
    case 'automobile_vehicle': {
      const row = await repos.automobileVehicles.findById(entityId);
      return row
        ? { title: row.name, href: `/automobile/vehicles/${row.slug}`, subtitle: 'Vehicle' }
        : fallback(entityType, entityId);
    }
    default:
      return fallback(entityType, entityId);
  }
}

export async function enrichBookmarks<T extends { entityType: string; entityId: string }>(
  repos: Repositories,
  rows: T[],
) {
  return Promise.all(
    rows.map(async (row) => {
      const resolved = await resolveBookmarkEntity(repos, row.entityType, row.entityId);
      return { ...row, ...resolved };
    }),
  );
}
