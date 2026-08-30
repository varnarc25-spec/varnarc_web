'use client';

import { useMemo, useState } from 'react';
import { SimpleLineChart } from '@/components/shared/simple-chart';
import type { PriceObservation } from '@/lib/construction/prices-hub/api';
import { cn, cx } from '@/components/construction/styles';
import {
  PRICE_HISTORY_CHART_INTERVALS,
  PRICE_HISTORY_CHART_MIN_POINTS,
  PRICE_HISTORY_DISCLAIMER,
  filterObservationsByInterval,
  type PriceHistoryChartInterval,
  type PricePeriodChange,
} from '@varnarc/validation';

function money(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChangeCard({ change, currency }: { change: PricePeriodChange; currency: string }) {
  if (!change.available || change.absolute == null || change.percent == null) {
    return (
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {change.label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-400">No data</p>
      </div>
    );
  }
  const up = change.absolute > 0;
  const flat = change.absolute === 0;
  return (
    <div className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {change.label} change
      </p>
      <p
        className={cn(
          'mt-1 text-sm font-bold tabular-nums',
          flat ? 'text-slate-600' : up ? 'text-rose-700' : 'text-emerald-700',
        )}
      >
        {flat ? '—' : up ? '+' : ''}
        {money(change.absolute, currency)}{' '}
        <span className="font-semibold">
          ({flat ? '0%' : `${up ? '+' : ''}${change.percent}%`})
        </span>
      </p>
      {change.baselineDate ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          vs {formatDate(change.baselineDate)}
          {change.usedNearestPrior ? ' · nearest prior observation' : ''}
        </p>
      ) : null}
    </div>
  );
}

function ObservationDetail({ obs, onClose }: { obs: PriceObservation; onClose: () => void }) {
  return (
    <div className={cn(cx.card, 'border-[#0b1f3a]/20 bg-slate-50 p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Observation detail
          </p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">
            {money(obs.price, obs.currency)}
            <span className="text-sm font-normal text-slate-500"> / {obs.unit}</span>
          </p>
        </div>
        <button type="button" onClick={onClose} className={cx.secondaryBtn}>
          Close
        </button>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs uppercase text-slate-500">Effective from</dt>
          <dd className="font-semibold text-[#0b1f3a]">{formatDate(obs.effectiveFrom)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Last updated</dt>
          <dd className="font-semibold text-[#0b1f3a]">{formatDate(obs.lastUpdated)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Freshness</dt>
          <dd className="font-semibold text-[#0b1f3a]">{obs.freshnessLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Source category</dt>
          <dd className="font-semibold text-[#0b1f3a]">{obs.sourceCategoryLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Source label</dt>
          <dd className="font-semibold text-[#0b1f3a]">{obs.source ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Brand</dt>
          <dd className="font-semibold text-[#0b1f3a]">{obs.brand?.name ?? '—'}</dd>
        </div>
        {obs.minPrice != null && obs.maxPrice != null ? (
          <div>
            <dt className="text-xs uppercase text-slate-500">Range</dt>
            <dd className="font-semibold text-[#0b1f3a]">
              {money(obs.minPrice, obs.currency)} – {money(obs.maxPrice, obs.currency)}
            </dd>
          </div>
        ) : null}
        {obs.sourceUrl ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-slate-500">Source URL</dt>
            <dd>
              <a href={obs.sourceUrl} target="_blank" rel="noopener noreferrer" className={cx.link}>
                {obs.sourceUrl}
              </a>
            </dd>
          </div>
        ) : null}
        {obs.notes ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs uppercase text-slate-500">Notes</dt>
            <dd className="text-slate-700">{obs.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function PriceHistoryPanel({
  current,
  history,
  changes,
  materialLabel,
  cityName,
}: {
  current: PriceObservation | null;
  history: PriceObservation[];
  changes: PricePeriodChange[];
  materialLabel: string;
  cityName: string;
}) {
  const [interval, setInterval] = useState<PriceHistoryChartInterval>('3M');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterObservationsByInterval(history, interval),
    [history, interval],
  );

  const chartData = useMemo(
    () =>
      filtered.map((h) => ({
        id: h.id,
        date: formatDate(h.effectiveFrom),
        price: h.price,
      })),
    [filtered],
  );

  const selected =
    (selectedId ? history.find((h) => h.id === selectedId) : null) ??
    (selectedId ? filtered.find((h) => h.id === selectedId) : null);

  const currency = current?.currency ?? history[0]?.currency ?? 'INR';
  const unit = current?.unit ?? history[0]?.unit ?? '';
  const canChart = filtered.length >= PRICE_HISTORY_CHART_MIN_POINTS;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0b1f3a]">
          Price history · {materialLabel} in {cityName}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Period changes use the nearest real observation on or before each lookback date. Gaps are
          not filled with interpolated prices.
        </p>
      </div>

      {current ? (
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Current observation · {current.freshnessLabel}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#0b1f3a]">
            {money(current.price, currency)}
            <span className="text-base font-normal text-slate-500"> / {unit}</span>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {changes.map((c) => (
              <ChangeCard key={c.key} change={c} currency={currency} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          No current observation for this pair — historical points below are for context only.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {PRICE_HISTORY_CHART_INTERVALS.map((i) => (
          <button
            key={i.key}
            type="button"
            onClick={() => setInterval(i.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition',
              interval === i.key
                ? 'bg-[#0b1f3a] text-white'
                : 'bg-white text-[#0b1f3a] ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      {canChart ? (
        <div>
          <SimpleLineChart
            data={chartData}
            xKey="date"
            series={[{ key: 'price', color: '#0b1f3a', name: 'Observed price' }]}
            height={300}
            showDots
            connectNulls={false}
            onPointClick={(payload) => {
              if (typeof payload.id === 'string') setSelectedId(payload.id);
            }}
          />
          <p className="mt-2 text-xs text-slate-500">
            Dots are individual observations. Lines connect consecutive observed points only — empty
            stretches mean no recorded observation, not a flat price. Click a point or row to
            inspect source metadata.
          </p>
        </div>
      ) : (
        <div className={cn(cx.card, 'p-4 text-sm text-slate-600')}>
          Need at least {PRICE_HISTORY_CHART_MIN_POINTS} observations in the selected {interval}{' '}
          window for a chart. Showing {filtered.length} in this range
          {history.length ? ` (${history.length} total).` : '.'}
        </div>
      )}

      {selected ? <ObservationDetail obs={selected} onClose={() => setSelectedId(null)} /> : null}

      <div>
        <h3 className="text-base font-bold text-[#0b1f3a]">Observations</h3>
        <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
          {[...filtered].reverse().map((obs) => (
            <li key={obs.id}>
              <button
                type="button"
                onClick={() => setSelectedId(obs.id)}
                className={cn(
                  'flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm transition hover:bg-slate-50',
                  selectedId === obs.id && 'bg-slate-50',
                )}
              >
                <span className="font-semibold tabular-nums text-[#0b1f3a]">
                  {money(obs.price, obs.currency)}
                  <span className="font-normal text-slate-500"> / {obs.unit}</span>
                </span>
                <span className="text-slate-600">{formatDate(obs.effectiveFrom)}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {obs.sourceCategoryLabel}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    obs.isCurrent ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900',
                  )}
                >
                  {obs.isOlderData ? 'Older data' : obs.freshnessLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!filtered.length ? (
          <p className="mt-2 text-sm text-slate-600">No observations in this interval.</p>
        ) : null}
      </div>

      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-100">
        {PRICE_HISTORY_DISCLAIMER}
      </p>
    </section>
  );
}
