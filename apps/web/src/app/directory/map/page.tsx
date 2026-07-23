import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { DirectoryMapView } from '@/components/directory/directory-map-view';
import { DirectorySearchForm } from '@/components/directory/directory-widgets';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Directory Map',
  description: 'Explore businesses on an interactive map.',
  alternates: { canonical: '/directory/map' },
};

export const revalidate = 60;

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
  searchParams: Promise<{ city?: string; category?: string }>;
};

export default async function DirectoryMapPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '200' });
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);

  const { data: markers } = await apiPublicFetch<Marker[]>(`/directory/map?${qs.toString()}`, {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as Marker[] }));

  const items = Array.isArray(markers) ? markers : [];

  return (
    <ContentLayout
      title="Directory Map"
      description="Browse listings with geolocation on the map."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Directory', href: '/directory' },
        { label: 'Map' },
      ]}
    >
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/directory/search" className="text-[var(--varnarc-brand)] hover:underline">
          Search results
        </Link>
        <Link href="/directory" className="text-[var(--varnarc-brand)] hover:underline">
          Directory home
        </Link>
      </div>

      <DirectorySearchForm initialCity={params.city} initialCategory={params.category} action="/directory/map" />

      <DirectoryMapView markers={items} />
    </ContentLayout>
  );
}
