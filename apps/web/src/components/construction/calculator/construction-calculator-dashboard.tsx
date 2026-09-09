'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ADVANCED_CONSTRUCTION_CALCULATORS,
  formatInr,
  type ConstructionCostAreaMaterialLine,
  type ConstructionRateDisplay,
} from '@varnarc/validation';
import { LANDING_JOURNEY } from '@/lib/construction/landing';
import { AdvancedCalcIcon } from '@/components/construction/advanced-calculators/advanced-calc-icon';
import { ConstructionScrollTable } from '@/components/construction/construction-scroll-table';
import { cn, cx } from '@/components/construction/styles';

export const CONSTRUCTION_HERO_POINTS = [
  'Estimate costs',
  'Plan materials',
  'Control budget',
  'Complete with confidence',
];

const RENOVATION_CARDS = [
  { href: '/construction/renovation-cost-calculator', title: 'Kitchen', from: 'From ₹ 1.5L' },
  { href: '/construction/renovation-cost-calculator', title: 'Bathroom', from: 'From ₹ 1.2L' },
  { href: '/construction/renovation-cost-calculator', title: 'Flooring', from: 'From ₹ 80/sq ft' },
  { href: '/construction/renovation-cost-calculator', title: 'Painting', from: 'From ₹ 25/sq ft' },
  {
    href: '/construction/renovation-cost-calculator',
    title: 'False ceiling',
    from: 'From ₹ 90/sq ft',
  },
  { href: '/construction/renovation-cost-calculator', title: 'Electrical', from: 'From ₹ 45k' },
  { href: '/construction/renovation-cost-calculator', title: 'Plumbing', from: 'From ₹ 40k' },
  {
    href: '/construction/renovation-cost-calculator',
    title: 'Doors & windows',
    from: 'From ₹ 55k',
  },
];

const NEXT_ACTIONS = [
  { href: '/construction/compare', label: 'Compare materials', icon: 'compare' },
  { href: '/construction/prices', label: 'Check prices near you', icon: 'pin' },
  { href: '/construction/professionals', label: 'Find professionals', icon: 'people' },
  { href: '/construction/projects', label: 'Save project', icon: 'save' },
] as const;

function ActionIcon({ name }: { name: (typeof NEXT_ACTIONS)[number]['icon'] }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-8 w-8 text-[#f97316]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  if (name === 'compare') {
    return (
      <svg {...common}>
        <path d="M8 7h12M8 12h8M8 17h10" />
        <path d="M4 7v.01M4 12v.01M4 17v.01" />
      </svg>
    );
  }
  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }
  if (name === 'people') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M16 14.2a4.8 4.8 0 0 1 4.5 4.8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M14 4v6h5" />
    </svg>
  );
}

export function ConstructionHeroActions({ areaSqft }: { areaSqft?: number }) {
  const qs = areaSqft && areaSqft > 0 ? `?builtUpArea=${Math.round(areaSqft)}` : '';
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link href={`/construction/project/new${qs}`} className={cx.accentBtn}>
        Create project
      </Link>
      <Link href={`/construction/boq${qs}`} className={cx.secondaryBtn}>
        Open BOQ
      </Link>
    </div>
  );
}

