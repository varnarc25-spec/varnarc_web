import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SecurityNav } from '@/components/security/security-nav';

type Overview = {
  auth0?: { configured?: boolean; sessionRevocation?: boolean };
  rateLimit?: { perMinute?: number; storage?: string };
  corsOrigins?: string[];
  secrets?: Array<{ key: string; configured: boolean }>;
  events24h?: {
    total?: number;
    bySeverity?: Record<string, number>;
    topEventTypes?: Array<{ eventType: string; count: number }>;
  };
};

export default async function SecurityOverviewPage() {
  const result = await apiServerFetch<Overview>('/security/overview');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Center"
        description="Platform security posture, secrets health, and recent events."
      />
      <SecurityNav active="/security" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load security overview</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Auth0" value={result.data?.auth0?.configured ? 'configured' : 'dev mode'} />
            <Kpi
              title="Session revocation"
              value={result.data?.auth0?.sessionRevocation ? 'enabled' : 'not configured'}
            />
            <Kpi
              title="Rate limit"
              value={`${result.data?.rateLimit?.perMinute ?? 120}/min (${result.data?.rateLimit?.storage ?? 'memory'})`}
            />
            <Kpi title="Events (24h)" value={String(result.data?.events24h?.total ?? 0)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CORS origins</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {(result.data?.corsOrigins ?? []).map((origin) => (
                    <span key={origin} className="block">
                      {origin}
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Secret health (metadata only)</CardTitle>
                <CardDescription className="space-y-1">
                  {(result.data?.secrets ?? []).map((secret) => (
                    <span key={secret.key} className="block">
                      {secret.key}: {secret.configured ? 'configured' : 'missing'}
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top security events (24h)</CardTitle>
              <CardDescription className="space-y-1 font-mono text-xs">
                {(result.data?.events24h?.topEventTypes ?? []).map((row) => (
                  <span key={row.eventType} className="block">
                    {row.eventType}: {row.count}
                  </span>
                ))}
                {(result.data?.events24h?.topEventTypes ?? []).length === 0 ? (
                  <span className="block">No security events recorded yet.</span>
                ) : null}
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-lg">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
