import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ApiConsoleNav } from '@/components/api-console/api-console-nav';
import { WebhookForm } from '@/components/api-console/webhook-form';

type WebhookRow = {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
};

export default async function ApiWebhooksPage() {
  const result = await apiServerFetch<WebhookRow[]>('/platform/webhooks?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader title="Webhooks" description="Outbound event delivery to external systems." />
      <ApiConsoleNav active="/api/webhooks" />
      <WebhookForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load webhooks</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <WebhookForm
              key={row.id}
              initial={{
                id: row.id,
                name: row.name,
                url: row.url,
                events: row.events,
                enabled: row.enabled,
              }}
            />
          ))}
          {!rows.length ? <p className="text-sm text-[var(--varnarc-subtle)]">No webhooks configured.</p> : null}
        </div>
      )}
    </div>
  );
}
