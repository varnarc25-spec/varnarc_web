import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { apiPublicFetch } from '@/services/api-client';
import { ArticlesQueryGrid } from '@/features/articles/articles-query-grid';
import { SubscribeButton } from '@/components/subscribe-button';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<{ name: string; description?: string | null }>(
      `/categories/slug/${slug}`,
      { cache: 'no-store' },
    );
    return {
      title: data.name,
      description: data.description ?? undefined,
      alternates: { canonical: `/categories/${slug}` },
    };
  } catch {
    return { title: slug, alternates: { canonical: `/categories/${slug}` } };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let name = slug;
  let description: string | undefined;
  try {
    const { data } = await apiPublicFetch<{ name: string; description?: string | null }>(
      `/categories/slug/${slug}`,
      { cache: 'no-store' },
    );
    name = data.name;
    description = data.description ?? undefined;
  } catch {
    description = 'Category content will appear as CMS taxonomy expands.';
  }

  return (
    <PageShell
      title={name}
      description={description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/tags' },
        { label: name },
      ]}
    >
      <div className="mb-6">
        <SubscribeButton
          subscriptionType="category"
          target={slug}
          label={`Follow ${name}`}
        />
      </div>
      <ArticlesQueryGrid limit={6} />
    </PageShell>
  );
}
