import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  total: number;
  published: number;
  draft: number;
  templateCount: number;
};

const sections = [
  { href: '/comparisons/list', label: 'All comparisons' },
  { href: '/comparisons/templates', label: 'Templates' },
  { href: '/comparisons/analytics', label: 'Analytics' },
];

export default async function ComparisonsAdminDashboardPage() {
  const result = await apiServerFetch<AnalyticsData>('/comparisons/analytics');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Comparisons"
        description="Generic comparison engine for products, vehicles, finance, and more."
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
              { label: 'Total comparisons', value: stats?.total ?? 0 },
              { label: 'Published', value: stats?.published ?? 0 },
              { label: 'Drafts', value: stats?.draft ?? 0 },
              { label: 'Templates', value: stats?.templateCount ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <p className="text-sm text-[var(--varnarc-subtle)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
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
                <p className="font-medium">{section.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
