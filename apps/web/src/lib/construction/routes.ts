/** Construction path helpers — keep URL construction in one place. */

export const CONSTRUCTION_ROOT = '/construction' as const;

export function constructionPath(segment = ''): string {
  if (!segment) return CONSTRUCTION_ROOT;
  return `${CONSTRUCTION_ROOT}/${segment.replace(/^\//, '')}`;
}

export function constructionMaterialPath(idOrSlug: string): string {
  return constructionPath(`materials/${idOrSlug}`);
}

export function constructionBrandPath(slug: string): string {
  return constructionPath(`brands/${slug}`);
}

export function constructionGuidePath(slug: string): string {
  return constructionPath(`guides/${slug}`);
}

export function constructionChecklistPath(slug: string): string {
  return constructionPath(`checklists/${slug}`);
}

export function constructionComparePath(ids?: string[]): string {
  const base = constructionPath('compare');
  if (!ids?.length) return base;
  return `${base}?ids=${ids.join(',')}`;
}

/** Future calculator routes under /construction (preferred) or /calculators. */
export function constructionCalculatorPath(slug: string): string {
  return `/calculators/${slug}`;
}