export function ConstructionProjectSummaryBar({
  projectName = 'My construction project',
  location,
  areaLabel,
  floors,
  quality,
  total,
  rangeLabel,
  materialCost,
  labourCost,
  otherCost,
}: {
  projectName?: string;
  location: string;
  areaLabel: string;
  floors: number;
  quality: string;
  total: number;
  rangeLabel?: string;
  materialCost: number;
  labourCost: number;
  otherCost: number;
}) {
  const split = materialCost + labourCost + otherCost;
  const pct = (n: number) => (split > 0 ? Math.round((n / split) * 100) : 0);
  return (
    <section
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5"
      aria-label="Project summary"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-7">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Current project
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-[#0b1f3a]">{projectName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Location
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[#0b1f3a]">{location}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Built-up area
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#0b1f3a]">
              {areaLabel}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Floors
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#0b1f3a]">{floors}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Construction quality
            </dt>
            <dd className="mt-0.5 text-sm font-semibold capitalize text-[#0b1f3a]">{quality}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Estimated total cost
            </dt>
            <dd className="mt-0.5 text-sm font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(total)}
            </dd>
            {rangeLabel ? <p className="text-[10px] text-slate-500">{rangeLabel}</p> : null}
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Materials ({pct(materialCost)}%)
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#0b1f3a]">
              {formatInr(materialCost)}
            </dd>
            <p className="text-[10px] text-slate-500">
              Labour ({pct(labourCost)}%) {formatInr(labourCost)}
            </p>
          </div>
        </dl>
        <Link href="/construction/project/new" className={cn(cx.secondaryBtn, 'shrink-0')}>
          Edit project
        </Link>
      </div>
    </section>
  );
}

export function ConstructionMaterialLinesTable({
  lines,
  quantityHref,
  rateDisplay,
  compact = false,
}: {
  lines: ConstructionCostAreaMaterialLine[];
  quantityHref?: string;
  rateDisplay?: ConstructionRateDisplay;
  compact?: boolean;
}) {
  const sourceLabel = rateDisplay?.publicLabel ?? 'Indicative planning rate';
  const confidence = rateDisplay?.isIndicative ? 'LOW' : 'MEDIUM';
  return (
    <div className={cn(cx.card, 'p-0')}>
      <ConstructionScrollTable minWidthClass={compact ? 'min-w-[560px]' : 'min-w-[800px]'}>
        <table
          className={cn('w-full text-left text-sm', compact ? 'min-w-[560px]' : 'min-w-[800px]')}
        >
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Material</th>
              <th className="px-3 py-2.5 font-semibold">Quantity</th>
              <th className="px-3 py-2.5 font-semibold">Unit</th>
              <th className="px-3 py-2.5 font-semibold">Indicative rate (₹)</th>
              <th className="px-3 py-2.5 font-semibold">Estimated cost (₹)</th>
              {compact ? null : <th className="px-3 py-2.5 font-semibold">Source</th>}
              {compact ? null : <th className="px-3 py-2.5 font-semibold">Confidence</th>}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-[#0b1f3a]">
                  {quantityHref ? (
                    <Link href={quantityHref} className={cx.link}>
                      {line.label}
                    </Link>
                  ) : (
                    line.label
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{line.quantity.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-slate-600">{line.unit}</td>
                <td className="px-3 py-2 tabular-nums text-slate-600">
                  {line.rate == null ? '—' : line.rate.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 tabular-nums font-semibold">
                  {line.cost == null ? 'Lot' : formatInr(line.cost)}
                </td>
                {compact ? null : (
                  <td className="px-3 py-2 text-xs text-slate-600">{sourceLabel}</td>
                )}
                {compact ? null : (
                  <td className="px-3 py-2 text-xs text-slate-600">{confidence}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </ConstructionScrollTable>
    </div>
  );
}

export function ConstructionCostDonut({
  materialCost,
  labourCost,
  otherCost,
  areaSqft,
  quantityHref,
  boqHref: boqHrefProp,
  compact = false,
}: {
  materialCost: number;
  labourCost: number;
  otherCost: number;
  areaSqft?: number;
  quantityHref?: string;
  boqHref?: string;
  compact?: boolean;
}) {
  const split = materialCost + labourCost + otherCost;
  const pct = (n: number) => (split > 0 ? Math.round((n / split) * 100) : 0);
  const materialPct = pct(materialCost);
  const labourPct = pct(labourCost);
  const otherPct = Math.max(0, 100 - materialPct - labourPct);
  const donut = `conic-gradient(#0b1f3a 0 ${materialPct}%, #f97316 ${materialPct}% ${materialPct + labourPct}%, #cbd5e1 ${materialPct + labourPct}% 100%)`;
  const boqHref =
    boqHrefProp ??
    (areaSqft && areaSqft > 0
      ? `/construction/boq?builtUpArea=${Math.round(areaSqft)}`
      : '/construction/boq');
  return (
    <aside className={cn(cx.card, 'space-y-3 p-4')}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Material cost estimate
      </p>
      <p className="text-xl font-extrabold tabular-nums text-[#0b1f3a]">
        {formatInr(materialCost)}
        <span className="ml-1 text-xs font-semibold text-slate-500">({materialPct}% of total)</span>
      </p>
      <div className="flex items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-full"
          style={{ background: donut, aspectRatio: '1 / 1' }}
          role="img"
          aria-label={`Materials ${materialPct}%, labour ${labourPct}%, other ${otherPct}%`}
        >
          <div className="m-[0.85rem] flex h-[calc(100%-1.7rem)] w-[calc(100%-1.7rem)] flex-col items-center justify-center rounded-full bg-white text-center">
            <span className="text-base font-extrabold text-[#0b1f3a]">{materialPct}%</span>
            <span className="text-[9px] text-slate-500">Materials</span>
          </div>
        </div>
        <ul className="space-y-0.5 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0b1f3a]" /> Materials {materialPct}%
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Labour {labourPct}%
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" /> Other {otherPct}%
          </li>
        </ul>
      </div>
      {quantityHref ? (
        <Link href={quantityHref} className={cn(cx.link, 'inline-block')}>
          View quantity breakdown →
        </Link>
      ) : null}
      <a href="#cost-breakdown" className={cn(cx.link, 'block')}>
        View detailed breakdown →
      </a>
      {compact ? null : (
        <Link href={boqHref} className={cn(cx.accentBtn, 'w-full')}>
          Send to BOQ
        </Link>
      )}
    </aside>
  );
}

export function ConstructionBoqPreview({
  rows,
  boqHref = '/construction/boq',
}: {
  rows: Array<{ id: string; label: string; amount: number; percentOfTotal: number }>;
  boqHref?: string;
}) {
  const [tab, setTab] = useState(0);
  const active = rows[tab] ?? rows[0];
  if (!rows.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">BOQ Generator</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={boqHref} className={cx.secondaryBtn}>
            Download PDF
          </Link>
          <Link href={boqHref} className={cx.secondaryBtn}>
            Export Excel
          </Link>
          <Link href="/construction/projects" className={cx.secondaryBtn}>
            Save BOQ
          </Link>
          <Link href="/construction/suppliers" className={cx.primaryBtn}>
            Get supplier quotes
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {rows.map((row, index) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setTab(index)}
            className={cn(
              'min-h-10 rounded-lg px-3 text-sm font-semibold',
              cx.focus,
              index === tab
                ? 'bg-[#0b1f3a] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className={cn(cx.card, 'p-0')}>
        <ConstructionScrollTable minWidthClass="min-w-[640px]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Item description</th>
                <th className="px-3 py-2.5 font-semibold">Share</th>
                <th className="px-3 py-2.5 font-semibold">Amount (₹)</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-t border-slate-100',
                    row.id === active?.id ? 'bg-orange-50/60' : '',
                  )}
                >
                  <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-[#0b1f3a]">{row.label}</td>
                  <td className="px-3 py-2 tabular-nums">{row.percentOfTotal}%</td>
                  <td className="px-3 py-2 tabular-nums">{formatInr(row.amount)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <span aria-hidden>✓</span> Included
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConstructionScrollTable>
      </div>
      <p className="text-sm">
        <Link href={boqHref} className={cx.link}>
          View all items ({rows.length}) →
        </Link>
      </p>
    </section>
  );
}

export function ConstructionCalculatorModules({ areaSqft }: { areaSqft?: number } = {}) {
  const renovationTotal = Math.round((areaSqft && areaSqft > 0 ? areaSqft : 1500) * 190);
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Renovation Cost Calculator</h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RENOVATION_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={cn(
                  cx.card,
                  'flex aspect-square flex-col items-center justify-center p-3 text-center transition hover:border-[#f97316]',
                )}
              >
                <span className="text-sm font-semibold text-[#0b1f3a]">{card.title}</span>
                <p className="mt-1 text-xs text-[#f97316]">{card.from}</p>
              </Link>
            ))}
          </div>
          <aside className={cn(cx.card, 'flex flex-col justify-between p-5')}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Renovation estimate
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
                {formatInr(renovationTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Indicative starting package — not a quote.
              </p>
              <ul className="mt-4 space-y-1 text-xs text-slate-600">
                <li>Materials 48%</li>
                <li>Labour 32%</li>
                <li>Other 20%</li>
              </ul>
            </div>
            <Link
              href="/construction/renovation-cost-calculator"
              className={cn(cx.primaryBtn, 'mt-6')}
            >
              Customize renovation →
            </Link>
          </aside>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Advanced calculators</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {ADVANCED_CONSTRUCTION_CALCULATORS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  cx.card,
                  'flex h-full flex-col items-center gap-2 px-3 py-4 text-center text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                <AdvancedCalcIcon name={item.icon} />
                {item.name.replace(' Calculator', '')}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Project timeline</h2>
        <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {LANDING_JOURNEY.slice(0, 6).map((step, index) => (
            <li key={step.key} className="relative">
              <Link href={step.href} className="flex flex-col items-center text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1f3a] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="mt-2 text-sm font-semibold text-[#0b1f3a]">{step.title}</span>
                <span className="mt-1 text-xs text-slate-500">{step.description}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Next best actions</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NEXT_ACTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  cx.card,
                  'flex items-center gap-3 p-5 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                <ActionIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
