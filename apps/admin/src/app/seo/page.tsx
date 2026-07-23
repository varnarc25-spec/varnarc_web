import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Dashboard = {
  healthScore?: number;
  openIssues?: number;
  errors?: number;
  warnings?: number;
  redirectCount?: number;
  metadataCount?: number;
  sitemap?: { indexUrl?: string; types?: Array<{ type: string; count: number; url: string }> };
};

export default async function SeoDashboardPage() {
  const result = await apiServerFetch<Dashboard>('/seo/dashboard');

  return (
    <div className="space-y-8">
      <PageHeader title="SEO" description="Site-wide SEO health, sitemaps, redirects, and metadata." />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/seo/metadata" className="text-[var(--varnarc-brand)] hover:underline">
          Metadata
        </Link>
        <Link href="/seo/ai" className="text-[var(--varnarc-brand)] hover:underline">
          AI assistant
        </Link>
        <Link href="/seo/redirects" className="text-[var(--varnarc-brand)] hover:underline">
          Redirects
        </Link>
        <Link href="/seo/sitemaps" className="text-[var(--varnarc-brand)] hover:underline">
          Sitemaps
        </Link>
        <Link href="/seo/audit" className="text-[var(--varnarc-brand)] hover:underline">
          Audit
        </Link>
        <Link href="/seo/analytics" className="text-[var(--varnarc-brand)] hover:underline">
          Analytics
        </Link>
        <Link href="/seo/integrations" className="text-[var(--varnarc-brand)] hover:underline">
          Integrations
        </Link>
        <Link href="/seo/robots" className="text-[var(--varnarc-brand)] hover:underline">
          Robots
        </Link>
      </div>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load SEO dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Kpi title="Health score" value={result.data?.healthScore ?? 0} />
          <Kpi title="Open issues" value={result.data?.openIssues ?? 0} />
          <Kpi title="Errors" value={result.data?.errors ?? 0} />
          <Kpi title="Warnings" value={result.data?.warnings ?? 0} />
          <Kpi title="Redirects" value={result.data?.redirectCount ?? 0} />
          <Kpi title="Metadata overrides" value={result.data?.metadataCount ?? 0} />
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
