import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totals?: {
    total: number;
    published: number;
    featured: number;
    sponsored: number;
  };
  events?: Record<string, number>;
};

const sections = [
  { href: '/ai-tools/tools', label: 'Tool manager' },
  { href: '/ai-tools/categories', label: 'Categories' },
  { href: '/ai-tools/analytics', label: 'Analytics' },
  { href: '/ai-tools/bookmarks', label: 'Bookmarks' },
];

export default async function AiToolsAdminDashboardPage() {
  const result = await apiServerFetch<AnalyticsData>('/ai-tools/analytics');
  const stats = result.data;
  const totals = stats?.totals;

  return (
    <div>
      <PageHeader
        title="AI Tools"
        description="Catalog tools, categories, bookmarks, and analytics."
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
              { label: 'Total tools', value: totals?.total ?? 0 },
              { label: 'Published', value: totals?.published ?? 0 },
              { label: 'Featured', value: totals?.featured ?? 0 },
              { label: 'Sponsored', value: totals?.sponsored ?? 0 },
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
