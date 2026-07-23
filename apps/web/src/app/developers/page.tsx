import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { CodeBlock, DeveloperDocSection, DeveloperPortalNav } from '@/components/developers/developer-portal-nav';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Developer Portal',
  description: 'Varnarc Platform API documentation, SDK, and integration guides.',
  alternates: { canonical: '/developers' },
};

type DeveloperInfo = {
  version: string;
  docs: { swagger: string; openapiJson: string };
  sdk: { package: string; install: string };
  rateLimits: { global: { ttlMs: number; limit: number } };
  publicModules: Array<{ id: string; path: string; description: string }>;
};

type StatusInfo = {
  status: string;
  database: string;
  cache: string;
  last24h: { total: number; errors: number; avgDurationMs: number };
};

export default async function DevelopersPage() {
  let info: DeveloperInfo | null = null;
  let status: StatusInfo | null = null;

  try {
    const [devRes, statusRes] = await Promise.all([
      apiPublicFetch<DeveloperInfo>('/developers', { cache: 'no-store' }),
      apiPublicFetch<StatusInfo>('/status', { cache: 'no-store' }),
    ]);
    info = devRes.data;
    status = statusRes.data;
  } catch {
    // Portal still renders with static fallbacks when API is unreachable.
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const swaggerUrl = info?.docs.swagger ?? apiBase.replace(/\/api\/v1\/?$/, '/api/v1/docs');

  return (
    <PageShell
      title="Developer Portal"
      description="Integrate with the Varnarc Platform REST API — search, content, calculators, webhooks, and more."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Developers' }]}
    >
      <DeveloperPortalNav active="/developers" />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <DeveloperDocSection title="Quick start">
            <p>
              The Varnarc API is versioned under <code className="rounded bg-slate-100 px-1">/api/v1</code>.
              Most read endpoints are public. Use the interactive Swagger UI to explore routes, or install the
              official TypeScript SDK for typed access.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/developers/docs"
                className="inline-flex rounded-lg bg-[var(--varnarc-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Read the docs
              </Link>
              <a
                href={swaggerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Swagger
              </a>
              <Link
                href="/developers/docs/sdk"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                TypeScript SDK
              </Link>
            </div>
          </DeveloperDocSection>

          <DeveloperDocSection title="Public modules">
            <ul className="grid gap-2 sm:grid-cols-2">
              {(info?.publicModules ?? defaultModules).map((mod) => (
                <li key={mod.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{mod.id}</p>
                  <p className="font-mono text-xs text-slate-500">{mod.path}</p>
                  <p className="mt-1 text-xs text-slate-600">{mod.description}</p>
                </li>
              ))}
            </ul>
          </DeveloperDocSection>

          <DeveloperDocSection title="Install the SDK">
            <CodeBlock>{info?.sdk.install ?? 'pnpm add @varnarc/sdk'}</CodeBlock>
            <CodeBlock>{`import { VarnarcClient } from '@varnarc/sdk';

const client = new VarnarcClient({
  baseUrl: '${apiBase}',
});

const results = await client.search({ q: 'home loan emi' });`}</CodeBlock>
          </DeveloperDocSection>
        </div>

        <aside className="space-y-4">
          <StatusCard
            label="API version"
            value={info?.version ?? '1.0.0'}
          />
          <StatusCard label="Runtime" value={status?.status ?? 'unknown'} />
          <StatusCard label="Database" value={status?.database ?? '—'} />
          <StatusCard label="Cache" value={status?.cache ?? '—'} />
          <StatusCard
            label="Requests (24h)"
            value={status ? String(status.last24h.total) : '—'}
          />
          <StatusCard
            label="Rate limit"
            value={
              info
                ? `${info.rateLimits.global.limit} req / ${info.rateLimits.global.ttlMs / 1000}s`
                : '120 req / 60s'
            }
          />
        </aside>
      </div>
    </PageShell>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#0b1f3a]">{value}</p>
    </div>
  );
}

const defaultModules = [
  { id: 'search', path: '/search', description: 'Full-text search and autocomplete' },
  { id: 'articles', path: '/cms/articles', description: 'Published articles and guides' },
  { id: 'calculators', path: '/calculators', description: 'Calculator catalog and execution' },
  { id: 'directory', path: '/directory', description: 'Business directory listings' },
  { id: 'reviews', path: '/reviews', description: 'Product and service reviews' },
  { id: 'finance', path: '/finance', description: 'Finance products and rate data' },
];
