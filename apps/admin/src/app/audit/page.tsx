import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; email: string; displayName: string | null } | null;
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.entity) qs.set('entity', params.entity);
  if (params.action) qs.set('action', params.action);

  const result = await apiServerFetch<AuditRow[]>(`/audit-logs?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Track admin actions, data changes, and security-relevant events."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="entity"
          defaultValue={params.entity || ''}
          placeholder="Entity (e.g. User)"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <input
          name="action"
          defaultValue={params.action || ''}
          placeholder="Action (e.g. update)"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load audit logs</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.user?.displayName || row.user?.email || '—'}</div>
                    {row.user?.email && row.user?.displayName ? (
                      <div className="text-xs text-[var(--varnarc-subtle)]">{row.user.email}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {row.entity}
                    {row.entityId ? (
                      <div className="font-mono text-xs">{row.entityId}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No audit entries match these filters.
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
