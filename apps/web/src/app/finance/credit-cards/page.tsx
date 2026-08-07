import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceCreditCards } from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('credit-cards');
}

export const revalidate = 60;

export default async function FinanceCreditCardsPage() {
  const [page, { data }] = await Promise.all([
    getFinancePageContent('credit-cards'),
    fetchFinanceCreditCards({ limit: 48 }),
  ]);

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
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
        <EmptyState
          title="No credit cards yet"
          message="Published credit card products will appear here."
        />
      )}

      <RelatedCalculators
        links={[{ href: '/calculators/income-tax', label: 'Income Tax Calculator' }]}
      />
    </ContentLayout>
  );
}
