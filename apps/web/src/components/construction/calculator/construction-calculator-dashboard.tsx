'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatInr, type ConstructionCostAreaMaterialLine } from '@varnarc/validation';
import { LANDING_JOURNEY } from '@/lib/construction/landing';
import { cn, cx } from '@/components/construction/styles';

export const CONSTRUCTION_HERO_POINTS = [
  'Estimate costs',
  'Plan materials',
  'Control budget',
  'Complete with confidence',
];

export const ADVANCED_CALCULATORS = [
  { href: '/construction/aac-block-calculator', label: 'AAC block' },
  { href: '/construction/plaster-calculator', label: 'Wall area' },
  { href: '/construction/footing-calculator', label: 'Excavation' },
  { href: '/construction/rcc-calculator', label: 'RCC' },
  { href: '/construction/slab-calculator', label: 'Slab' },
  { href: '/construction/paint-calculator', label: 'Paint' },
  { href: '/construction/flooring-calculator', label: 'Flooring' },
];

const RENOVATION_CARDS = [
  {
    href: '/construction/renovation-cost-calculator',
    title: 'Kitchen renovation',
    from: 'From ₹ 1.5L',
  },
  {
    href: '/construction/renovation-cost-calculator',
    title: 'Bathroom renovation',
    from: 'From ₹ 1.2L',
  },
  { href: '/construction/renovation-cost-calculator', title: 'Painting', from: 'From ₹ 25/sq ft' },
  {
    href: '/construction/renovation-cost-calculator',
    title: 'Flooring redo',
    from: 'From ₹ 80/sq ft',
  },
];

const NEXT_ACTIONS = [
  { href: '/construction/compare', label: 'Compare materials' },
  { href: '/construction/prices', label: 'Check prices near you' },
  { href: '/construction/professionals', label: 'Find professionals' },
  { href: '/construction/projects', label: 'Save project' },
];

