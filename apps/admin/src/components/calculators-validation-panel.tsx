'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@varnarc/ui';
import { CalculatorsDataTable, type CalculatorTableRow } from '@/components/calculators-data-table';

type ValidationPayload = {
  summary: {
    total: number;
    published: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  results: Array<{
    id: string;
    slug: string;
    name: string;
    ok: boolean;
    message: string;
  }>;
};

export function CalculatorsValidationPanel({ initialRows }: { initialRows: CalculatorTableRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ValidationPayload['summary'] | null>(null);
  const [failures, setFailures] = useState<ValidationPayload['results']>([]);

  const applyResults = useCallback(
    (payload: ValidationPayload) => {
      const byId = new Map(payload.results.map((r) => [r.id, r]));
      setRows(
        initialRows.map((row) => {
          const result = byId.get(row.id);
          if (!result) {
            return { ...row, health: 'pending' as const, healthMessage: 'Not validated' };
          }
          if (result.ok && result.message.startsWith('Skipped')) {
            return { ...row, health: 'skip' as const, healthMessage: result.message };
          }
          return {
            ...row,
            health: result.ok ? ('ok' as const) : ('fail' as const),
            healthMessage: result.message,
          };
        }),
      );
      setSummary(payload.summary);
      setFailures(payload.results.filter((r) => !r.ok && !r.message.startsWith('Skipped')));
    },
    [initialRows],
  );

  const runValidation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/calculators/validate-all', { method: 'POST' });
      const json = (await res.json()) as ValidationPayload & { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(json.error?.message || `Validation failed (${res.status})`);
      }
      applyResults(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  }, [applyResults]);

  useEffect(() => {
    void runValidation();
  }, [runValidation]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {summary ? (
          <>
            <Badge>{summary.total} total</Badge>
            <Badge>{summary.published} published</Badge>
            <Badge className="bg-emerald-100 text-emerald-900">{summary.passed} passed</Badge>
            {summary.failed > 0 ? (
              <Badge className="bg-red-100 text-red-900">{summary.failed} failed</Badge>
            ) : null}
            {summary.skipped > 0 ? <Badge>{summary.skipped} skipped</Badge> : null}
          </>
        ) : (
          <Badge>{initialRows.length} loaded</Badge>
        )}
        <button
          type="button"
          onClick={() => void runValidation()}
          disabled={loading}
          className="h-9 rounded-md border border-[var(--varnarc-border)] px-3 text-sm hover:bg-[var(--varnarc-muted)] disabled:opacity-50"
        >
          {loading ? 'Validating…' : 'Revalidate all'}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {failures.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Calculators that failed validation</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {failures.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{item.name}</span> ({item.slug}): {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && summary && summary.failed === 0 ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          All published calculators loaded and calculated successfully.
        </p>
      ) : null}

      <CalculatorsDataTable rows={rows} />
    </div>
  );
}
