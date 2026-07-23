import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceInvestments } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Investments',
  description: 'Compare mutual funds, FDs, and other investment products.',
  alternates: { canonical: '/finance/investments' },
};

export const revalidate = 60;

export default async function FinanceInvestmentsPage() {
  const { data } = await fetchFinanceInvestments({ limit: 48 });

  return (
    <ContentLayout
      title="Investments"
      description="Explore expected returns, risk levels, and lock-in periods."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Investments' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <FinanceProductCard
              key={item.id}
              name={item.name}
              href={`/finance/investments/${item.id}`}
              description={item.lockInPeriod ? `Lock-in: ${item.lockInPeriod}` : undefined}
              meta={
                [
                  item.providerName,
                  item.expectedReturn != null ? `${item.expectedReturn}% expected` : null,
                  item.riskLevel,
                ]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              featured={item.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No investments yet" message="Published investment products will appear here." />
      )}

      <RelatedCalculators links={[{ href: '/calculators/sip', label: 'SIP Calculator' }]} />
    </ContentLayout>
  );
}
