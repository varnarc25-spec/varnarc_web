import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { DirectoryListingCard } from '@/components/directory/directory-listing-card';
import { apiPublicFetch } from '@/services/api-client';

type Props = {
  params: Promise<{ slug: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, city } = await params;
  const cityLabel = city.replace(/-/g, ' ');
  const title = `${slug.replace(/-/g, ' ')} in ${cityLabel}`;
  return {
    title,
    description: `Browse ${title} on Varnarc Directory.`,
    alternates: { canonical: `/directory/${slug}/${city}` },
  };
}

export const revalidate = 60;

export default async function DirectoryCategoryCityPage({ params }: Props) {
  const { slug, city } = await params;
  const cityLabel = city.replace(/-/g, ' ');

  const { data: listings } = await apiPublicFetch<
    Array<{ id: string; name: string; slug: string; description?: string | null }>
  >(`/directory/search?category=${encodeURIComponent(slug)}&city=${encodeURIComponent(cityLabel)}&limit=48`, {
    next: { revalidate: 60 },
  }).catch(() => ({ data: [] as Array<{ id: string; name: string; slug: string; description?: string | null }> }));

  const items = Array.isArray(listings) ? listings : [];

  return (
    <ContentLayout
      title={`${slug.replace(/-/g, ' ')} in ${cityLabel}`}
      description={`Local listings for ${cityLabel}.`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Directory', href: '/directory' },
        { label: slug.replace(/-/g, ' '), href: `/directory/${slug}` },
        { label: cityLabel },
      ]}
    >
      {items.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((b) => (
            <DirectoryListingCard key={b.id} name={b.name} slug={b.slug} description={b.description} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No listings in this city"
          message={`No results for ${cityLabel}. Browse the full category instead.`}
          action={
            <Link href={`/directory/${slug}`} className="text-[var(--varnarc-brand)] hover:underline">
              Browse all {slug.replace(/-/g, ' ')}
            </Link>
          }
        />
      )}
    </ContentLayout>
  );
}
