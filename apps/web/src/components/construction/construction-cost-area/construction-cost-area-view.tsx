'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  computeConstructionCostAreaEstimate,
  COST_AREA_CITY_OPTIONS,
  formatInr,
  type ConstructionCostAreaLanding,
  type ConstructionCostQuality,
} from '@varnarc/validation';
import { ConstructionBreadcrumbs } from '@/components/construction/construction-breadcrumbs';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { LANDING_JOURNEY } from '@/lib/construction/landing';
import { trackHouseSizePageCalculator } from '@/lib/construction/analytics';
import { cn, cx } from '@/components/construction/styles';

const QUALITIES: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];

const HERO_POINTS = [
  'Estimate costs',
  'Plan materials',
  'Control budget',
  'Complete with confidence',
];

const ADVANCED_CALCS = [
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

function qualityLabel(q: ConstructionCostQuality) {
  return q.charAt(0).toUpperCase() + q.slice(1);
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function ConstructionCostAreaView({ landing }: { landing: ConstructionCostAreaLanding }) {
  const [location, setLocation] = useState(landing.estimate.locationLabel);
  const [floors, setFloors] = useState(landing.estimate.floors);
  const [quality, setQuality] = useState<ConstructionCostQuality>(landing.estimate.quality);
  const [applied, setApplied] = useState({
    location: landing.estimate.locationLabel,
    floors: landing.estimate.floors,
    quality: landing.estimate.quality,
  });
  const [boqTab, setBoqTab] = useState(0);

  const estimate = useMemo(
    () =>
      computeConstructionCostAreaEstimate({
        areaSqft: landing.areaSqft,
        floors: applied.floors,
        quality: applied.quality,
        location: applied.location,
      }),
    [landing.areaSqft, applied],
  );

  const totalSplit = estimate.materialCost + estimate.labourCost + estimate.miscellaneousCost;
  const materialPct = pct(estimate.materialCost, totalSplit);
  const labourPct = pct(estimate.labourCost, totalSplit);
  const otherPct = Math.max(0, 100 - materialPct - labourPct);
  const donut = `conic-gradient(#0b1f3a 0 ${materialPct}%, #f97316 ${materialPct}% ${materialPct + labourPct}%, #cbd5e1 ${materialPct + labourPct}% 100%)`;
  const calculatorQs = `builtUpArea=${landing.areaSqft}&floors=${estimate.floors}&quality=${estimate.quality}&location=${encodeURIComponent(estimate.locationLabel)}`;
  const activeBoq = estimate.breakdown[boqTab] ?? estimate.breakdown[0];

  return (
    <div className="w-full bg-white pb-16">
      <header className="full-bleed border-b border-slate-200/70 bg-[#f4f7fb]">
        <div className="site-container py-8 sm:py-10">
          <ConstructionBreadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Construction', href: '/construction' },
              { label: 'Cost by area', href: '/construction/cost' },
              { label: landing.label },
            ]}
          />
          <div className="mt-4 max-w-3xl">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]">
              {landing.h1}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Plan, quantify and manage your construction project. Calculate costs, estimate
              materials, generate BOQ, compare options and connect with trusted professionals — all
              in one place.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#0b1f3a]">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/construction/project/new?${calculatorQs}`} className={cx.accentBtn}>
                Create project
              </Link>
              <Link
                href={`/construction/boq-generator?builtUpArea=${landing.areaSqft}`}
                className={cx.secondaryBtn}
              >
                Open BOQ
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="site-container space-y-10 py-8 sm:py-10">
        <section
          className="rounded-2xl bg-[#0b1f3a] px-4 py-4 text-white shadow-sm sm:px-6"
          aria-label="Project summary"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Current project
              </p>
              <p className="mt-0.5 text-lg font-bold">{landing.h1.replace(' in India', '')}</p>
              <p className="mt-1 text-sm text-white/75">
                {estimate.locationLabel} · {landing.areaSqft.toLocaleString('en-IN')} sq ft ·{' '}
                {estimate.floors} floor{estimate.floors > 1 ? 's' : ''} ·{' '}
                {qualityLabel(estimate.quality)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Estimated total cost
              </p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums">
                {formatInr(estimate.estimatedTotal)}
              </p>
              <p className="text-xs text-white/70">{estimate.rangeLabel}</p>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-white/60">Materials ({materialPct}%)</dt>
              <dd className="font-semibold tabular-nums">{formatInr(estimate.materialCost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Labour ({labourPct}%)</dt>
              <dd className="font-semibold tabular-nums">{formatInr(estimate.labourCost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Other ({otherPct}%)</dt>
              <dd className="font-semibold tabular-nums">
                {formatInr(estimate.miscellaneousCost)}
              </dd>
            </div>
          </dl>
        </section>

        <p className="text-sm leading-relaxed text-slate-700">{landing.editorialIntro}</p>
        <p className="text-sm leading-relaxed text-slate-700">{landing.sizeNote}</p>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0b1f3a]">Material quantity calculator</h2>
            <p className="mt-1 text-sm text-slate-600">
              Built-up area is fixed at {landing.areaSqft.toLocaleString('en-IN')} sq ft on this
              page. Recalculate city, floors and quality with the same cost engine.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(16rem,0.85fr)] lg:items-start">
            <div className={cn(cx.card, 'space-y-3 p-4')}>
              <label className="block text-sm">
                <span className={cx.label}>City</span>
                <select
                  className={cx.input}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {COST_AREA_CITY_OPTIONS.map((city) => (
                    <option key={city.key} value={city.label}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className={cx.label}>Built-up area</span>
                <input
                  className={cx.input}
                  value={`${landing.areaSqft.toLocaleString('en-IN')} sq ft`}
                  disabled
                />
              </label>
              <label className="block text-sm">
                <span className={cx.label}>Floors</span>
                <select
                  className={cx.input}
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className={cx.label}>Construction quality</span>
                <select
                  className={cx.input}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as ConstructionCostQuality)}
                >
                  {QUALITIES.map((q) => (
                    <option key={q} value={q}>
                      {qualityLabel(q)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={cn(cx.accentBtn, 'w-full')}
                onClick={() => setApplied({ location, floors, quality })}
              >
                Calculate quantities
              </button>
            </div>

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
                  {estimate.materialLines.map((line) => (
                    <tr key={line.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-[#0b1f3a]">{line.label}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {line.quantity.toLocaleString('en-IN')}
                      </td>
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

            <aside className={cn(cx.card, 'space-y-4 p-4')}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Materials share
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
                  {formatInr(estimate.materialCost)}
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
              <Link
                href={`/construction/cost-calculator?${calculatorQs}`}
                className={cn(cx.secondaryBtn, 'w-full')}
                onClick={() => trackHouseSizePageCalculator()}
              >
                Edit local prices
              </Link>
              <Link
                href={`/construction/boq-generator?builtUpArea=${landing.areaSqft}`}
                className={cn(cx.accentBtn, 'w-full')}
              >
                Send to BOQ
              </Link>
            </aside>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold text-[#0b1f3a]">BOQ generator</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/construction/boq-generator?builtUpArea=${landing.areaSqft}`}
                className={cx.secondaryBtn}
              >
                Open full BOQ
              </Link>
              <Link href="/construction/suppliers" className={cx.secondaryBtn}>
                Get supplier quotes
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {estimate.breakdown.map((row, index) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setBoqTab(index)}
                className={cn(
                  'min-h-10 rounded-lg px-3 text-sm font-semibold',
                  index === boqTab
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
                {estimate.breakdown.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-t border-slate-100',
                      row.id === activeBoq?.id ? 'bg-orange-50/60' : '',
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

        <section id="cost-breakdown" className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Cost by quality</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Quality</th>
                  <th className="px-3 py-2 font-semibold">Cost/sq ft</th>
                  <th className="px-3 py-2 font-semibold">Approx total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.qualityRows.map((row) => (
                  <tr key={row.quality} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-[#0b1f3a]">{row.label}</td>
                    <td className="px-3 py-2 tabular-nums">{formatInr(row.costPerSqft)}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {formatInr(row.estimatedTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
          <p className="text-sm text-slate-600">
            For a full interior or 2BHK redo, open the renovation calculator and customise rooms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Advanced calculators</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {ADVANCED_CALCS.map((item) => (
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
            {[
              { href: '/construction/compare', label: 'Compare materials' },
              { href: '/construction/prices', label: 'Check prices near you' },
              { href: '/construction/professionals', label: 'Find professionals' },
              { href: '/construction/projects', label: 'Save project' },
              ...landing.relatedTools,
            ]
              .filter((item, i, arr) => arr.findIndex((x) => x.href === item.href) === i)
              .slice(0, 8)
              .map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className={cn(
                      cx.card,
                      'block p-4 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]',
                    )}
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Other house sizes</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.siblingHrefs.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cx.secondaryBtn}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Methodology</h2>
          <p className="text-sm leading-relaxed text-slate-700">{landing.methodology}</p>
          <p className="text-xs text-slate-500">{landing.qualification}</p>
          <p className="text-xs text-slate-500">
            Landing {landing.version} · Cost engine {landing.costEngineVersion}
          </p>
        </section>

        <ConstructionFAQ
          title="Frequently asked questions"
          faqs={landing.faqs.map((faq, index) => ({ id: `faq-${index}`, ...faq }))}
        />
      </div>
    </div>
  );
}
