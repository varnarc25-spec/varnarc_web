import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionChecklistForm } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type ChecklistRow = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  projectType?: string | null;
  status?: string | null;
  itemCount?: number;
};

export default async function ConstructionChecklistsAdminPage() {
  const result = await apiServerFetch<ChecklistRow[]>('/construction/admin/checklists');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Construction checklists"
        description="Publish material and milestone checklists for the project planner."
        actions={<Badge>{rows.length} checklists</Badge>}
      />

      <ConstructionChecklistForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load checklists</CardTitle>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{row.title}</div>
                <Badge>{row.status ?? 'PUBLISHED'}</Badge>
              </div>
              <div className="mt-1 text-xs text-[var(--varnarc-subtle)]">
                {row.projectType || 'General'} · {row.itemCount ?? 0} items · {row.slug}
              </div>
              {row.description ? (
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{row.description}</p>
              ) : null}
              <Link
                href={`/construction/checklists/${row.slug}`}
                className="mt-2 inline-block text-sm text-[var(--varnarc-brand)] hover:underline"
                target="_blank"
              >
                Open public checklist
              </Link>
            </div>
          ))}
          {!rows.length ? (
            <p className="py-8 text-center text-[var(--varnarc-subtle)]">No checklists yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
