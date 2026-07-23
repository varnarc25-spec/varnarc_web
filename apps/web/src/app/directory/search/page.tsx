import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { DirectoryListingCard } from '@/components/directory/directory-listing-card';
import { DirectorySearchForm } from '@/components/directory/directory-widgets';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Directory Search',
  description: 'Search businesses, professionals, and service providers.',
  alternates: { canonical: '/directory/search' },
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

type Props = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    category?: string;
    verified?: string;
    featured?: string;
    sponsored?: string;
    openNow?: string;
    topRated?: string;
    sort?: string;
  }>;
};

export default async function DirectorySearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '24' });
  if (params.q) qs.set('search', params.q);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);
  if (params.verified === 'true') qs.set('verified', 'true');
  if (params.featured === 'true') qs.set('featured', 'true');
  if (params.sponsored === 'true') qs.set('sponsored', 'true');
  if (params.openNow === 'true') qs.set('openNow', 'true');
  if (params.topRated === 'true') qs.set('topRated', 'true');
  if (params.sort) qs.set('sort', params.sort);

  const { data: listings } = await apiPublicFetch<Listing[]>(`/directory/search?${qs.toString()}`, {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as Listing[] }));

  const items = Array.isArray(listings) ? listings : [];

  return (
    <ContentLayout
      title="Search Directory"
      description="Find businesses by name, category, city, and filters."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Directory', href: '/directory' },
        { label: 'Search' },
      ]}
    >
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/directory" className="text-[var(--varnarc-brand)] hover:underline">
          ← Directory home
        </Link>
        <Link href="/directory/map" className="text-[var(--varnarc-brand)] hover:underline">
          Map view
        </Link>
      </div>

      <DirectorySearchForm
        initialSearch={params.q}
        initialCity={params.city}
        initialCategory={params.category}
        initialVerified={params.verified === 'true'}
        initialFeatured={params.featured === 'true'}
        initialSponsored={params.sponsored === 'true'}
        initialOpenNow={params.openNow === 'true'}
        initialTopRated={params.topRated === 'true'}
        initialSort={params.sort ?? ''}
      />

      {items.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((b) => (
            <DirectoryListingCard
              key={b.id}
              name={b.name}
              slug={b.slug}
              description={b.description}
              city={b.locations?.[0]?.city}
              featured={b.featured}
              sponsored={b.sponsored}
              verified={b.verificationStatus === 'VERIFIED'}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No results" message="Try adjusting your search or filters." />
      )}
    </ContentLayout>
  );
}
