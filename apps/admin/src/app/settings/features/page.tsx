import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import { FeatureFlagForm } from '@/components/feature-flag-form';

type FeatureFlagRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
};

export default async function FeatureFlagsSettingsPage() {
  const result = await apiServerFetch<FeatureFlagRow[]>('/settings/feature-flags?limit=50');
  const flags = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader title="Feature flags" description="Toggle platform features without deploying code." />
      <SettingsNav active="/settings/features" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-4">
          <FeatureFlagForm />
          <div className="space-y-3">
            {flags.map((flag) => (
              <FeatureFlagForm
                key={flag.id}
                initial={{
                  key: flag.key,
                  name: flag.name,
                  description: flag.description,
                  enabled: flag.enabled,
                }}
              />
            ))}
            {!flags.length ? (
              <p className="text-sm text-[var(--varnarc-subtle)]">No feature flags yet.</p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
