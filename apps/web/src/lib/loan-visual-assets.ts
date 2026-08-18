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

/** Education Loan editorial guide family. */
export const EDUCATION_LOAN_GUIDE_ASSETS = {
  fundingGap: '/hub/finance/education-loan-guides/funding-gap.svg',
  studyAbroad: '/hub/finance/education-loan-guides/study-abroad.svg',
  moratorium: '/hub/finance/education-loan-guides/moratorium.svg',
  studyInterest: '/hub/finance/education-loan-guides/study-interest.svg',
  secured: '/hub/finance/education-loan-guides/secured.svg',
  coapplicant: '/hub/finance/education-loan-guides/coapplicant.svg',
  government: '/hub/finance/education-loan-guides/government.svg',
  fallback: '/hub/finance/education-loan-guides/funding-gap.svg',
} as const;

export function resolveEducationLoanGuideTopicImage(input: {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
}): string {
  const text = [input.title, input.excerpt, input.slug].filter(Boolean).join(' ').toLowerCase();

  if (/abroad|overseas|foreign/.test(text)) return EDUCATION_LOAN_GUIDE_ASSETS.studyAbroad;
  if (/moratorium/.test(text)) return EDUCATION_LOAN_GUIDE_ASSETS.moratorium;
  if (/interest during|pay interest|capitaliz/.test(text)) {
    return EDUCATION_LOAN_GUIDE_ASSETS.studyInterest;
  }
  if (/secured|unsecured|collateral/.test(text)) return EDUCATION_LOAN_GUIDE_ASSETS.secured;
  if (/co-?applicant|parent/.test(text)) return EDUCATION_LOAN_GUIDE_ASSETS.coapplicant;
  if (/vidyalaxmi|csis|government|subsid|subvention|qhei/.test(text)) {
    return EDUCATION_LOAN_GUIDE_ASSETS.government;
  }
  if (/funding|cost|how much|gap|need/.test(text)) return EDUCATION_LOAN_GUIDE_ASSETS.fundingGap;

  return EDUCATION_LOAN_GUIDE_ASSETS.fallback;
}

/** Business Loan editorial guide family. */
export const BUSINESS_LOAN_GUIDE_ASSETS = {
  workingCapital: '/hub/finance/business-loan-guides/working-capital.svg',
  dscr: '/hub/finance/business-loan-guides/dscr.svg',
  cashFlow: '/hub/finance/business-loan-guides/cash-flow.svg',
  eligibility: '/hub/finance/business-loan-guides/eligibility.svg',
  documents: '/hub/finance/business-loan-guides/documents.svg',
  msme: '/hub/finance/business-loan-guides/msme.svg',
  secured: '/hub/finance/business-loan-guides/secured.svg',
  turnover: '/hub/finance/business-loan-guides/turnover.svg',
  fallback: '/hub/finance/business-loan-guides/cash-flow.svg',
} as const;

