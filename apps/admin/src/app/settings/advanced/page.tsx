import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { SettingUpsertForm } from '@/components/setting-upsert-form';

type SettingRow = {
  id: string;
  key: string;
  group: string;
  value: unknown;
  updatedAt: string;
};

export default async function AdvancedSettingsPage() {
  const result = await apiServerFetch<SettingRow[]>('/settings?limit=50');
  const settings = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Advanced settings"
        description="Raw key/value upsert for settings not yet covered by typed forms."
      />
      <SettingsNav active="/settings/advanced" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load settings</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="space-y-4">
        <SettingUpsertForm />
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-mono text-xs">{row.key}</td>
                  <td className="px-4 py-3">{row.group}</td>
                  <td className="max-w-md truncate px-4 py-3 font-mono text-xs text-[var(--varnarc-subtle)]">
                    {JSON.stringify(row.value)}
                  </td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!settings.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No settings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
