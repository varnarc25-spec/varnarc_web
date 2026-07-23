import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { SecuritySettingsForm } from '@/components/settings/security-settings-form';

export default async function SecuritySettingsPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/settings/security');

  return (
    <div className="space-y-8">
      <PageHeader title="Security" description="Platform security defaults and API protection settings." />
      <SettingsNav active="/settings/security" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <SecuritySettingsForm
          initial={{
            rateLimitPerMinute: 120,
            cspReportOnly: true,
            passwordMinLength: 8,
            ...(result.data ?? {}),
          }}
        />
      )}
    </div>
  );
}
