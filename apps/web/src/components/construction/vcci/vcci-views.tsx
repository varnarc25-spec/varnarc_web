'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SimpleLineChart } from '@/components/shared/simple-chart';
import type { VcciHubPayload, VcciSnapshot } from '@/lib/construction/vcci/api';
import { cn, cx } from '@/components/construction/styles';
import { VCCI_QUALIFICATION } from '@varnarc/validation';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function VcciHistoryChart({ history }: { history: VcciSnapshot[] }) {
  const data = useMemo(
    () =>
      [...history]
        .sort((a, b) => (a.calculationDate < b.calculationDate ? -1 : 1))
        .map((h) => ({
          date: formatDate(h.calculationDate),
          index: h.indexValue,
        })),
    [history],
  );

  if (data.length < 3) {
    return (
      <p className="text-sm text-slate-600">
        Historical chart appears when at least three calculation dates are published for this
        series.
      </p>
    );
  }

  return (
    <div>
      <SimpleLineChart
        data={data}
        xKey="date"
        series={[{ key: 'index', color: '#0b1f3a', name: 'VCCI' }]}
        height={280}
        showDots
        connectNulls={false}
      />
      <p className="mt-2 text-xs text-slate-500">
        Points are calculation dates only — gaps are not filled with interpolated index values.
      </p>
    </div>
  );
}

export function VcciPublishedView({
  hub,
  title,
}: {
  hub: Extract<VcciHubPayload, { published: true }> | VcciHubPayload;
  title?: string;
}) {
  const [tab, setTab] = useState<'overall' | 'components'>('overall');
  const current = hub.current;
  if (!current) return null;

  const weights = current.componentWeights;
  const indexes = current.componentIndexes;

  return (
    <div className="space-y-8">
      <section className={cn(cx.card, 'p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {title ?? 'National / overall VCCI'} · methodology {current.methodologyVersion}
        </p>
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-[#0b1f3a]">
          {current.indexValue.toFixed(1)}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Calculation date {formatDate(current.calculationDate)}
          {current.coverageRatio != null
            ? ` · coverage ${(current.coverageRatio * 100).toFixed(0)}%`
            : ''}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-semibold',
            tab === 'overall' ? 'bg-[#0b1f3a] text-white' : 'bg-white ring-1 ring-slate-200',
          )}
          onClick={() => setTab('overall')}
        >
          Overall
        </button>
        <button
          type="button"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-semibold',
            tab === 'components' ? 'bg-[#0b1f3a] text-white' : 'bg-white ring-1 ring-slate-200',
          )}
          onClick={() => setTab('components')}
        >
          Components
        </button>
      </div>

      {tab === 'overall' ? (
        <section>
          <h2 className="mb-3 text-lg font-bold text-[#0b1f3a]">Historical chart</h2>
          {hub.showChart ? (
            <VcciHistoryChart history={hub.history} />
          ) : (
            <p className="text-sm text-slate-600">
              Not enough published calculation dates for a chart yet.
            </p>
          )}
        </section>
      ) : (
        <section>
          <h2 className="mb-3 text-lg font-bold text-[#0b1f3a]">Component view</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hub.availableComponents.map((c) => {
              const idx = indexes[c.key];
              const w = weights[c.key];
              return (
                <li key={c.key} className={cn(cx.card, 'p-4')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0b1f3a]">{c.label}</p>
                      <p className="text-xs text-slate-500">
                        Weight {w != null ? `${(w * 100).toFixed(0)}%` : '—'}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold tabular-nums text-[#0b1f3a]">
                      {idx != null ? idx.toFixed(1) : '—'}
                    </p>
                  </div>
                  <Link
                    href={`/construction/cost-index/components/${c.key}`}
                    className={cn(cx.link, 'mt-3 inline-block text-sm')}
                  >
                    Open component series →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {hub.availableCities.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold text-[#0b1f3a]">City view</h2>
          <ul className="flex flex-wrap gap-2">
            {hub.availableCities.map((slug) => (
              <li key={slug}>
                <Link href={`/construction/cost-index/city/${slug}`} className={cx.secondaryBtn}>
                  {slug}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
        {VCCI_QUALIFICATION}
      </p>
    </div>
  );
}

export function VcciUnpublishedView({
  blockers,
  frameworkVersion,
}: {
  blockers: string[];
  frameworkVersion: string;
}) {
  return (
    <div className={cn(cx.card, 'space-y-4 p-6')}>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Framework ready · index not publicly released
      </p>
      <h2 className="text-xl font-bold text-[#0b1f3a]">
        VCCI values are withheld until data quality is sufficient
      </h2>
      <p className="text-sm leading-relaxed text-slate-600">
        Methodology version <strong>{frameworkVersion}</strong> defines baseline, component weights
        and source rules. Varnarc does not publish arbitrary index numbers. Numeric national, city
        and component views appear only after quality-gated snapshots are marked published.
      </p>
      {blockers.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/construction/cost-index/methodology" className={cx.primaryBtn}>
          Read methodology
        </Link>
        <Link href="/construction/prices" className={cx.secondaryBtn}>
          Material prices hub
        </Link>
      </div>
    </div>
  );
}