export function ConstructionHeroActions({ areaSqft }: { areaSqft?: number }) {
  const qs = areaSqft && areaSqft > 0 ? `?builtUpArea=${Math.round(areaSqft)}` : '';
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link href={`/construction/project/new${qs}`} className={cx.accentBtn}>
        Create project
      </Link>
      <Link href={`/construction/boq-generator${qs}`} className={cx.secondaryBtn}>
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
      className="rounded-2xl bg-[#0b1f3a] px-4 py-4 text-white shadow-sm sm:px-6"
      aria-label="Project summary"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Current project
          </p>
          <p className="mt-0.5 text-lg font-bold">{projectName}</p>
          <p className="mt-1 text-sm text-white/75">
            {location} · {areaLabel} · {floors} floor{floors > 1 ? 's' : ''} · {quality}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Estimated total cost
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{formatInr(total)}</p>
          {rangeLabel ? <p className="text-xs text-white/70">{rangeLabel}</p> : null}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-white/60">Materials ({pct(materialCost)}%)</dt>
          <dd className="font-semibold tabular-nums">{formatInr(materialCost)}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">Labour ({pct(labourCost)}%)</dt>
          <dd className="font-semibold tabular-nums">{formatInr(labourCost)}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">Other ({pct(otherCost)}%)</dt>
          <dd className="font-semibold tabular-nums">{formatInr(otherCost)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ConstructionMaterialLinesTable({
  lines,
}: {
  lines: ConstructionCostAreaMaterialLine[];
}) {
  return (
    <div className={cn(cx.card, 'overflow-x-auto p-0')}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Material</th>
            <th className="px-3 py-2.5 font-semibold">Quantity</th>
            <th className="px-3 py-2.5 font-semibold">Unit</th>
            <th className="px-3 py-2.5 font-semibold">Indicative rate (₹)</th>
            <th className="px-3 py-2.5 font-semibold">Estimated cost (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-[#0b1f3a]">{line.label}</td>
              <td className="px-3 py-2 tabular-nums">{line.quantity.toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-slate-600">{line.unit}</td>
              <td className="px-3 py-2 tabular-nums text-slate-600">
                {line.rate == null ? '—' : line.rate.toLocaleString('en-IN')}
              </td>
              <td className="px-3 py-2 tabular-nums font-semibold">
                {line.cost == null ? 'Lot' : formatInr(line.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConstructionCostDonut({
  materialCost,
  labourCost,
  otherCost,
  areaSqft,
}: {
  materialCost: number;
  labourCost: number;
  otherCost: number;
  areaSqft?: number;
}) {
  const split = materialCost + labourCost + otherCost;
  const pct = (n: number) => (split > 0 ? Math.round((n / split) * 100) : 0);
  const materialPct = pct(materialCost);
  const labourPct = pct(labourCost);
  const otherPct = Math.max(0, 100 - materialPct - labourPct);
  const donut = `conic-gradient(#0b1f3a 0 ${materialPct}%, #f97316 ${materialPct}% ${materialPct + labourPct}%, #cbd5e1 ${materialPct + labourPct}% 100%)`;
  const boqHref =
    areaSqft && areaSqft > 0
      ? `/construction/boq-generator?builtUpArea=${Math.round(areaSqft)}`
      : '/construction/boq-generator';
  return (
    <aside className={cn(cx.card, 'space-y-4 p-4')}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Materials share
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
          {formatInr(materialCost)}
        </p>
        <p className="text-xs text-slate-500">{materialPct}% of estimated total</p>
      </div>
      <div
        className="mx-auto h-36 w-36 rounded-full"
        style={{ background: donut }}
        role="img"
        aria-label={`Materials ${materialPct}%, labour ${labourPct}%, other ${otherPct}%`}
      >
        <div className="m-[1.35rem] flex h-[calc(100%-2.7rem)] w-[calc(100%-2.7rem)] flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-extrabold text-[#0b1f3a]">{materialPct}%</span>
          <span className="text-[10px] text-slate-500">Materials</span>
        </div>
      </div>
      <ul className="space-y-1 text-xs text-slate-600">
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
      <a href="#cost-breakdown" className={cx.link}>
        View detailed breakdown
      </a>
      <Link href={boqHref} className={cn(cx.accentBtn, 'w-full')}>
        Send to BOQ
      </Link>
    </aside>
  );
}

export function ConstructionBoqPreview({
  rows,
}: {
  rows: Array<{ id: string; label: string; amount: number; percentOfTotal: number }>;
}) {
  const [tab, setTab] = useState(0);
  const active = rows[tab] ?? rows[0];
  if (!rows.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">BOQ generator</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/construction/boq-generator" className={cx.secondaryBtn}>
            Open full BOQ
          </Link>
          <Link href="/construction/suppliers" className={cx.secondaryBtn}>
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
              index === tab
                ? 'bg-[#0b1f3a] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className={cn(cx.card, 'overflow-x-auto p-0')}>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Item description</th>
              <th className="px-3 py-2.5 font-semibold">Share</th>
              <th className="px-3 py-2.5 font-semibold">Amount (₹)</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-t border-slate-100',
                  row.id === active?.id ? 'bg-orange-50/60' : '',
                )}
              >
                <td className="px-3 py-2 font-medium text-[#0b1f3a]">{row.label}</td>
                <td className="px-3 py-2 tabular-nums">{row.percentOfTotal}%</td>
                <td className="px-3 py-2 tabular-nums">{formatInr(row.amount)}</td>
                <td className="px-3 py-2 text-emerald-700">Included</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ConstructionCalculatorModules() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Renovation cost calculator</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RENOVATION_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={cn(cx.card, 'p-4 transition hover:border-[#f97316]')}
            >
              <p className="font-semibold text-[#0b1f3a]">{card.title}</p>
              <p className="mt-1 text-sm text-slate-600">{card.from}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Advanced calculators</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {ADVANCED_CALCULATORS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  cx.card,
                  'block px-3 py-4 text-center text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Project timeline</h2>
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {LANDING_JOURNEY.slice(0, 6).map((step, index) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className={cn(cx.card, 'block h-full p-3 hover:border-[#f97316]')}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#f97316]">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-xs text-slate-600">{step.description}</p>
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
                  'block p-4 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
