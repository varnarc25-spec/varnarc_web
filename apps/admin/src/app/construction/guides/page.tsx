import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionGuideForm } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type GuideRow = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  category?: string | null;
  status?: string;
};

export default async function ConstructionGuidesAdminPage() {
  const result = await apiServerFetch<GuideRow[]>('/construction/admin/guides?limit=100');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Construction guides"
        description="Manage buying guides and educational content."
        actions={<Badge>{rows.length} entries</Badge>}
      />

      <ConstructionGuideForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load guides</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {row.category ? (
                    <div className="text-xs font-medium uppercase text-[var(--varnarc-subtle)]">{row.category}</div>
                  ) : null}
                  <div className="font-medium">{row.title}</div>
                  <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                </div>
                {row.status ? <Badge>{row.status}</Badge> : null}
              </div>
              {row.summary ? (
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{row.summary}</p>
              ) : null}
              <Link
                href={`/construction/guides/${row.slug}`}
                className="mt-2 inline-block text-sm text-[var(--varnarc-brand)] hover:underline"
              >
                View slug →
              </Link>
            </div>
          ))}
          {!rows.length ? (
            <p className="py-8 text-center text-[var(--varnarc-subtle)]">No guides yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
