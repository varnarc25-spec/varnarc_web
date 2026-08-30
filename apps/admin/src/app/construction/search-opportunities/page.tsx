'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type Opportunity = {
  id: string;
  displayQuery: string;
  intent: string;
  opportunityType: string;
  opportunityTypeLabel?: string;
  searchCount: number;
  zeroResultCount: number;
  clickCount: number;
  avgResultCount: number;
  ctr: number;
  zeroResultRate: number;
  windowDays: number;
  status: 'OPEN' | 'PLANNED' | 'IMPLEMENTED' | 'IGNORED';
  notes: string | null;
  evidence: { summary?: string; recommendation?: string } | null;
  lastSeenAt: string;
};

type Dashboard = {
  windowDays: number;
  eventCount: number;
  statusCounts: Record<string, number>;
  opportunityTypeCounts: Record<string, number>;
  highlights: Opportunity[];
  opportunityTypes: Array<{ id: string; label: string }>;
  intents: string[];
};

function unwrapData<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as { data?: T };
  return (obj.data ?? json) as T;
}

export default function ConstructionSearchOpportunitiesPage() {
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [status, setStatus] = useState('all');
  const [opportunityType, setOpportunityType] = useState('');
  const [intent, setIntent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ windowDays: String(windowDays) });
      const listQs = new URLSearchParams({
        windowDays: String(windowDays),
        status,
        limit: '80',
      });
      if (opportunityType) listQs.set('opportunityType', opportunityType);
      if (intent) listQs.set('intent', intent);

      const [dashRes, listRes] = await Promise.all([
        fetch(`/api/admin/construction/search-opportunities/dashboard?${qs}`),
        fetch(`/api/admin/construction/search-opportunities?${listQs}`),
      ]);
      const dashJson = await dashRes.json();
      const listJson = await listRes.json();
      setDashboard(unwrapData<Dashboard>(dashJson));
      const list = unwrapData<{ items: Opportunity[] }>(listJson);
      setItems(list?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [windowDays, status, opportunityType, intent]);

  useEffect(() => {
    void load();
  }, [load]);

  async function aggregate() {
    setMessage(null);
    const res = await fetch('/api/admin/construction/search-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'aggregate' }),
    });
    if (!res.ok) {
      setMessage('Aggregation failed.');
      return;
    }
    setMessage('Aggregation completed.');
    await load();
  }

  async function updateStatus(id: string, next: 'PLANNED' | 'IMPLEMENTED' | 'IGNORED' | 'OPEN') {
    await fetch(`/api/admin/construction/search-opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Construction Search Opportunities"
        description="Privacy-safe aggregates of construction search demand. No user IDs or raw PII — scrubbed queries only."
      />

      <div className="flex flex-wrap items-center gap-2">
        {([7, 30, 90] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setWindowDays(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              windowDays === d
                ? 'bg-[var(--varnarc-brand)] text-white'
                : 'border border-[var(--varnarc-border)] bg-white text-[var(--varnarc-ink)]'
            }`}
          >
            {d} days
          </button>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => void aggregate()}
          disabled={loading}
        >
          Re-aggregate
        </Button>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
        {dashboard ? (
          <span className="text-sm text-[var(--varnarc-subtle)]">
            {dashboard.eventCount.toLocaleString('en-IN')} privacy-safe events in window
          </span>
        ) : null}
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open" value={dashboard?.statusCounts?.OPEN ?? 0} />
        <Stat label="Planned" value={dashboard?.statusCounts?.PLANNED ?? 0} tone="warn" />
        <Stat label="Implemented" value={dashboard?.statusCounts?.IMPLEMENTED ?? 0} tone="ok" />
        <Stat label="Ignored" value={dashboard?.statusCounts?.IGNORED ?? 0} />
      </div>

      <section className="rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Filters</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs">
            <span className="mb-1 block font-medium text-[var(--varnarc-subtle)]">Status</span>
            <select
              className="w-full rounded-lg border border-[var(--varnarc-border)] px-2 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="OPEN">Open</option>
              <option value="PLANNED">Planned</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="IGNORED">Ignored</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium text-[var(--varnarc-subtle)]">
              Opportunity type
            </span>
            <select
              className="w-full rounded-lg border border-[var(--varnarc-border)] px-2 py-2 text-sm"
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
            >
              <option value="">All</option>
              {(dashboard?.opportunityTypes ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium text-[var(--varnarc-subtle)]">Intent</span>
            <select
              className="w-full rounded-lg border border-[var(--varnarc-border)] px-2 py-2 text-sm"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            >
              <option value="">All</option>
              {(dashboard?.intents ?? []).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <ul className="space-y-3">
        {items.map((item) => {
          const evidence = item.evidence ?? {};
          return (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--varnarc-ink)]">
                    {item.displayQuery}
                  </p>
                  <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">
                    {evidence.summary ??
                      `${item.searchCount.toLocaleString('en-IN')} searches · ${item.opportunityTypeLabel ?? item.opportunityType}`}
                  </p>
                  <p className="mt-2 text-sm text-[var(--varnarc-ink)]">
                    →{' '}
                    {evidence.recommendation ??
                      'Review as a potential feature/content opportunity.'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase">
                  {item.status}
                </span>
              </div>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Searches" value={item.searchCount.toLocaleString('en-IN')} />
                <Metric label="Intent" value={item.intent} />
                <Metric label="Avg results" value={item.avgResultCount.toFixed(1)} />
                <Metric label="CTR" value={`${(item.ctr * 100).toFixed(1)}%`} />
                <Metric
                  label="Zero-result %"
                  value={`${(item.zeroResultRate * 100).toFixed(1)}%`}
                />
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.status !== 'PLANNED' ? (
                  <ActionBtn onClick={() => void updateStatus(item.id, 'PLANNED')}>
                    Mark planned
                  </ActionBtn>
                ) : null}
                {item.status !== 'IMPLEMENTED' ? (
                  <ActionBtn onClick={() => void updateStatus(item.id, 'IMPLEMENTED')}>
                    Mark implemented
                  </ActionBtn>
                ) : null}
                {item.status !== 'IGNORED' ? (
                  <ActionBtn onClick={() => void updateStatus(item.id, 'IGNORED')}>
                    Mark ignored
                  </ActionBtn>
                ) : null}
                {item.status !== 'OPEN' ? (
                  <ActionBtn onClick={() => void updateStatus(item.id, 'OPEN')}>Reopen</ActionBtn>
                ) : null}
              </div>
            </li>
          );
        })}
        {!items.length ? (
          <li className="rounded-xl border border-dashed border-[var(--varnarc-border)] p-8 text-center text-sm text-[var(--varnarc-subtle)]">
            No opportunities yet for this window. Searches will appear after privacy-safe events
            accumulate — click Re-aggregate to refresh.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const toneClass =
    tone === 'ok'
      ? 'border-green-200 bg-green-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : 'border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]';
  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-medium uppercase text-[var(--varnarc-subtle)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--varnarc-subtle)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[var(--varnarc-border)] px-2.5 py-1 text-xs font-semibold text-[var(--varnarc-ink)] hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
