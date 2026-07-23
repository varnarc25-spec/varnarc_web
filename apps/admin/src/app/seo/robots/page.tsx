import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SeoRobotsForm } from '@/components/seo/seo-robots-form';

export default async function SeoRobotsPage() {
  const result = await apiServerFetch<{
    disallow?: string[];
    allow?: string[];
    crawlDelay?: number | null;
  }>('/seo/robots/settings');

  return (
    <div className="space-y-8">
      <PageHeader title="Robots.txt" description="Configure crawl rules for production robots.txt." />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <SeoRobotsForm initial={result.data ?? { allow: ['/'], disallow: [] }} />
      )}
    </div>
  );
}
