import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SeoIntegrationsForm } from '@/components/seo/seo-integrations-form';

export default async function SeoIntegrationsPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/seo/integrations');

  return (
    <div className="space-y-8">
      <PageHeader
        title="SEO integrations"
        description="Google Search Console and Bing Webmaster settings (verification flags)."
      />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <SeoIntegrationsForm initial={(result.data ?? {}) as Parameters<typeof SeoIntegrationsForm>[0]['initial']} />
      )}
    </div>
  );
}
