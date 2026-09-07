'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  computeConstructionCostAreaEstimate,
  COST_AREA_CITY_OPTIONS,
  formatInr,
  listConstructionCostAreaSlugs,
  constructionCostAreaPath,
  CONSTRUCTION_COST_AREA_PROFILES,
  type ConstructionCostQuality,
} from '@varnarc/validation';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import {
  ConstructionDashboardHero,
  ConstructionHeroActions,
  ConstructionHouseIllustration,
  ConstructionSplitDonut,
} from '@/components/construction/construction-dashboard-chrome';
import { cn, cx } from '@/components/construction/styles';
import { COST_CALC_FAQS } from './content';

const SQFT_PER_SQM = 10.7639;
const QUALITIES: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];

const ADVANCED = [
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/steel-calculator', label: 'Steel calculator' },
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/boq-generator', label: 'BOQ generator' },
];

const TIMELINE = ['Estimate', 'Materials', 'BOQ', 'Timeline', 'Budget', 'Documents'];

const RENO_PACKAGES = [
  { label: 'Kitchen', from: 'From ₹1.2L' },
  { label: 'Bathroom', from: 'From ₹85k' },
  { label: 'Flooring', from: 'From ₹90/sq ft' },
  { label: 'Painting', from: 'From ₹18/sq ft' },
  { label: 'Electrical', from: 'From ₹45k' },
  { label: 'Plumbing', from: 'From ₹40k' },
  { label: 'False ceiling', from: 'From ₹85/sq ft' },
  { label: 'Doors & windows', from: 'From ₹12k/opening' },
];

const BOQ_TABS = [
  { id: 'all', label: 'Civil' },
  { id: 'structure', label: 'RCC & Structure' },
  { id: 'masonry', label: 'Masonry' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'paint', label: 'Painting' },
] as const;

function toSqft(area: number, unit: 'sqft' | 'sqm') {
  const n = Number.isFinite(area) && area > 0 ? area : 1500;
  return unit === 'sqm' ? Math.round(n * SQFT_PER_SQM) : Math.round(n);
}

