import type { Metadata } from 'next';
import Link from 'next/link';
import { DirectoryBrowseResults } from '@/components/directory/directory-browse-results';
import { DirectorySearchForm } from '@/components/directory/directory-widgets';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import type { DirectoryListing } from '@/lib/directory-hub';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Search Local Providers | Varnarc Directory',
  description:
    'Search businesses, professionals, and service providers by service, location and filters.',
  alternates: { canonical: '/directory/search' },
};

export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

type Marker = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city?: string;
  address?: string;
  sponsored?: boolean;
  featured?: boolean;
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
  if (params.sort && params.sort !== 'relevance') qs.set('sort', params.sort);

  const mapQs = new URLSearchParams({ limit: '80' });
  if (params.city) mapQs.set('city', params.city);
  if (params.category) mapQs.set('category', params.category);

  const [listingsResult, mapResult] = await Promise.all([
    apiPublicFetch<DirectoryListing[]>(`/directory/search?${qs.toString()}`, {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as DirectoryListing[] })),
    apiPublicFetch<Marker[]>(`/directory/map?${mapQs.toString()}`, {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as Marker[] })),
  ]);

  const items = Array.isArray(listingsResult.data) ? listingsResult.data : [];
  const markers = Array.isArray(mapResult.data) ? mapResult.data : [];

  const queryLabel = [params.q, params.city].filter(Boolean).join(' in ');

  return (
    <main className="bg-[#f4f7fb] text-slate-950">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE}/` },
          { name: 'Directory', url: `${SITE}/directory` },
          { name: 'Search', url: `${SITE}/directory/search` },
        ])}
      />

      <div className="site-container py-8 sm:py-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500"
        >
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span aria-hidden>›</span>
          <Link href="/directory" className="hover:text-slate-900">
            Directory
          </Link>
          <span aria-hidden>›</span>
          <span className="font-medium text-slate-700">Search</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-emerald-800">
            Directory search
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {queryLabel ? `Results for ${queryLabel}` : 'Search providers'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Refine by location, verification and other filters supported by listing data.
          </p>
        </header>

        <div className="mt-6">
          <DirectorySearchForm
            secondary
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
        </div>

        <div className="mt-10">
          <DirectoryBrowseResults
            listings={items}
            markers={markers}
            title={
              items.length
                ? `${items.length} provider${items.length === 1 ? '' : 's'}`
                : 'No matching providers'
            }
            emptyTitle={
              params.q || params.city || params.category
                ? `No ${params.q || params.category || 'providers'} found${params.city ? ` in ${params.city}` : ''} yet.`
                : 'No providers found'
            }
            emptyMessage="Try increasing your search area, changing location, or browsing nearby categories."
          />
        </div>

        <p className="mt-8 text-sm">
          <Link href="/directory" className="font-semibold text-blue-700 hover:underline">
            ← Directory home
          </Link>
          {markers.length ? (
            <>
              {' · '}
              <Link href="/directory/map" className="font-semibold text-blue-700 hover:underline">
                Full map view
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </main>
  );
}
