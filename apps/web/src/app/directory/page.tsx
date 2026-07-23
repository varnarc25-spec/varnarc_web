import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { DirectoryListingCard } from '@/components/directory/directory-listing-card';
import { DirectorySearchForm } from '@/components/directory/directory-widgets';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Business Directory',
  description: 'Find trusted businesses, professionals, and service providers on Varnarc.',
  alternates: { canonical: '/directory' },
};

export const revalidate = 60;

type Listing = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  verificationStatus?: string;
  locations?: Array<{ city: string; country: string }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  _count?: { businesses: number };
};

type Props = {
  searchParams: Promise<{ q?: string; city?: string; category?: string; featured?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '24' });
  if (params.q) qs.set('search', params.q);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);
  if (params.featured === 'true') qs.set('featured', 'true');

  const [listingsResult, categoriesResult] = await Promise.all([
    apiPublicFetch<Listing[]>(`/directory/search?${qs.toString()}`, { next: { revalidate: 60 } }).catch(() => ({
      data: [] as Listing[],
    })),
    apiPublicFetch<Category[]>('/directory/categories?limit=24', { next: { revalidate: 60 } }).catch(() => ({
      data: [] as Category[],
    })),
  ]);

  const listings = Array.isArray(listingsResult.data) ? listingsResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const sponsored = listings.filter((l) => l.sponsored);
  const regular = listings.filter((l) => !l.sponsored);

  return (
    <ContentLayout
      title="Business Directory"
      description="Find trusted professionals and local businesses."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Directory' }]}
    >
      <DirectorySearchForm
        initialSearch={params.q}
        initialCity={params.city}
        initialCategory={params.category}
        action="/directory/search"
      />

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/directory/search" className="text-[var(--varnarc-brand)] hover:underline">
          Advanced search
        </Link>
        <Link href="/directory/map" className="text-[var(--varnarc-brand)] hover:underline">
          Map view
        </Link>
      </div>

      {categories.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/directory/${c.slug}`}
                className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
              >
                {c.name}
                {c._count?.businesses != null ? (
                  <span className="ml-1 text-[var(--varnarc-subtle)]">({c._count.businesses})</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sponsored.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Sponsored</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {sponsored.map((b) => (
              <DirectoryListingCard
                key={b.id}
                name={b.name}
                slug={b.slug}
                description={b.description}
                city={b.locations?.[0]?.city}
                sponsored
                verified={b.verificationStatus === 'VERIFIED'}
                featured={b.featured}
              />
            ))}
          </div>
        </section>
      ) : null}

      {regular.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {regular.map((b) => (
            <DirectoryListingCard
              key={b.id}
              name={b.name}
              slug={b.slug}
              description={b.description}
              city={b.locations?.[0]?.city}
              verified={b.verificationStatus === 'VERIFIED'}
              featured={b.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No businesses found" message="Try another city, category, or search term." />
      )}
    </ContentLayout>
  );
}
