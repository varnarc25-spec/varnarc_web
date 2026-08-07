import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceLoans } from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('loans');
}

export const revalidate = 60;

export default async function FinanceLoansPage() {
  const [page, { data }] = await Promise.all([
    getFinancePageContent('loans'),
    fetchFinanceLoans({ limit: 48 }),
  ]);

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Loans' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((loan) => (
            <FinanceProductCard
              key={loan.id}
              name={loan.name}
              href={`/finance/loans/${loan.id}`}
              description={loan.description}
              meta={
                [
                  loan.bank?.name,
                  loan.loanType,
                  loan.interestRate != null ? `${loan.interestRate}% p.a.` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              featured={loan.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No loans yet" message="Published loan products will appear here." />
      )}

      <RelatedCalculators
        links={[
          { href: '/calculators/emi', label: 'EMI Calculator' },
          { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
        ]}
      />
    </ContentLayout>
  );
}
