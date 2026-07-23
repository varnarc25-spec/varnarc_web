export type AiPricingModel =
  | 'FREE'
  | 'FREEMIUM'
  | 'SUBSCRIPTION'
  | 'PAY_AS_YOU_GO'
  | 'ENTERPRISE'
  | 'LIFETIME';

export type AiToolListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  logoUrl?: string | null;
  pricingModel?: AiPricingModel | string;
  freePlan?: boolean;
  freeTrial?: boolean;
  apiAvailable?: boolean;
  featured?: boolean;
  sponsored?: boolean;
  category?: { id: string; name: string; slug: string } | null;
  _count?: { bookmarks?: number };
};

export type AiToolDetail = AiToolListItem & {
  coverImageUrl?: string | null;
  pricingDetails?: string | null;
  monthlyPrice?: string | null;
  annualPrice?: string | null;
  website?: string | null;
  documentation?: string | null;
  affiliateUrl?: string | null;
  platforms?: string[] | null;
  languages?: string[] | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  features?: Array<{ id?: string; name: string; sortOrder?: number }>;
  integrations?: Array<{ id?: string; name: string; sortOrder?: number }>;
  screenshots?: Array<{ id?: string; url?: string | null; caption?: string | null; sortOrder?: number }>;
  company?: { id: string; name: string; slug: string; website?: string | null } | null;
};

export type AiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  children?: Array<{ id: string; name: string; slug: string }>;
  _count?: { tools?: number };
};

export type AiRelatedResponse = {
  tool?: { id: string; name: string; slug: string };
  ratingSummary?: { averageRating?: number | string | null; totalRatings?: number };
  userReviews?: Array<{
    id: string;
    rating: number | string;
    title?: string | null;
    comment?: string | null;
    user?: { displayName?: string | null; email?: string | null } | null;
  }>;
  editorialReviews?: Array<{ id: string; title: string; slug: string }>;
  comparisons?: Array<{ id: string; title: string; slug: string }>;
  relatedInCategory?: AiToolListItem[];
};

export type AiCompareResponse = {
  slugs: string[];
  tools: AiToolDetail[];
};

/** okCursor returns data as an array; tolerate `{ items }` shapes defensively. */
export function unwrapList<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export const PRICING_LABELS: Record<string, string> = {
  FREE: 'Free',
  FREEMIUM: 'Freemium',
  SUBSCRIPTION: 'Subscription',
  PAY_AS_YOU_GO: 'Pay as you go',
  ENTERPRISE: 'Enterprise',
  LIFETIME: 'Lifetime',
};

export function formatPricingModel(model?: string | null): string {
  if (!model) return '';
  return PRICING_LABELS[model] ?? model.replace(/_/g, ' ');
}
