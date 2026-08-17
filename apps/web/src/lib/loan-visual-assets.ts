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
 * Category landing hero: prefer LoanCategory CMS/media, then shared hub illustration family.
 */
export function resolveLoanCategoryHeroImage(input: {
  categorySlug?: string | null;
  heroImageUrl?: string | null;
  featuredImageUrl?: string | null;
}): string {
  const cmsHero = input.heroImageUrl?.trim();
  if (cmsHero) return cmsHero;
  const cmsFeatured = input.featuredImageUrl?.trim();
  if (cmsFeatured) return cmsFeatured;
  return resolveLoanHeroImage({
    categorySlug: input.categorySlug,
    heroImageUrl: null,
    featuredImageUrl: null,
  });
}

/** Car Loan editorial guide family — topic art instead of empty/gray placeholders. */
export const CAR_LOAN_GUIDE_ASSETS = {
  affordability: '/hub/finance/car-loan-guides/affordability.svg',
  downPayment: '/hub/finance/car-loan-guides/down-payment.svg',
  emi: '/hub/finance/car-loan-guides/emi.svg',
  newVsUsed: '/hub/finance/car-loan-guides/new-vs-used.svg',
  bankVsDealer: '/hub/finance/car-loan-guides/bank-vs-dealer.svg',
  prepayment: '/hub/finance/car-loan-guides/prepayment.svg',
  hypothecation: '/hub/finance/car-loan-guides/hypothecation.svg',
  closure: '/hub/finance/car-loan-guides/loan-closure.svg',
  fallback: '/hub/finance/car-loan-guides/affordability.svg',
} as const;

/**
 * Map a Car Loan guide title/slug to the matching editorial illustration.
 * Always returns a first-party asset — never an empty gray block.
 */
export function resolveCarLoanGuideTopicImage(input: {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
}): string {
  const text = [input.title, input.excerpt, input.slug].filter(Boolean).join(' ').toLowerCase();

  if (/afford|budget|how much car/.test(text)) return CAR_LOAN_GUIDE_ASSETS.affordability;
  if (/down\s*payment|downpayment/.test(text)) return CAR_LOAN_GUIDE_ASSETS.downPayment;
  if (/prepay|foreclos/.test(text)) return CAR_LOAN_GUIDE_ASSETS.prepayment;
  if (/hypothec/.test(text)) return CAR_LOAN_GUIDE_ASSETS.hypothecation;
  if (/clos(e|ure|ing)|noc\b|fully repaid/.test(text)) return CAR_LOAN_GUIDE_ASSETS.closure;
  if (/new\s*vs\s*used|used\s*car|new\s*car/.test(text)) return CAR_LOAN_GUIDE_ASSETS.newVsUsed;
  if (/bank\s*vs\s*dealer|dealer\s*finance|bank\s*finance/.test(text)) {
    return CAR_LOAN_GUIDE_ASSETS.bankVsDealer;
  }
  if (/\bemi\b|tenure|\brepayment\b/.test(text)) return CAR_LOAN_GUIDE_ASSETS.emi;

  return CAR_LOAN_GUIDE_ASSETS.fallback;
}

/**
 * Guide / article card cover on the loans hub.
 * Prefer category SVG (or hub asset) over photorealistic CMS covers.
 * Car Loan cards use the topic editorial family when no first-party featured image exists.
 */
export function resolveLoanGuideCoverImage(input: {
  featuredUrl?: string | null;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  categoryLabel?: string | null;
  categorySlug?: string | null;
}): string {
  if (isVarnarcHubAsset(input.featuredUrl) && input.featuredUrl!.includes('/car-loan-guides/')) {
    return input.featuredUrl!.trim();
  }

  const relatedSlug =
    input.categorySlug?.trim() ||
    inferRelatedLoanCategorySlug(input.title, input.excerpt, input.categoryLabel, input.slug);

  if (relatedSlug === 'car-loan') {
    if (isVarnarcHubAsset(input.featuredUrl) && input.featuredUrl!.includes('/car-loan')) {
      return input.featuredUrl!.trim();
    }
    return resolveCarLoanGuideTopicImage({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
    });
  }

  const categoryArt = relatedSlug ? loanCategoryIllustration(relatedSlug) : null;
  if (categoryArt) return categoryArt;

  if (isVarnarcHubAsset(input.featuredUrl)) return input.featuredUrl!.trim();

  return LOAN_DEFAULT_CATEGORY_ASSET;
}
