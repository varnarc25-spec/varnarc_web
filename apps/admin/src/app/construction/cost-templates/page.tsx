import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionCsvToolbar, ConstructionListSearch } from '@/components/construction-admin-toolbar';
import { ConstructionCostTemplateForm, ConstructionPublishButton } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  category?: string | null;
  formulaReference?: string | null;
};

export default async function ConstructionCostTemplatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<TemplateRow[]>(`/construction/admin/cost-templates?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Cost templates"
        description="Manage cost estimation templates for projects."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ConstructionListSearch defaultValue={params.search} />
      <ConstructionCsvToolbar entity="cost-templates" />
      <ConstructionCostTemplateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load cost templates</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Formula</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.category || '—'}</td>
                  <td className="px-4 py-3">{row.formulaReference || '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <ConstructionPublishButton entity="cost-templates" id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No cost templates yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
