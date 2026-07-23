import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { CodeBlock, DeveloperDocSection, DeveloperPortalNav } from '@/components/developers/developer-portal-nav';

export const metadata: Metadata = {
  title: 'API Getting Started',
  description: 'Get started with the Varnarc Platform REST API.',
  alternates: { canonical: '/developers/docs' },
};

export default function DeveloperDocsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  return (
    <PageShell
      title="Getting started"
      description="Base URL, response format, and your first API call."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Developers', href: '/developers' },
        { label: 'Docs' },
      ]}
    >
      <DeveloperPortalNav active="/developers/docs" />

      <div className="mt-8 max-w-3xl space-y-8">
        <DeveloperDocSection title="Base URL">
          <p>All endpoints are served under a single versioned prefix:</p>
          <CodeBlock>{apiBase}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Response envelope">
          <p>Successful responses use a consistent JSON envelope:</p>
          <CodeBlock>{`{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-07-23T10:00:00.000Z",
    "requestId": "req_..."
  }
}`}</CodeBlock>
          <p>Errors return <code className="rounded bg-slate-100 px-1">success: false</code> with an <code className="rounded bg-slate-100 px-1">error.code</code> and <code className="rounded bg-slate-100 px-1">error.message</code>.</p>
        </DeveloperDocSection>

        <DeveloperDocSection title="Health checks">
          <CodeBlock>{`curl ${apiBase}/version
curl ${apiBase}/status
curl ${apiBase}/health`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Search example">
          <CodeBlock>{`curl "${apiBase}/search?q=home+loan&limit=5"`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="Pagination">
          <p>
            List endpoints support cursor pagination via <code className="rounded bg-slate-100 px-1">cursor</code> and{' '}
            <code className="rounded bg-slate-100 px-1">limit</code> query parameters. The response{' '}
            <code className="rounded bg-slate-100 px-1">meta</code> object includes <code className="rounded bg-slate-100 px-1">nextCursor</code> and{' '}
            <code className="rounded bg-slate-100 px-1">hasMore</code>.
          </p>
        </DeveloperDocSection>

        <DeveloperDocSection title="Rate limits">
          <p>
            The platform applies a global limit of 120 requests per 60 seconds per client. When exceeded, the API
            returns HTTP 429. Contact your account administrator for higher limits on partner integrations.
          </p>
        </DeveloperDocSection>
      </div>
    </PageShell>
  );
}
