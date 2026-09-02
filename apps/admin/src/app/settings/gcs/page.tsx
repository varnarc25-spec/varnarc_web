import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { GcsSettingsForm, type GcsSettingsView } from '@/components/settings/gcs-settings-form';

export default async function GcsSettingsPage() {
  const result = await apiServerFetch<GcsSettingsView>('/settings/gcs');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Google Cloud Storage"
        description="Bucket and credentials for media uploads. Stored in the settings database."
      />
      <SettingsNav active="/settings/gcs" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <GcsSettingsForm initial={result.data ?? { enabled: false, activeSource: 'none' }} />
      )}
    </div>
  );
}
