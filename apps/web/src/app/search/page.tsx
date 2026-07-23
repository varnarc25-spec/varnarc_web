import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';
import { SearchAiToggle } from '@/components/search/search-ai-toggle';
import { SearchResultCard } from '@/components/search/search-result-card';
import { SearchRecent } from '@/components/search/search-recent';
import { apiPublicFetch } from '@/services/api-client';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { breadcrumbJsonLd } from '@/components/seo/json-ld';

type SearchResult = {
  query: string | null;
  queryId?: string | null;
  latencyMs?: number;
  total?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
  results?: Array<{
    entityType: string;
    entityId: string;
    title: string;
    slug: string;
    summary?: string | null;
    thumbnail?: string | null;
    category?: string | null;
    location?: string | null;
    author?: string | null;
    brand?: string | null;
    tags?: string | null;
    publishedAt?: string | null;
    rating?: number | null;
    highlighted?: string | null;
    url: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    featured?: boolean;
    sponsored?: boolean;
    verified?: boolean;
  }>;
  facets?: {
    entityTypes?: Array<{ entityType: string; count: number }>;
    categories?: Array<{ category: string; count: number }>;
  };
};

type PopularItem = { keyword: string; searchCount?: number };

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_popular', label: 'Most popular' },
  { value: 'highest_rated', label: 'Highest rated' },
  { value: 'alphabetical', label: 'A–Z' },
] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  const title = query ? `Search: ${query}` : 'Search';
  const description = query
    ? `Results for “${query}” across Varnarc tools, guides, and listings.`
    : 'Search articles, tools, finance products, directory listings, and more.';
  return {
    title,
    description,
    alternates: { canonical: query ? `/search?q=${encodeURIComponent(query)}` : '/search' },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    sort?: string;
    featured?: string;
    location?: string;
    brand?: string;
    tags?: string;
    minRating?: string;
    fuelType?: string;
    vehicleType?: string;
    loanType?: string;
    materialType?: string;
    cursor?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || '';
  const type = params.type?.trim() || '';
  const category = params.category?.trim() || '';
  const sort = params.sort?.trim() || 'relevance';
  const featured = params.featured === 'true';
  const location = params.location?.trim() || '';
  const brand = params.brand?.trim() || '';
  const tags = params.tags?.trim() || '';
  const minRating = params.minRating?.trim() || '';
  const fuelType = params.fuelType?.trim() || '';
  const vehicleType = params.vehicleType?.trim() || '';
  const loanType = params.loanType?.trim() || '';
  const materialType = params.materialType?.trim() || '';
  const cursor = params.cursor?.trim() || '';

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (type) qs.set('entityType', type);
  if (category) qs.set('category', category);
  if (sort) qs.set('sort', sort);
  if (featured) qs.set('featured', 'true');
  if (location) qs.set('location', location);
  if (brand) qs.set('brand', brand);
  if (tags) qs.set('tags', tags);
  if (minRating) qs.set('minRating', minRating);
  if (fuelType) qs.set('fuelType', fuelType);
  if (vehicleType) qs.set('vehicleType', vehicleType);
  if (loanType) qs.set('loanType', loanType);
  if (materialType) qs.set('materialType', materialType);
  if (cursor) qs.set('cursor', cursor);
  qs.set('limit', '20');

  const [searchRes, popularRes, trendingRes, aiSearchEnabled] = await Promise.all([
    q
      ? apiPublicFetch<SearchResult>(`/search?${qs}`, { cache: 'no-store' }).catch(() => ({
          data: {
            query: q,
            results: [],
            facets: { entityTypes: [], categories: [] },
            nextCursor: null,
            hasMore: false,
          } as SearchResult,
        }))
      : Promise.resolve({ data: null as SearchResult | null }),
    apiPublicFetch<PopularItem[]>('/search/popular?limit=8', { next: { revalidate: 60 } }).catch(() => ({
      data: [] as PopularItem[],
    })),
    apiPublicFetch<PopularItem[]>('/search/trending?limit=8', { next: { revalidate: 60 } }).catch(() => ({
      data: [] as PopularItem[],
    })),
    isFeatureEnabled('search.ai.enabled'),
  ]);

  const data = searchRes.data;
  const results = data?.results ?? [];
  const popular = popularRes.data ?? [];
  const trending = trendingRes.data ?? [];

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q: q || undefined,
      type: type || undefined,
      category: category || undefined,
      sort: sort || undefined,
      featured: featured ? 'true' : undefined,
      location: location || undefined,
      brand: brand || undefined,
      tags: tags || undefined,
      minRating: minRating || undefined,
      fuelType: fuelType || undefined,
      vehicleType: vehicleType || undefined,
      loanType: loanType || undefined,
      materialType: materialType || undefined,
    };
    for (const [k, v] of Object.entries({ ...base, ...overrides })) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    // Fresh filter/sort should reset pagination
    if (!('cursor' in overrides)) next.delete('cursor');
    const s = next.toString();
    return s ? `/search?${s}` : '/search';
  }

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
    ...(q ? [{ name: q, url: `/search?q=${encodeURIComponent(q)}` }] : []),
  ]);

  return (
    <main className="site-container py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Search', href: '/search' },
          ...(q ? [{ label: q }] : []),
        ]}
      />
      <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">
        {q ? `Results for “${q}”` : 'Search'}
      </h1>
      <p className="mt-2 text-[var(--varnarc-subtle)]">
        Find articles, calculators, AI tools, finance products, directory listings, and more.
      </p>

      <div className="mt-8 max-w-3xl">
        <SearchAutocomplete initialQuery={q} />
      </div>

      <div className="mt-4 max-w-3xl">
        <SearchAiToggle enabled={aiSearchEnabled} />
      </div>

      <div className="mt-4">
        <SearchRecent />
      </div>

      {!q ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Popular searches</h2>
            <ul className="flex flex-wrap gap-2">
              {popular.map((p) => (
                <li key={p.keyword}>
                  <Link
                    href={`/search?q=${encodeURIComponent(p.keyword)}`}
                    className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
                  >
                    {p.keyword}
                  </Link>
                </li>
              ))}
              {!popular.length ? (
                <li className="text-sm text-[var(--varnarc-subtle)]">No popular searches yet.</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Trending</h2>
            <ul className="flex flex-wrap gap-2">
              {trending.map((p) => (
                <li key={p.keyword}>
                  <Link
                    href={`/search?q=${encodeURIComponent(p.keyword)}`}
                    className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
                  >
                    {p.keyword}
                  </Link>
                </li>
              ))}
              {!trending.length ? (
                <li className="text-sm text-[var(--varnarc-subtle)]">No trending searches yet.</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">
                Content type
              </h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link
                    href={hrefWith({ type: undefined })}
                    className={!type ? 'font-semibold text-[var(--varnarc-brand)]' : 'hover:underline'}
                  >
                    All
                  </Link>
                </li>
                {(data?.facets?.entityTypes ?? []).map((f) => (
                  <li key={f.entityType}>
                    <Link
                      href={hrefWith({ type: f.entityType })}
                      className={
                        type === f.entityType
                          ? 'font-semibold text-[var(--varnarc-brand)]'
                          : 'hover:underline'
                      }
                    >
                      {f.entityType} ({f.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">
                Category
              </h2>
              <ul className="space-y-1 text-sm">
                {(data?.facets?.categories ?? []).slice(0, 12).map((f) => (
                  <li key={f.category}>
                    <Link
                      href={hrefWith({ category: f.category })}
                      className={
                        category === f.category
                          ? 'font-semibold text-[var(--varnarc-brand)]'
                          : 'hover:underline'
                      }
                    >
                      {f.category} ({f.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <form className="space-y-2 text-sm" action="/search" method="get">
              <input type="hidden" name="q" value={q} />
              {type ? <input type="hidden" name="type" value={type} /> : null}
              {sort ? <input type="hidden" name="sort" value={sort} /> : null}
              <label className="block">
                Location
                <input
                  name="location"
                  defaultValue={location}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Brand
                <input
                  name="brand"
                  defaultValue={brand}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Tags
                <input
                  name="tags"
                  defaultValue={tags}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Min rating
                <input
                  name="minRating"
                  defaultValue={minRating}
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Fuel type
                <input
                  name="fuelType"
                  defaultValue={fuelType}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Vehicle type
                <input
                  name="vehicleType"
                  defaultValue={vehicleType}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Loan type
                <input
                  name="loanType"
                  defaultValue={loanType}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="block">
                Material type
                <input
                  name="materialType"
                  defaultValue={materialType}
                  className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-2 py-1.5"
                />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="featured" value="true" defaultChecked={featured} />
                Featured only
              </label>
              <button
                type="submit"
                className="rounded-md bg-[var(--varnarc-accent)] px-3 py-1.5 text-white"
              >
                Apply filters
              </button>
            </form>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--varnarc-subtle)]">
                {results.length} result{results.length === 1 ? '' : 's'}
                {data?.latencyMs != null ? ` · ${data.latencyMs} ms` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <Link
                    key={s.value}
                    href={hrefWith({ sort: s.value })}
                    className={`rounded-md border px-2.5 py-1 text-xs ${
                      sort === s.value
                        ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]'
                        : 'border-[var(--varnarc-border)]'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>

            {results.length ? (
              <ul className="space-y-4">
                {results.map((item) => (
                  <li key={`${item.entityType}-${item.entityId}`}>
                    <SearchResultCard item={item} queryId={data?.queryId} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--varnarc-subtle)]">No results matched “{q}”.</p>
            )}

            {data?.hasMore && data.nextCursor ? (
              <div className="mt-8">
                <Link
                  href={hrefWith({ cursor: data.nextCursor })}
                  className="rounded-md border border-[var(--varnarc-border)] px-4 py-2 text-sm hover:bg-[var(--varnarc-muted)]"
                >
                  Load more
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
