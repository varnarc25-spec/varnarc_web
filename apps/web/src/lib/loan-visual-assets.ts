/**
 * Shared Varnarc loan visual assets — hub surfaces prefer these over CMS uploads
 * so the page stays one editorial system (navy / off-white / restrained orange).
 */

import { loanCategoryIllustration } from '@/lib/loan-category-icons';
import { inferRelatedLoanCategorySlug } from '@/lib/loan-contextual-links';

export const LOAN_HERO_ASSET = '/hub/finance/loans-hero.svg';
export const LOAN_OVERVIEW_ASSET = '/hub/finance/overview-visual.svg';
export const LOAN_DEFAULT_CATEGORY_ASSET = '/hub/finance/categories/personal-loan.svg';

/** True when the URL is already a first-party `/hub/...` editorial asset. */
export function isVarnarcHubAsset(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const value = url.trim();
  if (value.startsWith('/hub/')) return true;
  try {
    const path = value.startsWith('http') ? new URL(value).pathname : value;
    return path.startsWith('/hub/');
  } catch {
    return false;
  }
}

/**
 * Category card illustration — always the shared SVG set when available.
 * CMS featured images are ignored on hub cards to avoid mixed photo/stock art.
 */
export function resolveLoanCategoryCardImage(input: {
  slug: string;
  featuredImage?: string | null;
}): string {
  const canonical = loanCategoryIllustration(input.slug);
  if (canonical) return canonical;
  if (isVarnarcHubAsset(input.featuredImage)) return input.featuredImage!.trim();
  return LOAN_DEFAULT_CATEGORY_ASSET;
}

/**
 * Hero illustration for loans hub / category pages.
 * Prefers category SVG, then CMS only when it is already a Varnarc hub asset.
 */
export function resolveLoanHeroImage(input: {
  categorySlug?: string | null;
  heroImageUrl?: string | null;
  featuredImageUrl?: string | null;
}): string {
  if (input.categorySlug) {
    const categoryArt = loanCategoryIllustration(input.categorySlug);
    if (categoryArt) return categoryArt;
  }
  if (isVarnarcHubAsset(input.heroImageUrl)) return input.heroImageUrl!.trim();
  if (isVarnarcHubAsset(input.featuredImageUrl)) return input.featuredImageUrl!.trim();
  return LOAN_HERO_ASSET;
}

/**
 * Guide / article card cover on the loans hub.
 * Prefer category SVG (or hub asset) over photorealistic CMS covers.
 */
export function resolveLoanGuideCoverImage(input: {
  featuredUrl?: string | null;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  categoryLabel?: string | null;
}): string {
  const relatedSlug = inferRelatedLoanCategorySlug(
    input.title,
    input.excerpt,
    input.categoryLabel,
    input.slug,
  );
  const categoryArt = relatedSlug ? loanCategoryIllustration(relatedSlug) : null;
  if (categoryArt) return categoryArt;

  if (isVarnarcHubAsset(input.featuredUrl)) return input.featuredUrl!.trim();

  return LOAN_DEFAULT_CATEGORY_ASSET;
}
