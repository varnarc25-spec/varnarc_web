import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type SummaryData = {
  categories?: number;
  materialsPublished?: number;
  brandsPublished?: number;
  costTemplatesPublished?: number;
  projectsCount?: number;
  guidesPublished?: number;
  faqsPublished?: number;
  comparisonsCount?: number;
  suppliersLinked?: number;
};

const exportEntities = ['materials', 'brands', 'cost-templates', 'projects'] as const;

export default async function ConstructionReportsAdminPage() {
  const result = await apiServerFetch<SummaryData>('/construction/admin/reports/summary');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Construction reports"
        description="Module summary stats and CSV export links."
        actions={<Badge>Summary</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load summary</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Categories', value: stats?.categories ?? 0 },
              { label: 'Published materials', value: stats?.materialsPublished ?? 0 },
              { label: 'Published brands', value: stats?.brandsPublished ?? 0 },
              { label: 'Cost templates', value: stats?.costTemplatesPublished ?? 0 },
              { label: 'User projects', value: stats?.projectsCount ?? 0 },
              { label: 'Guides', value: stats?.guidesPublished ?? 0 },
              { label: 'FAQs', value: stats?.faqsPublished ?? 0 },
              { label: 'Saved comparisons', value: stats?.comparisonsCount ?? 0 },
              { label: 'Linked suppliers', value: stats?.suppliersLinked ?? 0 },
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

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--varnarc-brand)]">CSV exports</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {exportEntities.map((entity) => (
                <Link
                  key={entity}
                  href={`/api/admin/construction/export/${entity}`}
                  className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
                >
                  <div className="font-medium capitalize">{entity.replace(/-/g, ' ')}</div>
                  <div className="mt-1 text-xs text-[var(--varnarc-subtle)]">Download CSV</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
