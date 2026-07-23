import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Analytics = {
  indexedPages?: number;
  note?: string;
  integrations?: {
    googleSearchConsoleVerified?: boolean;
    bingWebmasterVerified?: boolean;
  };
};

export default async function SeoAnalyticsPage() {
  const result = await apiServerFetch<Analytics>('/seo/analytics');

  return (
    <div className="space-y-8">
      <PageHeader title="SEO Analytics" description="Search performance and indexing overview." />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Indexed pages (sitemap)</CardDescription>
              <CardTitle className="text-3xl">{result.data?.indexedPages ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Google Search Console</CardDescription>
              <CardTitle>
                {result.data?.integrations?.googleSearchConsoleVerified ? 'Connected' : 'Not connected'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
      {result.data?.note ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">{result.data.note}</p>
      ) : null}
    </div>
  );
}
