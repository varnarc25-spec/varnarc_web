import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { AiEditorialPipeline } from '@/components/ai-editorial-pipeline';

type Overview = {
  configured?: boolean;
  defaultModel?: string;
  baseUrl?: string;
  provider?: string;
  promptCount?: number;
  modelCount?: number;
  jobs?: {
    total?: number;
    failed?: number;
    last24h?: number;
    today?: number;
    dailyLimit?: number | null;
    quotaRemaining?: number | null;
    byStatus?: Array<{ status: string; count: number }>;
    byFeature?: Array<{ feature: string; total: number; failed: number }>;
  };
};

export default async function AiOpsOverviewPage() {
  const result = await apiServerFetch<Overview>('/ai/overview');

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Operations"
        description="Central hub for LLM providers, prompts, models, usage quotas, and job history."
      />
      <AiOpsNav active="/ai-ops" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load overview</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Provider" value={result.data?.configured ? 'Configured' : 'Not configured'} />
            <Kpi title="Default model" value={result.data?.defaultModel ?? '—'} />
            <Kpi title="Jobs today" value={String(result.data?.jobs?.today ?? 0)} />
            <Kpi
              title="Daily quota"
              value={
                result.data?.jobs?.dailyLimit
                  ? `${result.data.jobs.quotaRemaining ?? 0} left`
                  : 'Unlimited'
              }
            />
            <Kpi title="Prompts" value={String(result.data?.promptCount ?? 0)} />
            <Kpi title="Models" value={String(result.data?.modelCount ?? 0)} />
            <Kpi title="Jobs (24h)" value={String(result.data?.jobs?.last24h ?? 0)} />
            <Kpi title="Failed jobs" value={String(result.data?.jobs?.failed ?? 0)} />
          </div>

          <AiEditorialPipeline />

          {result.data?.jobs?.byFeature?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Usage by feature</CardTitle>
                <CardDescription>Recent job counts grouped by AI feature (last 2000 jobs)</CardDescription>
              </CardHeader>
              <ul className="space-y-1 px-6 pb-6 text-sm">
                {result.data.jobs.byFeature.map((row) => (
                  <li key={row.feature} className="flex justify-between gap-4">
                    <span>{row.feature}</span>
                    <span className="font-medium">
                      {row.total}
                      {row.failed ? ` (${row.failed} failed)` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {result.data?.jobs?.byStatus?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Jobs by status</CardTitle>
              </CardHeader>
              <ul className="space-y-1 px-6 pb-6 text-sm">
                {result.data.jobs.byStatus.map((row) => (
                  <li key={row.status} className="flex justify-between">
                    <span>{row.status}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
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
        <CardTitle className="text-lg break-all">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
