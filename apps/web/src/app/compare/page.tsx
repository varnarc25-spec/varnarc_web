import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchComparisons } from '@/services/content';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Side-by-side product and service comparisons.',
  alternates: { canonical: '/compare' },
};

export const revalidate = 60;

const popularLinks = [
  { label: 'Products', href: '/compare/products' },
  { label: 'Cars', href: '/compare/cars' },
  { label: 'Solar panels', href: '/compare/mono-vs-poly-solar' },
];

const demoLinks = [
  {
    label: 'Demo: products',
    href: '/compare/products',
    description: 'Sample comparison',
    icon: 'grid',
  },
  { label: 'Demo: cars', href: '/compare/cars', description: 'Vehicle specs', icon: 'car' },
  {
    label: 'Finance compare',
    href: '/finance/compare',
    description: 'Loans & cards',
    icon: 'scale',
  },
  { label: 'Auto compare', href: '/automobile/compare', description: 'Vehicles', icon: 'fuel' },
];

export default async function CompareIndexPage() {
  const { data } = await fetchComparisons(50);

  const comparisonItems = data.map((c) => ({
    label: c.title,
    description: `${c._count?.items ?? 0} items`,
    href: `/compare/${c.slug}`,
    icon: 'scale',
  }));

  return (
    <ModuleHubShell
      moduleKey="compare"
      title="Side-by-side comparisons"
      description="Structured comparisons for products, services, and everyday decisions — backed by clear attributes."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Compare' }]}
      popularLinks={popularLinks}
      overviewTitle="Compare overview"
    >
      {comparisonItems.length ? (
        <section>
          <HubSectionHeader title="Published comparisons" />
          <HubIconGrid items={comparisonItems} columns={3} />
        </section>
      ) : (
        <EmptyState
          title="No published comparisons yet"
          message="Demo comparisons remain available while CMS data is seeded."
        />
      )}

      <section>
        <HubSectionHeader title="More ways to compare" />
        <HubIconGrid items={demoLinks} columns={4} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/compare/products"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Demo: products
        </Link>
        <Link
          href="/compare/cars"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-blue-300"
        >
          Demo: cars
        </Link>
      </div>
    </ModuleHubShell>
  );
}
