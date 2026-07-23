import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ComparisonTemplateForm } from '@/components/comparison-forms';
import { apiServerFetch } from '@/lib/api';

type TemplateRow = {
  id: string;
  name: string;
  entityType: string;
  description?: string | null;
};

export default async function ComparisonTemplatesAdminPage() {
  const result = await apiServerFetch<TemplateRow[]>('/comparisons/templates?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader title="Comparison templates" description="Reusable attribute layouts by entity type." />

      <ComparisonTemplateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load templates</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Entity type</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.entityType}</td>
                  <td className="px-4 py-3">{row.description || '—'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No templates yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
        <Link href="/comparisons" className="text-[var(--varnarc-brand)] hover:underline">
          Back to comparisons dashboard
        </Link>
      </p>
    </div>
  );
}
