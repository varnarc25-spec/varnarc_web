import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { GeneralSettingsForm } from '@/components/settings/general-settings-form';

export default async function GeneralSettingsPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/settings/general');

  return (
    <div className="space-y-8">
      <PageHeader title="General settings" description="Site identity, contact information, and locale defaults." />
      <SettingsNav active="/settings/general" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <GeneralSettingsForm initial={result.data ?? { siteName: 'Varnarc' }} />
      )}
    </div>
  );
}
