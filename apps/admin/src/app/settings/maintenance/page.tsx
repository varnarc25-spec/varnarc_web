import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { MaintenanceSettingsForm } from '@/components/settings/maintenance-settings-form';

export default async function MaintenanceSettingsPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/settings/maintenance');

  return (
    <div className="space-y-8">
      <PageHeader title="Maintenance" description="Control downtime messaging and scheduled maintenance windows." />
      <SettingsNav active="/settings/maintenance" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <MaintenanceSettingsForm
          initial={{
            enabled: false,
            readOnly: false,
            message: 'We are performing scheduled maintenance. Please check back soon.',
            ...(result.data ?? {}),
          }}
        />
      )}
    </div>
  );
}
