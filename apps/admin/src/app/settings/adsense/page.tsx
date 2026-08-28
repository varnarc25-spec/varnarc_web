import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import {
  AdsenseSettingsForm,
  type AdsenseSettings,
} from '@/components/settings/adsense-settings-form';

export default async function AdsenseSettingsPage() {
  const result = await apiServerFetch<AdsenseSettings>('/settings/adsense');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Google AdSense"
        description="Publisher ID and ad unit slots used by the public website."
      />
      <SettingsNav active="/settings/adsense" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AdsenseSettingsForm
          initial={result.data ?? { enabled: true, client: 'ca-pub-6274053387170397' }}
        />
      )}
    </div>
  );
}
