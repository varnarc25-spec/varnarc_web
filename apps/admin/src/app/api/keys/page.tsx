import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ApiConsoleNav } from '@/components/api-console/api-console-nav';
import { ApiKeyCreateForm } from '@/components/api-console/api-key-create-form';

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export default async function ApiKeysPage() {
  const result = await apiServerFetch<KeyRow[]>('/platform/keys?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader title="API keys" description="Machine-to-machine credentials for integrations." />
      <ApiConsoleNav active="/api/keys" />
      <ApiKeyCreateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load keys</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Prefix</th>
                <th className="px-4 py-3 font-medium">Scopes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last used</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.keyPrefix}…</td>
                  <td className="px-4 py-3 text-xs text-[var(--varnarc-subtle)]">{row.scopes.join(', ') || '—'}</td>
                  <td className="px-4 py-3">{row.enabled ? 'Active' : 'Disabled'}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No API keys yet.
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
