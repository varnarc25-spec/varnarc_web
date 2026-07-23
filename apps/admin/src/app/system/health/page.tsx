import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';

type Readiness = {
  status?: string;
  database?: string;
  redis?: string;
  auth0?: string;
  environment?: string;
  version?: string;
};

export default async function SystemHealthPage() {
  const [readyResult, healthResult] = await Promise.all([
    apiServerFetch<Readiness>('/ready'),
    apiServerFetch<{ status?: string; service?: string }>('/health'),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="System health" description="Liveness and readiness probes for Cloud Run and operations." />
      <SystemNav active="/system/health" />

      {(readyResult.error || healthResult.error) && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load health</CardTitle>
            <CardDescription>{[readyResult.error, healthResult.error].filter(Boolean).join(' · ')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Liveness — GET /health</CardDescription>
            <CardTitle>{healthResult.data?.status ?? 'unknown'}</CardTitle>
            <CardDescription className="mt-2">Service: {healthResult.data?.service ?? '—'}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Readiness — GET /ready</CardDescription>
            <CardTitle>{readyResult.data?.status ?? 'unknown'}</CardTitle>
            <CardDescription className="mt-2 space-y-1">
              <span className="block">Database: {readyResult.data?.database ?? '—'}</span>
              <span className="block">Redis: {readyResult.data?.redis ?? '—'}</span>
              <span className="block">Auth0: {readyResult.data?.auth0 ?? '—'}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
