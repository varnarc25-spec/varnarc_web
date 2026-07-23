import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceInsurance } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Insurance',
  description: 'Compare health, life, and motor insurance products.',
  alternates: { canonical: '/finance/insurance' },
};

export const revalidate = 60;

export default async function FinanceInsurancePage() {
  const { data } = await fetchFinanceInsurance({ limit: 48 });

  return (
    <ContentLayout
      title="Insurance"
      description="Review coverage, premiums, and benefits from leading providers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Insurance' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <FinanceProductCard
              key={item.id}
              name={item.name}
              href={`/finance/insurance/${item.id}`}
              description={item.coverage ?? item.benefits}
              meta={[item.providerName, item.premium != null ? `Premium: ${item.premium}` : null].filter(Boolean).join(' · ') || null}
              featured={item.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No insurance products yet" message="Published insurance products will appear here." />
      )}

      <RelatedCalculators links={[{ href: '/calculators/income-tax', label: 'Income Tax Calculator' }]} />
    </ContentLayout>
  );
}
