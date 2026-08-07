import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceInvestments } from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('investments');
}

export const revalidate = 60;

export default async function FinanceInvestmentsPage() {
  const [page, { data }] = await Promise.all([
    getFinancePageContent('investments'),
    fetchFinanceInvestments({ limit: 48 }),
  ]);

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
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
        <EmptyState
          title="No investments yet"
          message="Published investment products will appear here."
        />
      )}

      <RelatedCalculators links={[{ href: '/calculators/sip', label: 'SIP Calculator' }]} />
    </ContentLayout>
  );
}
