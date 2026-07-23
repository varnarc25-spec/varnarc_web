import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SecurityNav } from '@/components/security/security-nav';
import { RevokeSessionsForm } from '@/components/security/revoke-sessions-form';

type SessionRow = {
  id: string;
  userId: string;
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  country?: string | null;
  loginTime: string;
  user?: { id: string; email: string; displayName: string | null };
};

type SessionsResponse = {
  source: string;
  sessions: SessionRow[];
};

export default async function SecuritySessionsPage() {
  const result = await apiServerFetch<SessionsResponse>('/security/sessions');
  const rows = result.data?.sessions ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Active sessions"
        description="Recent login history and session revocation (Auth0 when configured)."
      />
      <SecurityNav active="/security/sessions" />

      <RevokeSessionsForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load sessions</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Login time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Browser</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.loginTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.user?.displayName || row.user?.email || row.userId}</div>
                    {row.user?.email ? (
                      <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.userId}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{row.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3">{row.device ?? row.operatingSystem ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">{row.browser ?? '—'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No recent login sessions.
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
