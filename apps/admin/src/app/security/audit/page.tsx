import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SecurityNav } from '@/components/security/security-nav';

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user: { id: string; email: string; displayName: string | null } | null;
};

export default async function SecurityAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.entity) qs.set('entity', params.entity);
  if (params.action) qs.set('action', params.action);

  const result = await apiServerFetch<AuditRow[]>(`/security/audit-logs?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Security audit logs"
        description="Immutable record of administrative and security actions."
        actions={<Badge>{rows.length} loaded</Badge>}
      />
      <SecurityNav active="/security/audit" />

      <form className="mb-6 mt-6 flex flex-wrap gap-3">
        <input
          name="entity"
          defaultValue={params.entity || ''}
          placeholder="Entity (e.g. User)"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <input
          name="action"
          defaultValue={params.action || ''}
          placeholder="Action (e.g. security.revoke_sessions)"
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
                <th className="px-4 py-3 font-medium">IP</th>
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
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {row.entity}
                    {row.entityId ? (
                      <div className="font-mono text-xs">{row.entityId}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">{row.ipAddress ?? '—'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
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
