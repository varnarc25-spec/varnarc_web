import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AdBanner } from '@/components/business/ad-banner';
import { DirectoryBrowseResults } from '@/components/directory/directory-browse-results';
import { DirectoryExploreCategories } from '@/components/directory/directory-explore';
import { DirectoryHeroSearch } from '@/components/directory/directory-hero-search';
import { DirectoryHeroVisual } from '@/components/directory/directory-hero-visual';
import { DirectoryHowItWorks } from '@/components/directory/directory-how-it-works';
import { DirectoryPopularServices } from '@/components/directory/directory-popular-services';
import { DirectoryProviderCard } from '@/components/directory/directory-provider-card';
import { DirectoryProviderCta } from '@/components/directory/directory-provider-cta';
import { DirectoryTrustSection } from '@/components/directory/directory-trust';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import {
  buildPopularServices,
  DIRECTORY_CROSS_LINKS,
  groupCategoriesByVertical,
  type DirectoryCategory,
  type DirectoryListing,
} from '@/lib/directory-hub';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Find Local Businesses & Service Providers | Varnarc',
  description:
    'Find local architects, contractors, solar installers, automobile service providers and other businesses by service and location on Varnarc.',
  alternates: { canonical: '/directory' },
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
  searchParams: Promise<{ q?: string; city?: string; category?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '24' });
  if (params.q) qs.set('search', params.q);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);

  const [listingsResult, categoriesResult, featuredResult, mapResult] = await Promise.all([
    apiPublicFetch<DirectoryListing[]>(`/directory/search?${qs.toString()}`, {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as DirectoryListing[] })),
    apiPublicFetch<DirectoryCategory[]>('/directory/categories?limit=100', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as DirectoryCategory[] })),
    apiPublicFetch<DirectoryListing[]>('/directory/search?featured=true&limit=8', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as DirectoryListing[] })),
    apiPublicFetch<Marker[]>('/directory/map?limit=40', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as Marker[] })),
  ]);

  const listings = Array.isArray(listingsResult.data) ? listingsResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const featuredRaw = Array.isArray(featuredResult.data) ? featuredResult.data : [];
  const markers = Array.isArray(mapResult.data) ? mapResult.data : [];

  const featured = featuredRaw.filter((l) => l.featured || l.sponsored);
  const popularServices = buildPopularServices(categories, 8);
  const exploreGroups = groupCategoriesByVertical(categories);
  const heroPopular = popularServices.slice(0, 4).map((s) => ({ name: s.name, slug: s.slug }));
  const heroListings = (featured.length ? featured : listings).slice(0, 3);
  const browseListings = listings.filter((l) => !l.sponsored).length
    ? listings.filter((l) => !l.sponsored)
    : listings;

  const hasActiveSearch = Boolean(params.q || params.city || params.category);

  return (
    <main className="bg-[#f4f7fb] text-slate-950">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${SITE}/` },
          { name: 'Directory', url: `${SITE}/directory` },
        ])}
      />

      <header className="border-b border-slate-200/80 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_55%),linear-gradient(180deg,#ffffff_0%,#f4f7fb_100%)]">
        <div className="site-container pb-10 pt-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[13px] text-slate-500"
          >
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <span aria-hidden>›</span>
            <span className="font-medium text-slate-700">Directory</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-emerald-800">
                Business Directory
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.1]">
                Find professionals near you.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Discover local professionals, businesses and service providers by service, location
                and availability.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Compare relevant providers, review important details and contact the right business
                for your needs.
              </p>

              <div className="mt-7">
                <DirectoryHeroSearch
                  initialQuery={params.q}
                  initialCity={params.city}
                  popular={heroPopular}
                />
              </div>
            </div>

            <DirectoryHeroVisual listings={heroListings} cityHint={params.city} />
          </div>
        </div>
      </header>

      <div className="site-container space-y-14 py-10 sm:py-12">
        <DirectoryPopularServices services={popularServices} />

        <AdBanner slot="content-top" collapseWhenEmpty />

        {featured.length ? (
          <section aria-labelledby="directory-featured-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2
                  id="directory-featured-heading"
                  className="text-2xl font-extrabold tracking-tight text-slate-950"
                >
                  Featured providers
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Featured and sponsored placements are labeled. Sponsored does not mean editorial
                  endorsement.
                </p>
              </div>
              <Link
                href="/directory/search?featured=true"
                className="hidden text-sm font-semibold text-blue-700 hover:underline sm:inline"
              >
                View all
              </Link>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {featured.map((listing) => (
                <li key={listing.id}>
                  <DirectoryProviderCard listing={listing} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <DirectoryBrowseResults
          listings={browseListings.slice(0, 12)}
          markers={markers}
          title={hasActiveSearch ? 'Search results' : 'Providers near you'}
          emptyTitle="No providers found for this search yet"
          emptyMessage="Try another service, city, or browse popular services above."
        />

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/directory/search"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 hover:bg-slate-50"
          >
            Advanced search
          </Link>
          {markers.length ? (
            <Link
              href="/directory/map"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Full map view
            </Link>
          ) : null}
        </div>

        <DirectoryExploreCategories groups={exploreGroups} />

        <section aria-labelledby="directory-cross-heading">
          <h2
            id="directory-cross-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Continue from other Varnarc tools
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Research and calculate first, then find providers you can contact.
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {DIRECTORY_CROSS_LINKS.map((item) => (
              <li key={item.href} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-semibold">
                  <Link href={item.href} className="text-slate-700 hover:underline">
                    Open tool
                  </Link>
                  <Link
                    href={item.directoryHref}
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                  >
                    {item.cta}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <DirectoryHowItWorks />
        <DirectoryProviderCta />
        <DirectoryTrustSection />
      </div>
    </main>
  );
}
