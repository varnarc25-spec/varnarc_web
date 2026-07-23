import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Analytics = {
  totals: { views: number; executions: number; avgDurationMs: number | null };
  byCalculator: Array<{
    calculator: { id: string; name: string; slug: string };
    views: number;
    executions: number;
    avgDurationMs: number | null;
  }>;
};

export default async function CalculatorAnalyticsPage() {
  const result = await apiServerFetch<Analytics>('/calculators/analytics');

  if (result.error || !result.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load analytics</CardTitle>
          <CardDescription>{result.error || 'No data'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totals, byCalculator } = result.data;

  return (
    <div>
      <PageHeader
        title="Calculator analytics"
        description="Views, executions, and average processing time."
        actions={
          <Link href="/calculators" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <p className="text-xs text-[var(--varnarc-subtle)]">Views</p>
          <p className="text-2xl font-semibold">{totals.views}</p>
        </div>
        <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <p className="text-xs text-[var(--varnarc-subtle)]">Executions</p>
          <p className="text-2xl font-semibold">{totals.executions}</p>
        </div>
        <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <p className="text-xs text-[var(--varnarc-subtle)]">Avg duration (ms)</p>
          <p className="text-2xl font-semibold">
            {totals.avgDurationMs != null ? Math.round(totals.avgDurationMs) : '—'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Calculator</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Executions</th>
              <th className="px-4 py-3 font-medium">Avg ms</th>
            </tr>
          </thead>
          <tbody>
            {byCalculator.map((row) => (
              <tr key={row.calculator.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3">{row.calculator.name}</td>
                <td className="px-4 py-3">{row.views}</td>
                <td className="px-4 py-3">{row.executions}</td>
                <td className="px-4 py-3">
                  {row.avgDurationMs != null ? Math.round(row.avgDurationMs) : '—'}
                </td>
              </tr>
            ))}
            {!byCalculator.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No analytics events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
