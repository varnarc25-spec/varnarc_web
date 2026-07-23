import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { CodeBlock, DeveloperDocSection, DeveloperPortalNav } from '@/components/developers/developer-portal-nav';
import { WEBHOOK_EVENTS } from '@varnarc/validation';

export const metadata: Metadata = {
  title: 'Webhooks',
  description: 'Subscribe to Varnarc Platform events with signed webhook deliveries.',
  alternates: { canonical: '/developers/docs/webhooks' },
};

export default function DeveloperWebhooksPage() {
  return (
    <PageShell
      title="Webhooks"
      description="Receive signed HTTP callbacks when platform events occur."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Developers', href: '/developers' },
        { label: 'Webhooks' },
      ]}
    >
      <DeveloperPortalNav active="/developers/docs/webhooks" />

      <div className="mt-8 max-w-3xl space-y-8">
        <DeveloperDocSection title="Supported events">
          <ul className="list-inside list-disc space-y-1">
            {WEBHOOK_EVENTS.map((event) => (
              <li key={event}>
                <code className="rounded bg-slate-100 px-1 text-xs">{event}</code>
              </li>
            ))}
          </ul>
        </DeveloperDocSection>

        <DeveloperDocSection title="Payload format">
          <CodeBlock>{`POST https://your-app.example/webhooks/varnarc
Content-Type: application/json
X-Varnarc-Event: lead.created
X-Varnarc-Signature: sha256=<hmac_hex>

{
  "event": "lead.created",
  "payload": { "leadId": "...", "businessId": "..." },
  "timestamp": "2026-07-23T10:00:00.000Z"
}`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Verifying signatures">
          <p>
            When a webhook endpoint has a secret configured, Varnarc signs the raw JSON body with HMAC-SHA256. Compare
            the <code className="rounded bg-slate-100 px-1">X-Varnarc-Signature</code> header (prefix{' '}
            <code className="rounded bg-slate-100 px-1">sha256=</code>) against your own HMAC of the request body.
          </p>
          <CodeBlock>{`import { createHmac, timingSafeEqual } from 'node:crypto';

function verifySignature(body: string, secret: string, header: string | null) {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const received = header.slice('sha256='.length);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Managing endpoints">
          <p>
            Webhook endpoints are configured in the admin API console under <strong>API → Webhooks</strong>. You can
            send test deliveries and inspect delivery logs from the same console.
          </p>
        </DeveloperDocSection>
      </div>
    </PageShell>
  );
}
