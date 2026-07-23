import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { CodeBlock, DeveloperDocSection, DeveloperPortalNav } from '@/components/developers/developer-portal-nav';

export const metadata: Metadata = {
  title: 'TypeScript SDK',
  description: 'Official @varnarc/sdk client for the Varnarc Platform API.',
  alternates: { canonical: '/developers/docs/sdk' },
};

export default function DeveloperSdkPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  return (
    <PageShell
      title="TypeScript SDK"
      description="Typed client for Node.js, Next.js, and browser fetch environments."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Developers', href: '/developers' },
        { label: 'SDK' },
      ]}
    >
      <DeveloperPortalNav active="/developers/docs/sdk" />

      <div className="mt-8 max-w-3xl space-y-8">
        <DeveloperDocSection title="Install">
          <CodeBlock>pnpm add @varnarc/sdk</CodeBlock>
          <p className="text-xs text-slate-500">
            In the Varnarc monorepo, the package lives at <code className="rounded bg-slate-100 px-1">packages/sdk</code>{' '}
            and is consumed via <code className="rounded bg-slate-100 px-1">workspace:*</code>.
          </p>
        </DeveloperDocSection>

        <DeveloperDocSection title="Create a client">
          <CodeBlock>{`import { VarnarcClient } from '@varnarc/sdk';

const client = new VarnarcClient({
  baseUrl: '${apiBase}',
  apiKey: process.env.VARNARC_API_KEY,
  bearerToken: optionalUserToken,
});`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Common methods">
          <CodeBlock>{`// Platform metadata
const portal = await client.getDevelopers();
const status = await client.getStatus();

// Search & content
const hits = await client.search({ q: 'solar panel', limit: 10 });
const article = await client.getArticleBySlug('home-loan-guide');

// Calculators
const calc = await client.getCalculatorBySlug('emi-calculator');
const result = await client.executeCalculator('emi-calculator', {
  principal: 5000000,
  rate: 8.5,
  tenureMonths: 240,
});`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Error handling">
          <CodeBlock>{`import { VarnarcClient, VarnarcApiError } from '@varnarc/sdk';

try {
  await client.getArticleBySlug('missing');
} catch (err) {
  if (err instanceof VarnarcApiError) {
    console.error(err.code, err.status, err.message);
  }
}`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Exports">
          <p>
            The SDK re-exports <code className="rounded bg-slate-100 px-1">API_VERSION</code> and{' '}
            <code className="rounded bg-slate-100 px-1">WEBHOOK_EVENTS</code> from{' '}
            <code className="rounded bg-slate-100 px-1">@varnarc/validation</code> for shared constants across your
            integration.
          </p>
        </DeveloperDocSection>
      </div>
    </PageShell>
  );
}
