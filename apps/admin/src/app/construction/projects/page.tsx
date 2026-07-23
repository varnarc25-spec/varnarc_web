import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionCsvToolbar } from '@/components/construction-admin-toolbar';
import { apiServerFetch } from '@/lib/api';

type ProjectRow = {
  id: string;
  name: string;
  projectType?: string | null;
  estimatedCost?: number | string | null;
  createdAt?: string;
  user?: { email?: string | null; displayName?: string | null } | null;
};

export default async function ConstructionProjectsAdminPage() {
  const result = await apiServerFetch<ProjectRow[]>('/construction/admin/projects?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="View user construction planning projects."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <ConstructionCsvToolbar entity="projects" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load projects</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Est. cost</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.projectType || '—'}</td>
                  <td className="px-4 py-3">
                    {row.estimatedCost != null ? `₹${row.estimatedCost}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.user?.displayName || row.user?.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No projects yet.
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
