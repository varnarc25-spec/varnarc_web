import type { ReviewListItem } from '@/services/content';

export type ReviewCategoryKey =
  'finance' | 'automobile' | 'home' | 'solar' | 'appliances' | 'services';

export const REVIEW_CATEGORY_META: Record<
  ReviewCategoryKey,
  { label: string; description: string; badge: string }
> = {
  finance: {
    label: 'Finance',
    badge: 'Finance',
    description: 'Credit cards, insurance, loans and other financial products.',
  },
  automobile: {
    label: 'Automobile',
    badge: 'Automobile',
    description: 'Cars, accessories and vehicle-related products.',
  },
  home: {
    label: 'Home & Construction',
    badge: 'Home & Construction',
    description: 'Tools, materials, appliances and home-improvement products.',
  },
  solar: {
    label: 'Solar',
    badge: 'Solar',
    description: 'Panels, inverters, batteries and solar equipment.',
  },
  appliances: {
    label: 'Appliances',
    badge: 'Appliances',
    description: 'Home appliances and everyday products.',
  },
  services: {
    label: 'Services',
    badge: 'Services',
    description: 'Businesses and service providers, where reviews exist.',
  },
};

export type EditorialScore = {
  value: number;
  max: number;
  label: string;
};

export function parseEditorialScore(
  raw: number | string | null | undefined,
): EditorialScore | null {
  if (raw == null) return null;
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  const max = value <= 5 ? 5 : value <= 10 ? 10 : 100;
  return { value, max, label: 'Varnarc Editorial Rating' };
}

export function classifyReview(review: ReviewListItem): ReviewCategoryKey | 'other' {
  const hay = [
    review.entityType,
    review.product?.category,
    review.product?.name,
    review.slug,
    review.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/solar|inverter|photovoltaic|battery storage|topcon|perc/.test(hay)) return 'solar';
  if (
    /loan|credit card|insurance|fd\b|rd\b|sip|invest|emi|nbfc|mutual fund|bank/.test(hay) ||
    review.entityType === 'loan_product' ||
    review.entityType === 'insurance_plan' ||
    review.entityType === 'credit_card'
  ) {
    return 'finance';
  }
  if (
    /car|suv|sedan|hatch|vehicle|tyre|automobile|hyundai|kia|honda|maruti/.test(hay) ||
    review.entityType === 'vehicle'
  ) {
    return 'automobile';
  }
  if (
    /cement|brick|paint|tile|plywood|construction|concrete|drill|compressor/.test(hay) ||
    review.entityType === 'construction_material' ||
    review.entityType === 'building_brand'
  ) {
    return 'home';
  }
  if (/appliance|refrigerator|washing|ac\b|television|\btv\b|microwave/.test(hay)) {
    return 'appliances';
  }
  if (
    review.entityType === 'business' ||
    review.entityType === 'service' ||
    review.entityType === 'directory_listing' ||
    /installer|dealer|contractor|workshop/.test(hay)
  ) {
    return 'services';
  }
  return 'other';
}

export function reviewerLabel(review: ReviewListItem): { name: string; href: string } {
  const name = review.author?.displayName?.trim();
  const username = review.author?.username?.trim();
  if (name && username) return { name, href: `/authors/${username}` };
  if (username) return { name: username, href: `/authors/${username}` };
  return { name: 'Varnarc Editorial', href: '/authors/varnarc-editorial' };
}

export function reviewDate(review: ReviewListItem): string | null {
  return review.updatedAt || review.publishedAt || null;
}

export function criterionLabels(review: ReviewListItem, limit = 3): string[] {
  return (review.scores ?? [])
    .map((item) => item.label?.trim())
    .filter((label): label is string => Boolean(label))
    .slice(0, limit);
}

export function exploreTopics(reviews: ReviewListItem[]): Array<{
  key: ReviewCategoryKey;
  topics: string[];
}> {
  return (Object.keys(REVIEW_CATEGORY_META) as ReviewCategoryKey[])
    .map((key) => {
      const topics = [
        ...new Set(
          reviews
            .filter((review) => classifyReview(review) === key)
            .map((review) => review.product?.category?.trim())
            .filter((label): label is string => Boolean(label)),
        ),
      ].slice(0, 4);
      const hasReviews = reviews.some((review) => classifyReview(review) === key);
      return { key, topics: hasReviews ? topics : [] };
    })
    .filter((group) => reviews.some((review) => classifyReview(review) === group.key));
}
