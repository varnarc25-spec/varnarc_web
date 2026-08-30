'use client';

import type { MaterialPricePositionResult } from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

function money(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function bandClass(band: string) {
  if (band === 'low') return 'bg-emerald-50 text-emerald-900 ring-emerald-200';
  if (band === 'high') return 'bg-amber-50 text-amber-950 ring-amber-200';
  return 'bg-slate-100 text-slate-800 ring-slate-200';
}

export function PricePositionResultCard({
  result,
  materialLabel,
  cityName,
  className,
}: {
  result: MaterialPricePositionResult;
  materialLabel: string;
  cityName: string;
  className?: string;
}) {
  if (!result.ok) {
    return (
      <aside
        className={cn(cx.card, 'space-y-2 border-amber-200 bg-amber-50/60 p-4 sm:p-5', className)}
      >
        <h3 className="text-sm font-bold text-[#0b1f3a]">Price position unavailable</h3>
        <p className="text-sm text-slate-700">{result.reason}</p>
        <p className="text-xs text-slate-500">
          Window: last {result.windowDays} days · {result.observationCount} observation
          {result.observationCount === 1 ? '' : 's'}
        </p>
      </aside>
    );
  }

  return (
    <section
      className={cn(cx.card, 'space-y-4 p-4 sm:p-5', className)}
      aria-label="Material price position"
      data-price-position-band={result.positionBand}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current price position
          </p>
          <p
            className={cn(
              'mt-1 inline-flex rounded-lg px-2.5 py-1 text-sm font-bold ring-1',
              bandClass(result.positionBand),
            )}
          >
            {result.positionSentence}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {materialLabel} · {cityName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current price
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
            {money(result.currentPrice, result.currency)}
            <span className="ml-1 text-sm font-semibold text-slate-500">/ {result.unit}</span>
          </p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Recent range
          </dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-slate-800">
            {money(result.recentRange.low, result.currency)} –{' '}
            {money(result.recentRange.high, result.currency)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Percentile in window
          </dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-slate-800">
            {result.percentile}th
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Recent trend
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800">{result.recentTrendLabel}</dd>
          {result.trendChangePercent != null ? (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {result.trendChangePercent > 0 ? '+' : ''}
              {result.trendChangePercent}% vs earlier baseline
              {result.trendBaselineDateIso ? ` (${formatDate(result.trendBaselineDateIso)})` : ''}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Data freshness
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-800">
            {result.dataFreshness.label}
          </dd>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {result.dataFreshness.ageDays != null
              ? `${result.dataFreshness.ageDays} day(s) since observation`
              : 'Age unknown'}
            {' · '}
            observed {formatDate(result.currentEffectiveFromIso)}
          </p>
        </div>
      </dl>

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Historical window:</span>{' '}
          {result.windowLabel} ({formatDate(result.windowStartIso)} –{' '}
          {formatDate(result.windowEndIso)}) · {result.observationCount} reliable observation
          {result.observationCount === 1 ? '' : 's'}
        </p>
        <p className="mt-1 text-slate-500">{result.recentTrendDescription}</p>
      </div>

      {result.projectImpact ? (
        <div className="rounded-lg border border-[#0b1f3a]/15 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Project cost sensitivity (illustrative)
          </p>
          <p className="mt-1 leading-relaxed">{result.projectImpact.copy}</p>
          <p className="mt-2 text-xs text-slate-500">
            Illustrative unit change only — not a prediction that prices will move by this amount.
          </p>
        </div>
      ) : null}

      <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
        {result.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">{result.qualification}</p>
    </section>
  );
}
