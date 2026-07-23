import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { CodeBlock, DeveloperDocSection, DeveloperPortalNav } from '@/components/developers/developer-portal-nav';

export const metadata: Metadata = {
  title: 'API Authentication',
  description: 'Authenticate with JWT bearer tokens or platform API keys.',
  alternates: { canonical: '/developers/docs/authentication' },
};

export default function DeveloperAuthPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  return (
    <PageShell
      title="Authentication"
      description="Public reads, Auth0 JWT for user actions, and API keys for platform integrations."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Developers', href: '/developers' },
        { label: 'Authentication' },
      ]}
    >
      <DeveloperPortalNav active="/developers/docs/authentication" />

      <div className="mt-8 max-w-3xl space-y-8">
        <DeveloperDocSection title="Public endpoints">
          <p>
            Search, published articles, calculators, directory listings, and most catalog endpoints do not require
            authentication. User-specific routes (bookmarks, reading history, comments) require a valid Auth0 access
            token.
          </p>
        </DeveloperDocSection>

        <DeveloperDocSection title="Bearer token (Auth0)">
          <p>Pass the access token from your Auth0 application:</p>
          <CodeBlock>{`curl -H "Authorization: Bearer <access_token>" \\
  ${apiBase}/users/me/profile`}</CodeBlock>
        </DeveloperDocSection>

        <DeveloperDocSection title="API keys">
          <p>
            Platform API keys are issued by administrators via the admin API console. Keys are shown once at creation
            and stored hashed server-side. Include the key on each request:
          </p>
          <CodeBlock>{`curl -H "X-Api-Key: vk_live_..." \\
  ${apiBase}/platform/overview`}</CodeBlock>
          <p className="text-xs text-slate-500">
            API key scopes and route guards are expanding — contact your Varnarc administrator to provision keys for
            partner integrations.
          </p>
        </DeveloperDocSection>

        <DeveloperDocSection title="SDK">
          <CodeBlock>{`const client = new VarnarcClient({
  baseUrl: '${apiBase}',
  bearerToken: accessToken,
  apiKey: process.env.VARNARC_API_KEY,
});`}</CodeBlock>
        </DeveloperDocSection>
      </div>
    </PageShell>
  );
}
