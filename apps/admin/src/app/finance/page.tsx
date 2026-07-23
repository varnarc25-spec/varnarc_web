import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type DashboardData = {
  categories: number;
  banksPublished: number;
  loansPublished: number;
  creditCardsPublished: number;
  insurancePublished: number;
  investmentsPublished: number;
  ratesTracked: number;
};

const sections = [
  { href: '/finance/banks', label: 'Banks' },
  { href: '/finance/loans', label: 'Loans' },
  { href: '/finance/credit-cards', label: 'Credit cards' },
  { href: '/finance/insurance', label: 'Insurance' },
  { href: '/finance/investments', label: 'Investments' },
  { href: '/finance/rates', label: 'Interest rates' },
  { href: '/finance/affiliates', label: 'Affiliates' },
  { href: '/finance/comparisons', label: 'Comparisons' },
  { href: '/finance/faqs', label: 'FAQs' },
  { href: '/finance/glossary', label: 'Glossary' },
  { href: '/finance/feeds', label: 'Rate feeds' },
];

export default async function FinanceAdminDashboardPage() {
  const result = await apiServerFetch<DashboardData>('/finance/dashboard');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Manage banks, loans, cards, insurance, investments, and interest rates."
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Categories', value: stats?.categories ?? 0 },
              { label: 'Published banks', value: stats?.banksPublished ?? 0 },
              { label: 'Published loans', value: stats?.loansPublished ?? 0 },
              { label: 'Published cards', value: stats?.creditCardsPublished ?? 0 },
              { label: 'Published insurance', value: stats?.insurancePublished ?? 0 },
              { label: 'Published investments', value: stats?.investmentsPublished ?? 0 },
              { label: 'Rates tracked', value: stats?.ratesTracked ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <div className="text-xs text-[var(--varnarc-subtle)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
              >
                <div className="font-medium text-[var(--varnarc-brand)]">{section.label}</div>
                <div className="mt-1 text-xs text-[var(--varnarc-subtle)]">Manage {section.label.toLowerCase()}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
