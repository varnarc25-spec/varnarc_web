import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';

type Settings = {
  configured?: boolean;
  hasApiKey?: boolean;
  defaultModel?: string;
  baseUrl?: string;
  provider?: string;
  envVars?: string[];
};

export default async function AiOpsSettingsPage() {
  const result = await apiServerFetch<Settings>('/ai/settings');

  return (
    <div className="space-y-8">
      <PageHeader title="AI Settings" description="Provider configuration (secrets are set via environment variables)." />
      <AiOpsNav active="/ai-ops/settings" />

      <Card>
        <CardHeader>
          <CardTitle>Provider status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="API key" value={result.data?.hasApiKey ? 'Set in environment' : 'Missing OPENAI_API_KEY'} />
          <Row label="Base URL" value={result.data?.baseUrl ?? '—'} />
          <Row label="Default model" value={result.data?.defaultModel ?? '—'} />
          <Row label="Provider" value={result.data?.provider ?? '—'} />
          <p className="pt-2 text-[var(--varnarc-subtle)]">
            Configure in <code className="rounded bg-[var(--varnarc-muted)] px-1">project/.env</code>:
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
