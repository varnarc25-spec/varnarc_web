import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { RetryJobButton } from '@/components/ai-ops/ai-ops-forms';

type Job = {
  id: string;
  status: string;
  error?: string | null;
  createdAt: string;
  prompt?: { slug: string; name: string } | null;
  model?: { slug: string } | null;
  input?: { feature?: string };
};

export default async function AiOpsJobsPage() {
  const result = await apiServerFetch<Job[]>('/ai/jobs?limit=50');
  const jobs = result.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="AI Jobs" description="History of LLM runs including article AI and prompt tests." />
      <AiOpsNav active="/ai-ops/jobs" />

      <Card>
        <CardHeader>
          <CardTitle>Recent jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--varnarc-subtle)]">
                <th className="py-2">Status</th>
                <th className="py-2">Feature / prompt</th>
                <th className="py-2">When</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-[var(--varnarc-border)] align-top">
                  <td className="py-2">
                    <StatusBadge status={job.status} />
                    {job.error ? <p className="mt-1 text-xs text-red-600">{job.error}</p> : null}
                  </td>
                  <td className="py-2">
                    {job.input?.feature ?? job.prompt?.slug ?? job.prompt?.name ?? '—'}
                  </td>
                  <td className="py-2 text-[var(--varnarc-subtle)]">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    {job.status === 'FAILED' ? <RetryJobButton jobId={job.id} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
