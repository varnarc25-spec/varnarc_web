import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchComparisons } from '@/services/content';

export const metadata: Metadata = {
  title: 'Product Comparisons',
  description: 'Side-by-side product and service comparisons.',
  alternates: { canonical: '/compare/products' },
};

export const revalidate = 60;

export default async function CompareProductsPage() {
  const { data } = await fetchComparisons(50, { comparisonType: 'product' });

  if (!data.length) {
    const { data: all } = await fetchComparisons(50);
    if (!all.length) redirect('/compare');
  }

  return (
    <ContentLayout
      title="Product comparisons"
      description="Compare paints, loans, appliances, materials, and more."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Compare', href: '/compare' },
        { label: 'Products' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Link
              key={c.id}
              href={`/compare/${c.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-sm font-extrabold text-[#0b1f3a]">{c.title}</h2>
              <p className="mt-2 text-xs text-slate-500">{c._count?.items ?? 0} items compared</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No product comparisons yet" message="Browse all comparisons instead." />
      )}
    </ContentLayout>
  );
}
