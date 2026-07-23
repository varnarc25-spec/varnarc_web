import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';
import { DependencyStatusBadge } from '@/components/system/status-badge';

type Overview = {
  queues?: {
    aiJobs?: {
      total?: number;
      failed?: number;
      last24h?: number;
      byStatus?: Array<{ status: string; count: number }>;
    };
    webhooks?: {
      total?: number;
      failed?: number;
      successRate?: number;
      recent?: Array<{
        id: string;
        event: string;
        success: boolean;
        statusCode?: number | null;
        errorMessage?: string | null;
        createdAt: string;
        endpoint?: { name?: string; url?: string };
      }>;
    };
  };
};

type Job = {
  id: string;
  status: string;
  error?: string | null;
  createdAt: string;
  prompt?: { slug: string; name: string } | null;
  input?: { feature?: string };
};

export default async function SystemQueuesPage() {
  const [overviewResult, jobsResult] = await Promise.all([
    apiServerFetch<Overview>('/monitoring/overview'),
    apiServerFetch<Job[]>('/ai/jobs?limit=20'),
  ]);

  const aiJobs = overviewResult.data?.queues?.aiJobs;
  const webhooks = overviewResult.data?.queues?.webhooks;
  const recentJobs = jobsResult.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Queues & jobs"
        description="AI job runs and webhook delivery observability (last 24h for webhooks)."
      />
      <SystemNav active="/system/queues" />

      {(overviewResult.error || jobsResult.error) && (
        <Card>
          <CardHeader>
            <CardTitle>Partial data</CardTitle>
            <CardDescription>
              {[overviewResult.error, jobsResult.error].filter(Boolean).join(' · ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat title="AI jobs (total)" value={aiJobs?.total ?? 0} />
        <Stat title="AI jobs (24h)" value={aiJobs?.last24h ?? 0} />
        <Stat title="Webhook deliveries (24h)" value={webhooks?.total ?? 0} />
        <Stat title="Webhook failures (24h)" value={webhooks?.failed ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI jobs by status</CardTitle>
            <CardDescription className="space-y-2">
              {(aiJobs?.byStatus ?? []).length === 0 ? (
                <span className="block">No AI jobs recorded yet.</span>
              ) : (
                (aiJobs?.byStatus ?? []).map((row) => (
                  <span key={row.status} className="flex justify-between">
                    <JobStatusBadge status={row.status} />
                    <span>{row.count}</span>
                  </span>
                ))
              )}
              <Link href="/ai-ops/jobs" className="mt-2 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
                Open AI ops jobs →
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent AI jobs</CardTitle>
            <CardDescription>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[var(--varnarc-subtle)]">
                    <th className="py-1">Status</th>
                    <th className="py-1">Feature</th>
                    <th className="py-1">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b border-[var(--varnarc-border)]">
                      <td className="py-2">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="py-2">{job.input?.feature ?? job.prompt?.slug ?? '—'}</td>
                      <td className="py-2 text-xs text-[var(--varnarc-subtle)]">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-[var(--varnarc-subtle)]">
                        No recent jobs.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent webhook deliveries (24h)</CardTitle>
          <CardDescription>
            Success rate: {((webhooks?.successRate ?? 1) * 100).toFixed(1)}%
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--varnarc-subtle)]">
                  <th className="py-1">Endpoint</th>
                  <th className="py-1">Event</th>
                  <th className="py-1">Result</th>
                  <th className="py-1">When</th>
                </tr>
              </thead>
              <tbody>
                {(webhooks?.recent ?? []).map((delivery) => (
                  <tr key={delivery.id} className="border-b border-[var(--varnarc-border)] align-top">
                    <td className="py-2">{delivery.endpoint?.name ?? delivery.endpoint?.url ?? '—'}</td>
                    <td className="py-2 font-mono text-xs">{delivery.event}</td>
                    <td className="py-2">
                      {delivery.success ? (
                        <span className="text-green-700">{delivery.statusCode ?? 'OK'}</span>
                      ) : (
                        <span className="text-red-600">
                          {delivery.errorMessage ?? delivery.statusCode ?? 'failed'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-[var(--varnarc-subtle)]">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(webhooks?.recent ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-[var(--varnarc-subtle)]">
                      No webhook deliveries in the last 24 hours.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Link href="/api" className="mt-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
              Manage webhooks in API console →
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SUCCEEDED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    QUEUED: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-slate-100'}`}>
      {status}
    </span>
  );
}
