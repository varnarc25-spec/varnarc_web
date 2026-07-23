import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { CalculatorCard } from '@/components/business/calculator-card';
import { fetchCalculators } from '@/services/content';
import { quickTools } from '@/features/home/static-data';

export const metadata: Metadata = {
  title: 'Calculators',
  description: 'Finance and planning calculators.',
  alternates: { canonical: '/calculators' },
};

export const revalidate = 60;

export default async function CalculatorsPage() {
  const { data } = await fetchCalculators(24);
  const items = data.length
    ? data.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }))
    : quickTools.map((t) => ({
        id: t.href,
        name: t.name,
        slug: t.href.replace('/calculators/', ''),
        description: 'Popular calculator',
      }));

  return (
    <ContentLayout
      title="Calculators"
      description="Finance, home, auto, and planning calculators."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Calculators' }]}
    >
      {items.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((c) => (
            <CalculatorCard key={c.id} name={c.name} slug={c.slug} description={c.description} />
          ))}
        </div>
      ) : (
        <EmptyState title="No calculators yet" message="Published calculators will appear here." />
      )}
    </ContentLayout>
  );
}
