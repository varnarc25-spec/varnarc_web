import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceCreditCards } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Credit Cards',
  description: 'Compare rewards, fees, and benefits across credit cards.',
  alternates: { canonical: '/finance/credit-cards' },
};

export const revalidate = 60;

export default async function FinanceCreditCardsPage() {
  const { data } = await fetchFinanceCreditCards({ limit: 48 });

  return (
    <ContentLayout
      title="Credit cards"
      description="Find cards with the best rewards, cashback, and lounge access."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Credit cards' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((card) => (
            <FinanceProductCard
              key={card.id}
              name={card.name}
              href={`/finance/credit-cards/${card.id}`}
              description={card.description}
              meta={
                [
                  card.bank?.name,
                  card.annualFee != null ? `Annual fee: ${card.annualFee}` : 'No annual fee info',
                ]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              featured={card.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No credit cards yet" message="Published credit card products will appear here." />
      )}

      <RelatedCalculators links={[{ href: '/calculators/income-tax', label: 'Income Tax Calculator' }]} />
    </ContentLayout>
  );
}
