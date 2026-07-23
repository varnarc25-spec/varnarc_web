import { apiPublicFetch } from '@/services/api-client';
import { resolveArticleImageUrl } from '@/lib/article-category-icons';

export type ArticleCategoryRef = {
  name: string;
  slug: string;
  parent?: { name: string; slug: string } | null;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  publishedAt: string | null;
  isFeatured?: boolean;
  readingTimeMinutes?: number | null;
  category?: ArticleCategoryRef | null;
  featuredImage?: { url: string; secureUrl?: string | null } | null;
};

export function articleCardPropsFromListItem(a: ArticleListItem) {
  return {
    title: a.title,
    excerpt: a.excerpt,
    slug: a.slug,
    imageUrl: resolveArticleImageUrl(a),
    category: a.category,
  };
}

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  publishedAt: string | null;
  seo?: {
    title: string | null;
    description: string | null;
  } | null;
};

export type MenuItem = {
  id: string;
  label: string;
  href: string | null;
  sortOrder: number;
};

export type MenuPayload = {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
};

export type SearchResult = {
  query: string | null;
  articles: Array<{
    id: string;
    type: 'article';
    title: string;
    slug: string;
    excerpt: string | null;
    href: string;
  }>;
  pages: Array<{
    id: string;
    type: 'page';
    title: string;
    slug: string;
    href: string;
  }>;
};

export async function fetchArticles(
  limit = 12,
  options?: { featured?: boolean; categoryId?: string; search?: string },
) {
  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (options?.featured) qs.set('featured', 'true');
    if (options?.categoryId) qs.set('categoryId', options.categoryId);
    if (options?.search) qs.set('search', options.search);
    return await apiPublicFetch<ArticleListItem[]>(`/articles?${qs.toString()}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ArticleListItem[], meta: undefined };
  }
}

export async function fetchArticleBySlug(slug: string) {
  return apiPublicFetch<
    ArticleListItem & {
      content: string;
      related?: ArticleListItem[];
      readingTimeMinutes?: number | null;
      author?: {
        id: string;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
      } | null;
      category?: { id: string; name: string; slug: string } | null;
      tags?: Array<{ tag: { id: string; name: string; slug: string } }>;
      metadata?: unknown;
    }
  >(`/articles/slug/${slug}`, {
    cache: 'no-store',
  });
}

export async function fetchPageBySlug(slug: string) {
  return apiPublicFetch<CmsPage>(`/pages/slug/${slug}`, { cache: 'no-store' });
}

export async function fetchMenuByLocation(location: string) {
  try {
    return await apiPublicFetch<MenuPayload>(`/menus/location/${location}`, {
      next: { revalidate: 60 },
    });
  } catch {
    return { data: null };
  }
}

export async function searchContent(q: string, limit = 20) {
  try {
    return await apiPublicFetch<SearchResult>(
      `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { cache: 'no-store' },
    );
  } catch {
    return { data: { query: q, articles: [], pages: [] } as SearchResult };
  }
}

export type ReviewListItem = {
  id: string;
  title: string;
  slug: string;
  overallScore: number | string | null;
};

export type CalculatorListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type BusinessListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type HomepageLayout = {
  id: string;
  name: string;
  slug: string;
  sections: Array<{
    id: string;
    name: string;
    sortOrder: number;
    settings: unknown;
    widgetInstances: Array<{
      id: string;
      sortOrder: number;
      settings: unknown;
      widget: { id: string; slug: string; name: string };
    }>;
  }>;
};

export async function fetchReviews(limit = 12) {
  try {
    return await apiPublicFetch<ReviewListItem[]>(`/reviews?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ReviewListItem[], meta: undefined };
  }
}

export async function fetchCalculators(limit = 12) {
  try {
    return await apiPublicFetch<CalculatorListItem[]>(`/calculators?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as CalculatorListItem[], meta: undefined };
  }
}

export async function fetchBusinesses(limit = 12) {
  try {
    return await apiPublicFetch<BusinessListItem[]>(`/directory/businesses?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as BusinessListItem[], meta: undefined };
  }
}

export async function fetchHomepageDefault() {
  try {
    return await apiPublicFetch<HomepageLayout>('/homepage/default', { cache: 'no-store' });
  } catch {
    return { data: null };
  }
}

export type TrendingSearchItem = {
  keyword: string;
  searchCount: number;
};

export async function fetchTrendingSearches(limit = 8) {
  try {
    return await apiPublicFetch<TrendingSearchItem[]>(`/search/trending?limit=${limit}`, {
      next: { revalidate: 60 },
    });
  } catch {
    return { data: [] as TrendingSearchItem[], meta: undefined };
  }
}

export type TagListItem = {
  id: string;
  name: string;
  slug: string;
  _count?: { articles: number };
};

export type ComparisonListItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  _count?: { items: number };
};

export type ComparisonDetail = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description?: string | null;
  recommendation?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  winnerEntityId?: string | null;
  items: Array<{
    sortOrder: number;
    label?: string | null;
    product: { id: string; name: string; slug?: string | null };
  }>;
  attributes: Array<{
    key: string;
    label: string;
    valueType?: string;
    groupKey?: string | null;
    values: unknown;
    sortOrder: number;
  }>;
};

export async function fetchTags(limit = 50) {
  try {
    return await apiPublicFetch<TagListItem[]>(`/tags?limit=${limit}`, { cache: 'no-store' });
  } catch {
    return { data: [] as TagListItem[], meta: undefined };
  }
}

export async function fetchTagBySlug(slug: string) {
  return apiPublicFetch<TagListItem>(`/tags/slug/${slug}`, { cache: 'no-store' });
}

export async function fetchArticlesByTagSlug(slug: string, limit = 24) {
  try {
    return await apiPublicFetch<ArticleListItem[]>(`/tags/slug/${slug}/articles?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ArticleListItem[], meta: undefined };
  }
}

export async function fetchComparisons(limit = 24, options?: { comparisonType?: string }) {
  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (options?.comparisonType) qs.set('comparisonType', options.comparisonType);
    return await apiPublicFetch<ComparisonListItem[]>(`/comparisons?${qs.toString()}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as ComparisonListItem[], meta: undefined };
  }
}

export async function fetchComparisonBySlug(slug: string) {
  return apiPublicFetch<ComparisonDetail>(`/comparisons/slug/${slug}`, { cache: 'no-store' });
}
