import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';
import { CacheClearActions } from '@/components/system/cache-clear-actions';

type CacheStatus = {
  backend?: string;
  defaultTtlMs?: number;
  namespaces?: Array<{ prefix: string; label: string }>;
  notes?: string;
};

export default async function SystemCachePage() {
  const result = await apiServerFetch<CacheStatus>('/performance/cache');

  return (
    <div className="space-y-8">
      <PageHeader title="Cache" description="Redis/memory cache namespaces and invalidation." />
      <SystemNav active="/system/cache" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load cache status</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Backend</CardDescription>
                <CardTitle>{result.data?.backend ?? '—'}</CardTitle>
                <CardDescription className="mt-2">
                  Default TTL: {result.data?.defaultTtlMs ?? 0} ms
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>{result.data?.notes ?? '—'}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Namespaces</CardTitle>
              <CardDescription className="space-y-1 font-mono text-xs">
                {(result.data?.namespaces ?? []).map((ns) => (
                  <span key={ns.prefix} className="block">
                    {ns.prefix} — {ns.label}
                  </span>
                ))}
              </CardDescription>
            </CardHeader>
          </Card>

          <CacheClearActions />
        </>
      )}
    </div>
  );
}
