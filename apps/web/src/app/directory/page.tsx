import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
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

const popularLinks = [
  { label: 'Architects', href: '/directory' },
  { label: 'Solar installers', href: '/directory' },
  { label: 'Map view', href: '/directory/map' },
];

export default async function DirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '24' });
  if (params.q) qs.set('search', params.q);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);
  if (params.featured === 'true') qs.set('featured', 'true');

  const [listingsResult, categoriesResult] = await Promise.all([
    apiPublicFetch<Listing[]>(`/directory/search?${qs.toString()}`, {
      next: { revalidate: 60 },
    }).catch(() => ({
      data: [] as Listing[],
    })),
    apiPublicFetch<Category[]>('/directory/categories?limit=24', {
      next: { revalidate: 60 },
    }).catch(() => ({
      data: [] as Category[],
    })),
  ]);

  const listings = Array.isArray(listingsResult.data) ? listingsResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const sponsored = listings.filter((l) => l.sponsored);
  const regular = listings.filter((l) => !l.sponsored);

  const categoryItems = categories.map((c) => ({
    label: c.name,
    description: c._count?.businesses != null ? `${c._count.businesses} listings` : 'Browse',
    href: `/directory/${c.slug}`,
    icon: 'building',
  }));

  const featuredStack = (sponsored.length ? sponsored : listings).slice(0, 3).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.locations?.[0]?.city ?? b.description,
    href: `/directory/${b.slug}`,
  }));

  const navItems = [
    { label: 'Advanced search', href: '/directory/search', description: 'Filters', icon: 'search' },
    { label: 'Map view', href: '/directory/map', description: 'Browse on map', icon: 'map' },
  ];

  return (
    <ModuleHubShell
      moduleKey="directory"
      title="Find trusted businesses & professionals"
      description="Search dealers, contractors, and service providers near you."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Directory' }]}
      popularLinks={popularLinks}
      searchPath="/directory/search"
      overviewTitle="Directory overview"
    >
      <DirectorySearchForm
        initialSearch={params.q}
        initialCity={params.city}
        initialCategory={params.category}
        action="/directory/search"
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/directory/search" className="font-semibold text-blue-600 hover:underline">
          Advanced search
        </Link>
        <Link href="/directory/map" className="font-semibold text-blue-600 hover:underline">
          Map view
        </Link>
      </div>

      {categoryItems.length ? (
        <section>
          <HubSectionHeader title="Browse categories" />
          <HubIconGrid items={categoryItems} columns={4} />
        </section>
      ) : null}

      <section>
        <HubSectionHeader title="Directory tools" />
        <HubIconGrid items={navItems} columns={4} />
      </section>

      {featuredStack.length ? (
        <HubFeaturedStack
          title="Featured listings"
          items={featuredStack}
          viewAllHref="/directory/search"
        />
      ) : null}

      <section>
        <HubSectionHeader title="Business listings" />
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
          <EmptyState
            title="No businesses found"
            message="Try another city, category, or search term."
          />
        )}
      </section>
    </ModuleHubShell>
  );
}
