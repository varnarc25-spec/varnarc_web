import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SecurityNav } from '@/components/security/security-nav';

type SecurityEventRow = {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  status: string;
  ipAddress?: string | null;
  createdAt: string;
  user: { id: string; email: string; displayName: string | null } | null;
};

export default async function SecurityEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventType?: string; severity?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.eventType) qs.set('eventType', params.eventType);
  if (params.severity) qs.set('severity', params.severity);

  const result = await apiServerFetch<SecurityEventRow[]>(`/security/events?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Security events"
        description="Failed logins, permission denials, rate limits, and session revocations."
        actions={<Badge>{rows.length} loaded</Badge>}
      />
      <SecurityNav active="/security/events" />

      <form className="mb-6 mt-6 flex flex-wrap gap-3">
        <input
          name="eventType"
          defaultValue={params.eventType || ''}
          placeholder="Event type (e.g. auth.failure)"
          className="h-10 w-full max-w-xs rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <input
          name="severity"
          defaultValue={params.severity || ''}
          placeholder="Severity (low, medium, high)"
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
            <CardTitle>Unable to load security events</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.eventType}</td>
                  <td className="px-4 py-3">{row.severity}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3">{row.user?.email ?? '—'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No security events match these filters.
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
