import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { ProviderManagement, type AiProvider } from '@/components/ai-ops/provider-management';
import {
  ContactSettingsForm,
  type ContactSettings,
} from '@/components/settings/contact-settings-form';

type Settings = {
  configured?: boolean;
  hasApiKey?: boolean;
  defaultModel?: string;
  baseUrl?: string;
  provider?: string;
  envVars?: string[];
};

export default async function AiOpsSettingsPage() {
  const [result, providersResult, emailResult] = await Promise.all([
    apiServerFetch<Settings>('/ai/settings'),
    apiServerFetch<AiProvider[]>('/ai/providers'),
    apiServerFetch<ContactSettings>('/settings/contact'),
  ]);
  const providers = providersResult.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Settings"
        description="Manage AI providers, models, failover priority, and the default provider."
      />
      <AiOpsNav active="/ai-ops/settings" />

      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {providersResult.error ? (
            <p className="mb-4 text-sm text-red-600">{providersResult.error}</p>
          ) : null}
          <ProviderManagement providers={providers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI failure email alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {emailResult.error ? (
            <p className="mb-4 text-sm text-red-600">{emailResult.error}</p>
          ) : null}
          <ContactSettingsForm
            initial={emailResult.data ?? { emailEnabled: true, toBusiness: 'business@varnarc.com' }}
            mode="ai-alerts"
          />
        </CardContent>
      </Card>

      {providers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Legacy environment settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-[var(--varnarc-subtle)]">
              No database providers exist, so the API continues to use the legacy OpenAI-compatible
              environment configuration below.
            </p>
            <Row
              label="API key"
              value={result.data?.hasApiKey ? 'Set in environment' : 'Missing OPENAI_API_KEY'}
            />
            <Row label="Base URL" value={result.data?.baseUrl ?? '—'} />
            <Row label="Default model" value={result.data?.defaultModel ?? '—'} />
            <Row label="Provider" value={result.data?.provider ?? '—'} />
            <p className="pt-2 text-[var(--varnarc-subtle)]">
              For local development, configure in{' '}
              <code className="rounded bg-[var(--varnarc-muted)] px-1">project/.env</code>. In
              production, keep the key in Secret Manager and mount it into Cloud Run:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[var(--varnarc-muted)] p-4 text-xs">
              {`OPENAI_API_KEY=your-key
AI_DEFAULT_MODEL=gemini-flash-latest
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`}
            </pre>
            <p className="text-[var(--varnarc-subtle)]">
              Environment variables: {(result.data?.envVars ?? []).join(', ')}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--varnarc-border)] py-2 last:border-0">
      <span className="text-[var(--varnarc-subtle)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
