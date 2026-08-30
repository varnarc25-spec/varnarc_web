'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type Totals = {
  totalUrls: number;
  healthy: number;
  warnings: number;
  critical: number;
};

type Run = {
  id: string;
  status: string;
  mode: string;
  siteUrl: string;
  summary: (Totals & { info?: number; issueCount?: number; scannedAt?: string }) | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  _count?: { issues: number };
};

type Issue = {
  id: string;
  path: string;
  pageType: string;
  issueType: string;
  severity: string;
  status: string;
  message: string;
  recommendedAction: string;
  httpStatus: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  createdAt: string;
  run?: { id: string; finishedAt: string | null; createdAt: string; status: string };
};

function unwrapData<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as { data?: T; success?: boolean };
  return (obj.data ?? json) as T;
}

export default function ConstructionSeoAuditPage() {
  const [totals, setTotals] = useState<Totals>({
    totalUrls: 0,
    healthy: 0,
    warnings: 0,
    critical: 0,
  });
  const [latestRun, setLatestRun] = useState<Run | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [pageTypes, setPageTypes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    pageType: '',
    issueType: '',
    status: 'OPEN',
    severity: 'all',
    runId: '',
  });

  const loadDashboard = useCallback(async () => {
    const res = await fetch('/api/admin/construction/seo-audit/dashboard');
    const json = await res.json();
    const data = unwrapData<{
      latestRun: Run | null;
      totals: Totals;
      issueTypes: string[];
      pageTypes: string[];
    }>(json);
    if (!data) return;
    setLatestRun(data.latestRun);
    setTotals(data.totals);
    setIssueTypes(data.issueTypes ?? []);
    setPageTypes(data.pageTypes ?? []);
    if (data.latestRun?.id && !filters.runId) {
      setFilters((f) => ({ ...f, runId: data.latestRun!.id }));
    }
  }, [filters.runId]);

  const loadRuns = useCallback(async () => {
    const res = await fetch('/api/admin/construction/seo-audit/runs?limit=10');
    const json = await res.json();
    const data = unwrapData<{ items: Run[] }>(json);
    setRuns(data?.items ?? []);
  }, []);

  const loadIssues = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filters.runId) qs.set('runId', filters.runId);
    if (filters.pageType) qs.set('pageType', filters.pageType);
    if (filters.issueType) qs.set('issueType', filters.issueType);
    if (filters.status) qs.set('status', filters.status);
    if (filters.severity) qs.set('severity', filters.severity);
    qs.set('limit', '150');
    const res = await fetch(`/api/admin/construction/seo-audit/issues?${qs}`);
    const json = await res.json();
    const data = unwrapData<{ items: Issue[] }>(json);
    setIssues(data?.items ?? []);
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDashboard(), loadRuns()]);
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadRuns]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (!latestRun) return;
    if (['QUEUED', 'RUNNING_FAST', 'RUNNING_DEFERRED'].includes(latestRun.status)) {
      const t = setInterval(() => {
        void refresh();
        void loadIssues();
      }, 4000);
      return () => clearInterval(t);
    }
  }, [latestRun, refresh, loadIssues]);

  async function enqueue(mode: 'FAST' | 'FULL') {
    setMessage(null);
    const res = await fetch('/api/admin/construction/seo-audit/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
      setMessage('Failed to enqueue scan.');
      return;
    }
    setMessage(
      mode === 'FAST'
        ? 'Fast inventory scan queued (no live crawl).'
        : 'Full scan queued — inventory runs now; crawl continues via queue/cron.',
    );
    await refresh();
  }

  async function resolveIssue(id: string, status: 'RESOLVED' | 'IGNORED') {
    await fetch(`/api/admin/construction/seo-audit/issues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadIssues();
  }

  const severityClass = useMemo(
    () =>
      ({
        CRITICAL: 'bg-red-100 text-red-800',
        WARNING: 'bg-amber-100 text-amber-800',
        INFO: 'bg-slate-100 text-slate-700',
      }) as Record<string, string>,
    [],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Construction SEO Audit"
        description="Internal scan of /construction URLs. Does not auto-rewrite SEO content — review recommended actions manually."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total URLs" value={totals.totalUrls} />
        <StatCard label="Healthy" value={totals.healthy} tone="ok" />
        <StatCard label="Warnings" value={totals.warnings} tone="warn" />
        <StatCard label="Critical" value={totals.critical} tone="crit" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void enqueue('FULL')} disabled={loading}>
          Run full scan
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void enqueue('FAST')}
          disabled={loading}
        >
          Run fast inventory
        </Button>
        <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={loading}>
          Refresh
        </Button>
        {latestRun ? (
          <span className="text-sm text-[var(--varnarc-subtle)]">
            Latest: {latestRun.status}
            {latestRun.finishedAt
              ? ` · scanned ${new Date(latestRun.finishedAt).toLocaleString()}`
              : latestRun.startedAt
                ? ` · started ${new Date(latestRun.startedAt).toLocaleString()}`
                : ''}
          </span>
        ) : null}
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      <section className="rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--varnarc-ink)]">Filters</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="Page type"
            value={filters.pageType}
            onChange={(v) => setFilters((f) => ({ ...f, pageType: v }))}
            options={[
              { value: '', label: 'All' },
              ...pageTypes.map((t) => ({ value: t, label: t })),
            ]}
          />
          <FilterSelect
            label="Issue type"
            value={filters.issueType}
            onChange={(v) => setFilters((f) => ({ ...f, issueType: v }))}
            options={[
              { value: '', label: 'All' },
              ...issueTypes.map((t) => ({ value: t, label: t })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: 'OPEN', label: 'Open' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'IGNORED', label: 'Ignored' },
              { value: 'all', label: 'All' },
            ]}
          />
          <FilterSelect
            label="Severity"
            value={filters.severity}
            onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'INFO', label: 'Info' },
            ]}
          />
          <FilterSelect
            label="Last scanned (run)"
            value={filters.runId}
            onChange={(v) => setFilters((f) => ({ ...f, runId: v }))}
            options={[
              { value: '', label: 'Any run' },
              ...runs.map((r) => ({
                value: r.id,
                label: `${r.status} · ${new Date(r.createdAt).toLocaleString()}`,
              })),
            ]}
          />
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-slate-50 text-xs uppercase text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Path</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Issue</th>
              <th className="px-3 py-2">CWV</th>
              <th className="px-3 py-2">Recommended action</th>
              <th className="px-3 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b border-[var(--varnarc-border)] align-top">
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityClass[issue.severity] ?? ''}`}
                  >
                    {issue.severity}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  <div>{issue.path}</div>
                  <div className="text-[var(--varnarc-subtle)]">{issue.pageType}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{issue.issueType}</td>
                <td className="px-3 py-2">{issue.message}</td>
                <td className="px-3 py-2 text-xs text-[var(--varnarc-subtle)]">
                  {issue.lcp != null || issue.cls != null || issue.inp != null ? (
                    <>
                      {issue.lcp != null ? <div>LCP {issue.lcp}</div> : null}
                      {issue.cls != null ? <div>CLS {issue.cls}</div> : null}
                      {issue.inp != null ? <div>INP {issue.inp}</div> : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="max-w-sm px-3 py-2 text-[var(--varnarc-subtle)]">
                  {issue.recommendedAction}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {issue.status === 'OPEN' ? (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--varnarc-brand)]"
                        onClick={() => void resolveIssue(issue.id, 'RESOLVED')}
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--varnarc-subtle)]"
                        onClick={() => void resolveIssue(issue.id, 'IGNORED')}
                      >
                        Ignore
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs uppercase text-[var(--varnarc-subtle)]">
                      {issue.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!issues.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--varnarc-subtle)]">
                  No issues for the current filters. Run a scan to populate results.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Recent runs</h2>
        <ul className="space-y-2 text-sm">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--varnarc-border)] px-3 py-2"
            >
              <span>
                <span className="font-medium">{run.status}</span>
                <span className="mx-2 text-[var(--varnarc-subtle)]">·</span>
                {run.mode}
                <span className="mx-2 text-[var(--varnarc-subtle)]">·</span>
                {new Date(run.createdAt).toLocaleString()}
                {run._count ? (
                  <span className="ml-2 text-[var(--varnarc-subtle)]">
                    ({run._count.issues} issues)
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--varnarc-brand)]"
                onClick={() => setFilters((f) => ({ ...f, runId: run.id }))}
              >
                View issues
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'ok' | 'warn' | 'crit';
}) {
  const toneClass =
    tone === 'ok'
      ? 'border-green-200 bg-green-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'crit'
          ? 'border-red-200 bg-red-50'
          : 'border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]';
  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--varnarc-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[var(--varnarc-ink)]">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-[var(--varnarc-subtle)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--varnarc-border)] bg-white px-2 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
