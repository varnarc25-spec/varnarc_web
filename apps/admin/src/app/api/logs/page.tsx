import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ApiConsoleNav } from '@/components/api-console/api-console-nav';

type LogRow = {
  id: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
  errorMessage?: string | null;
};

export default async function ApiLogsPage() {
  const result = await apiServerFetch<LogRow[]>('/platform/logs?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader title="API request logs" description="Recent HTTP requests recorded by the API layer." />
      <ApiConsoleNav active="/api/logs" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load logs</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.method}</td>
                  <td className="max-w-md truncate px-4 py-3 font-mono text-xs">{row.path}</td>
                  <td className="px-4 py-3">{row.statusCode}</td>
                  <td className="px-4 py-3">{row.durationMs}ms</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--varnarc-subtle)]">{row.requestId}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No request logs yet.
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