export function resolveBusinessLoanGuideTopicImage(input: {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
}): string {
  const text = [input.title, input.excerpt, input.slug].filter(Boolean).join(' ').toLowerCase();

  if (/working capital|term loan|inventory/.test(text)) {
    return BUSINESS_LOAN_GUIDE_ASSETS.workingCapital;
  }
  if (/dscr|debt service/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.dscr;
  if (/cash.?flow|stress/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.cashFlow;
  if (/eligib/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.eligibility;
  if (/document/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.documents;
  if (/msme|udyam|cgtmse|government/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.msme;
  if (/secured|unsecured|collateral/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.secured;
  if (/turnover|profit/.test(text)) return BUSINESS_LOAN_GUIDE_ASSETS.turnover;

  return BUSINESS_LOAN_GUIDE_ASSETS.fallback;
}

/** Gold Loan editorial guide family. */
export const GOLD_LOAN_GUIDE_ASSETS = {
  valuation: '/hub/finance/gold-loan-guides/valuation.svg?v=3',
  ltv: '/hub/finance/gold-loan-guides/ltv.svg?v=3',
  purity: '/hub/finance/gold-loan-guides/purity.svg?v=3',
  repayment: '/hub/finance/gold-loan-guides/repayment.svg?v=3',
  auction: '/hub/finance/gold-loan-guides/auction.svg?v=3',
  release: '/hub/finance/gold-loan-guides/release.svg?v=3',
  vsPersonal: '/hub/finance/gold-loan-guides/vs-personal.svg?v=3',
  process: '/hub/finance/gold-loan-guides/process.svg?v=3',
  fallback: '/hub/finance/gold-loan-guides/valuation.svg?v=3',
} as const;

export function resolveGoldLoanGuideTopicImage(input: {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
}): string {
  const text = [input.title, input.excerpt, input.slug].filter(Boolean).join(' ').toLowerCase();

  if (/valuat|apprais|weight|rate per/.test(text)) return GOLD_LOAN_GUIDE_ASSETS.valuation;
  if (/\bltv\b|loan.?to.?value|borrow(ing)? capacity|collateral/.test(text)) {
    return GOLD_LOAN_GUIDE_ASSETS.ltv;
  }
  if (/purity|karat|18k|22k|24k|fine.?gold/.test(text)) return GOLD_LOAN_GUIDE_ASSETS.purity;
  if (/repay|emi|interest.?only|bullet/.test(text)) return GOLD_LOAN_GUIDE_ASSETS.repayment;
  if (/auction|default|miss(ed)?|overdue|recovery/.test(text)) {
    return GOLD_LOAN_GUIDE_ASSETS.auction;
  }
  if (/release|return|closure|get (your )?gold back/.test(text)) {
    return GOLD_LOAN_GUIDE_ASSETS.release;
  }
  if (/personal loan|vs|versus|compare/.test(text)) return GOLD_LOAN_GUIDE_ASSETS.vsPersonal;
  if (/process|journey|application|pledge|how (a )?gold loan/.test(text)) {
    return GOLD_LOAN_GUIDE_ASSETS.process;
  }

  return GOLD_LOAN_GUIDE_ASSETS.fallback;
}

/** Loan Against Property editorial guide family. */
export const LAP_GUIDE_ASSETS = {
  valuation: '/hub/finance/loan-against-property-guides/valuation.svg?v=2',
  ltv: '/hub/finance/loan-against-property-guides/ltv.svg?v=2',
  eligibility: '/hub/finance/loan-against-property-guides/eligibility.svg?v=2',
  documents: '/hub/finance/loan-against-property-guides/documents.svg?v=2',
  residentialCommercial:
    '/hub/finance/loan-against-property-guides/residential-vs-commercial.svg?v=2',
  vsHome: '/hub/finance/loan-against-property-guides/vs-home.svg?v=2',
  prepayment: '/hub/finance/loan-against-property-guides/prepayment.svg?v=2',
  verification: '/hub/finance/loan-against-property-guides/verification.svg?v=2',
  process: '/hub/finance/loan-against-property-guides/process.svg?v=2',
  fallback: '/hub/finance/loan-against-property-guides/valuation.svg?v=2',
} as const;

export function resolveLapGuideTopicImage(input: {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
}): string {
  const text = [input.title, input.excerpt, input.slug].filter(Boolean).join(' ').toLowerCase();

  if (/valuat|apprais|property value/.test(text)) return LAP_GUIDE_ASSETS.valuation;
  if (/\bltv\b|loan.?to.?value|borrow(ing)? capacity|loan capacity/.test(text)) {
    return LAP_GUIDE_ASSETS.ltv;
  }
  if (/eligib/.test(text)) return LAP_GUIDE_ASSETS.eligibility;
  if (/document|kyc|checklist|papers/.test(text)) return LAP_GUIDE_ASSETS.documents;
  if (/residential|commercial|property type/.test(text)) {
    return LAP_GUIDE_ASSETS.residentialCommercial;
  }
  if (/home loan|vs home|versus home/.test(text)) return LAP_GUIDE_ASSETS.vsHome;
  if (/prepay|foreclos|part.?payment/.test(text)) return LAP_GUIDE_ASSETS.prepayment;
  if (/verif|legal|technical|title|diligence/.test(text)) return LAP_GUIDE_ASSETS.verification;
  if (/process|journey|application|disburse/.test(text)) return LAP_GUIDE_ASSETS.process;

  return LAP_GUIDE_ASSETS.fallback;
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

  if (relatedSlug === 'education-loan') {
    if (
      isVarnarcHubAsset(input.featuredUrl) &&
      input.featuredUrl!.includes('/education-loan-guides/')
    ) {
      return input.featuredUrl!.trim();
    }
    return resolveEducationLoanGuideTopicImage({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
    });
  }

  if (relatedSlug === 'business-loan') {
    if (
      isVarnarcHubAsset(input.featuredUrl) &&
      input.featuredUrl!.includes('/business-loan-guides/')
    ) {
      return input.featuredUrl!.trim();
    }
    return resolveBusinessLoanGuideTopicImage({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
    });
  }

  if (relatedSlug === 'gold-loan') {
    if (isVarnarcHubAsset(input.featuredUrl) && input.featuredUrl!.includes('/gold-loan-guides/')) {
      return input.featuredUrl!.trim();
    }
    return resolveGoldLoanGuideTopicImage({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
    });
  }

  if (relatedSlug === 'loan-against-property') {
    if (
      isVarnarcHubAsset(input.featuredUrl) &&
      input.featuredUrl!.includes('/loan-against-property-guides/')
    ) {
      return input.featuredUrl!.trim();
    }
    return resolveLapGuideTopicImage({
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