export function ConstructionCostDashboard({
  initialLocation = 'Bengaluru',
  initialArea = '1500',
}: {
  initialLocation?: string;
  initialArea?: string;
}) {
  const [projectName, setProjectName] = useState('My Dream Home');
  const [editingName, setEditingName] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [area, setArea] = useState(initialArea);
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [floors, setFloors] = useState(2);
  const [quality, setQuality] = useState<ConstructionCostQuality>('standard');
  const [boqTab, setBoqTab] = useState<(typeof BOQ_TABS)[number]['id']>('all');

  const areaSqft = toSqft(Number(area), areaUnit);

  const estimate = useMemo(
    () =>
      computeConstructionCostAreaEstimate({
        areaSqft,
        floors,
        quality,
        location,
      }),
    [areaSqft, floors, quality, location],
  );

  const qs = `builtUpArea=${areaSqft}&floors=${floors}&quality=${quality}&location=${encodeURIComponent(location)}`;
  const extraRows = estimate.breakdown.filter(
    (row) => row.id === 'electrical' || row.id === 'plumbing',
  );
  const tableRows = [
    ...estimate.materialLines,
    ...extraRows.map((row) => ({
      id: row.id,
      label: row.label,
      quantity: 1,
      unit: 'lumpsum',
      rate: row.amount,
      cost: row.amount,
    })),
  ];
  const materialLinesCost = tableRows.reduce((sum, row) => sum + row.cost, 0);
  const boqRows =
    boqTab === 'all' ? estimate.breakdown : estimate.breakdown.filter((row) => row.id === boqTab);
  const renovationHint = Math.round(estimate.estimatedTotal * 0.22);

  return (
    <div className="space-y-8">
      <ConstructionDashboardHero
        headingAs="h1"
        title="Plan, quantify and manage your construction project"
        description="Estimate house construction cost from area, city, floors and quality. Material quantities and BOQ amounts update with every selection. Indicative planning figures only — not a quote."
        points={['Estimate costs', 'Plan materials', 'Control budget', 'Complete with confidence']}
        aside={
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-extrabold text-[#0b1f3a]">
              From foundation to finish, build smarter with Varnarc
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {['Transparent rates', 'Material quantities', 'BOQ-ready breakdown'].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-center">
              <ConstructionHouseIllustration />
            </div>
          </div>
        }
      >
        <ConstructionHeroActions
          primaryHref={`/construction/projects?${qs}`}
          secondaryHref={`/construction/boq-generator?${qs}`}
        />
      </ConstructionDashboardHero>

      <section className="rounded-xl bg-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Project name
              </p>
              {editingName ? (
                <input
                  className={cn(cx.input, 'mt-1 max-w-[220px]')}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="mt-1 text-left font-bold text-[#0b1f3a] underline-offset-2 hover:underline"
                  onClick={() => setEditingName(true)}
                >
                  {projectName}
                </button>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Location
              </p>
              <p className="mt-1 font-bold text-[#0b1f3a]">{estimate.locationLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Built-up area
              </p>
              <p className="mt-1 font-bold tabular-nums text-[#0b1f3a]">
                {areaSqft.toLocaleString('en-IN')} sq ft
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Floors
              </p>
              <p className="mt-1 font-bold text-[#0b1f3a]">{estimate.floors}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Construction quality
              </p>
              <p className="mt-1 font-bold capitalize text-[#0b1f3a]">{estimate.quality}</p>
            </div>
          </div>
          <a href="#material-calculator" className={cx.secondaryBtn}>
            Edit project
          </a>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Estimated total cost
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(estimate.estimatedTotal)}
            </p>
            <p className="text-xs text-slate-500">{estimate.rangeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            <span>
              Materials ({estimate.materialPercent}%) {formatInr(estimate.materialCost)}
            </span>
            <span>
              Labour ({estimate.labourPercent}%) {formatInr(estimate.labourCost)}
            </span>
          </div>
        </div>
      </section>

      <section id="material-calculator">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0b1f3a]">Material quantity calculator</h2>
            <p className="mt-1 text-sm text-slate-600">
              Change city, area, floors or quality — quantities and costs recalculate immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/construction/prices" className={cx.secondaryBtn}>
              Edit local prices
            </Link>
            <Link href={`/construction/boq-generator?${qs}`} className={cx.primaryBtn}>
              Send to BOQ
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
          <form
            className={cn(cx.card, 'space-y-3 p-4')}
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById('material-calculator')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <label className="block text-sm">
              <span className={cx.label}>Select project</span>
              <input className={cx.input} value={projectName} readOnly />
            </label>
            <label className="block text-sm">
              <span className={cx.label}>Location</span>
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
                type="number"
                min={100}
                max={50000}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>
            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              {(['sqft', 'sqm'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={cn(
                    'flex-1 py-2 text-sm font-semibold',
                    areaUnit === unit ? 'bg-[#0b1f3a] text-white' : 'bg-white text-[#0b1f3a]',
                  )}
                  onClick={() => setAreaUnit(unit)}
                >
                  {unit === 'sqft' ? 'sq ft' : 'sq m'}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className={cx.label}>Number of floors</span>
              <select
                className={cx.input}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
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
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#f97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c]"
            >
              Calculate quantities
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Material</th>
                  <th className="px-3 py-2 font-semibold">Quantity</th>
                  <th className="px-3 py-2 font-semibold">Unit</th>
                  <th className="px-3 py-2 font-semibold">Indicative rate (₹)</th>
                  <th className="px-3 py-2 font-semibold">Estimated cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-[#0b1f3a]">{row.label}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.quantity.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{row.unit}</td>
                    <td className="px-3 py-2 tabular-nums">{row.rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {row.cost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={cn(cx.card, 'p-4')}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Material cost estimate
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(estimate.materialCost)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Line items {formatInr(materialLinesCost)} (planning rates)
            </p>
            <div className="mt-4">
              <ConstructionSplitDonut
                material={estimate.materialPercent}
                labour={estimate.labourPercent}
                other={estimate.miscPercent}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              <li>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#0b1f3a]" />
                Materials {estimate.materialPercent}%
              </li>
              <li>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f97316]" />
                Labour {estimate.labourPercent}%
              </li>
              <li>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-300" />
                Other {estimate.miscPercent}%
              </li>
            </ul>
            <Link
              href="#cost-breakdown"
              className="mt-3 inline-block text-sm font-semibold text-[#0b1f3a] underline-offset-2 hover:text-[#f97316] hover:underline"
            >
              View detailed breakdown
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">BOQ generator</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/construction/boq-generator?${qs}`} className={cx.secondaryBtn}>
              Download PDF
            </Link>
            <Link href={`/construction/boq-generator?${qs}`} className={cx.secondaryBtn}>
              Export Excel
            </Link>
            <Link href={`/construction/projects?${qs}`} className={cx.secondaryBtn}>
              Save BOQ
            </Link>
            <Link href="/construction/suppliers" className={cx.primaryBtn}>
              Get supplier quotes
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {BOQ_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                boqTab === tab.id
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-[#0b1f3a]',
              )}
              onClick={() => setBoqTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Item description</th>
                <th className="px-3 py-2 font-semibold">Share</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {boqRows.map((row, index) => (
                <tr key={`boq-${row.id}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-[#0b1f3a]">{row.label}</td>
                  <td className="px-3 py-2 tabular-nums">{row.percentOfTotal}%</td>
                  <td className="px-3 py-2 tabular-nums">{formatInr(row.amount)}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Included
                    </span>
                  </td>
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
                <tr
                  key={row.quality}
                  className={`cursor-pointer border-t border-slate-100 ${row.quality === quality ? 'bg-orange-50' : ''}`}
                  onClick={() => setQuality(row.quality)}
                >
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Renovation cost calculator</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RENO_PACKAGES.map((item) => (
              <Link
                key={item.label}
                href="/construction/renovation-cost-calculator"
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#f97316]"
              >
                <p className="font-bold text-[#0b1f3a]">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.from}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className={cn(cx.card, 'p-4')}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Renovation estimate
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
            {formatInr(renovationHint)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Indicative ~22% of this new-build total for a typical refresh.
          </p>
          <Link
            href="/construction/renovation-cost-calculator"
            className={cn(cx.primaryBtn, 'mt-4 w-full')}
          >
            Customize renovation
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Advanced calculators</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ADVANCED.map((item) => (
            <li key={item.href}>
              <Link
                href={`${item.href}?${qs}`}
                className="flex min-h-16 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Project timeline</h2>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TIMELINE.map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
            >
              <span className="text-xs font-bold text-[#f97316]">{index + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/construction/compare', label: 'Compare materials' },
          { href: '/construction/prices', label: 'Check prices near you' },
          { href: '/construction/professionals', label: 'Find professionals' },
          { href: `/construction/projects?${qs}`, label: 'Save project' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-[#0b1f3a] hover:border-[#f97316]"
          >
            {item.label}
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">House sizes</h2>
        <ul className="flex flex-wrap gap-2">
          {listConstructionCostAreaSlugs().map((slug) => (
            <li key={slug}>
              <Link href={constructionCostAreaPath(slug)} className={cx.secondaryBtn}>
                {CONSTRUCTION_COST_AREA_PROFILES[slug].label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        Indicative planning figures for education only — not a quotation, tender or structural
        design. Actual cost depends on drawings, soil, finish level, city rates and contractor
        terms.
      </p>

      <ConstructionFAQ title="Frequently asked questions" faqs={COST_CALC_FAQS} />
    </div>
  );
}
