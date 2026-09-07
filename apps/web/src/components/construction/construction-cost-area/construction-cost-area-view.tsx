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
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import {
  ConstructionDashboardHero,
  ConstructionHeroActions,
  ConstructionSplitDonut,
} from '@/components/construction/construction-dashboard-chrome';
import { cn, cx } from '@/components/construction/styles';

const QUALITIES: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];

const ADVANCED = [
  { href: '/construction/cement-calculator', label: 'Cement' },
  { href: '/construction/steel-calculator', label: 'Steel' },
  { href: '/construction/brick-calculator', label: 'Brick' },
  { href: '/construction/aac-block-calculator', label: 'AAC block' },
  { href: '/construction/boq-generator', label: 'BOQ generator' },
  { href: '/construction/rcc-calculator', label: 'RCC' },
];

const TIMELINE = ['Estimate', 'Materials', 'BOQ', 'Timeline', 'Budget', 'Documents'];

export function ConstructionCostAreaView({ landing }: { landing: ConstructionCostAreaLanding }) {
  const [location, setLocation] = useState(landing.estimate.locationLabel);
  const [floors, setFloors] = useState(landing.estimate.floors);
  const [quality, setQuality] = useState<ConstructionCostQuality>(landing.estimate.quality);

  const estimate = useMemo(
    () =>
      computeConstructionCostAreaEstimate({
        areaSqft: landing.areaSqft,
        floors,
        quality,
        location,
      }),
    [landing.areaSqft, floors, quality, location],
  );

  const qs = `builtUpArea=${landing.areaSqft}&floors=${floors}&quality=${quality}&location=${encodeURIComponent(location)}`;
  const materialLinesCost = estimate.materialLines.reduce((sum, row) => sum + row.cost, 0);

  return (
    <div className="space-y-8">
      <ConstructionDashboardHero
        headingAs="h1"
        title={landing.h1}
        description={`Plan, quantify and manage a ${landing.label} house: calculate costs, estimate materials and generate a BOQ. Change city, floors and quality below.`}
        points={['Estimate costs', 'Plan materials', 'Control budget', 'Complete with confidence']}
      >
        <ConstructionHeroActions
          primaryHref={`/construction/projects?${qs}`}
          secondaryHref={`/construction/boq-generator?${qs}`}
        />
      </ConstructionDashboardHero>

      <section className="rounded-xl bg-slate-100 px-4 py-4 sm:px-5">
        <div className="mb-3 flex justify-end">
          <a href="#material-calculator" className={cx.secondaryBtn}>
            Edit project
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              House size
            </p>
            <p className="mt-1 font-bold text-[#0b1f3a]">{landing.label}</p>
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
              {landing.areaSqft.toLocaleString('en-IN')} sq ft
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
              Quality
            </p>
            <p className="mt-1 font-bold capitalize text-[#0b1f3a]">{estimate.quality}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Estimated total
            </p>
            <p className="mt-1 font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(estimate.estimatedTotal)}
            </p>
            <p className="text-xs text-slate-500">{estimate.rangeLabel}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            Materials ({estimate.materialPercent}%) {formatInr(estimate.materialCost)}
          </span>
          <span>
            Labour ({estimate.labourPercent}%) {formatInr(estimate.labourCost)}
          </span>
        </div>
      </section>

      <section id="material-calculator">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Material quantity calculator</h2>
        <p className="mt-1 text-sm text-slate-600">
          Area stays {landing.areaSqft.toLocaleString('en-IN')} sq ft on this landing. Recalculate
          with city, floors and quality.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
          <form className={cn(cx.card, 'space-y-3 p-4')} onSubmit={(e) => e.preventDefault()}>
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
              <input className={cx.input} value={`${landing.areaSqft} sq ft`} readOnly />
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
              <span className={cx.label}>Quality</span>
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
            <a href="#material-calculator" className={cx.primaryBtn}>
              Calculate quantities
            </a>
            <p className="text-xs text-slate-500">Totals update as you change the fields above.</p>
          </form>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Material</th>
                  <th className="px-3 py-2 font-semibold">Quantity</th>
                  <th className="px-3 py-2 font-semibold">Unit</th>
                  <th className="px-3 py-2 font-semibold">Rate (₹)</th>
                  <th className="px-3 py-2 font-semibold">Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {estimate.materialLines.map((row) => (
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
                <span className="inline-block h-2 w-2 rounded-full bg-[#0b1f3a]" /> Materials{' '}
                {estimate.materialPercent}%
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" /> Labour{' '}
                {estimate.labourPercent}%
              </li>
              <li>
                <span className="inline-block h-2 w-2 rounded-full bg-slate-300" /> Other{' '}
                {estimate.miscPercent}%
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
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
                  className={`border-t border-slate-100 ${row.quality === quality ? 'bg-orange-50' : ''}`}
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

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Cost breakdown</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 font-semibold">Share</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {estimate.breakdown.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-[#0b1f3a]">{row.label}</td>
                  <td className="px-3 py-2 tabular-nums text-slate-600">{row.percentOfTotal}%</td>
                  <td className="px-3 py-2 tabular-nums">{formatInr(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">BOQ generator</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/construction/boq-generator?${qs}`} className={cx.primaryBtn}>
              Open BOQ
            </Link>
            <Link href="/construction/suppliers" className={cx.secondaryBtn}>
              Get supplier quotes
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Indicative phase amounts for this {landing.label} shell. Open the BOQ tool to export PDF
          or Excel and get supplier quotes.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 font-semibold">Share</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {estimate.breakdown.map((row) => (
                <tr key={`boq-${row.id}`} className="border-t border-slate-100">
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

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Renovation cost calculator</h2>
        <p className="text-sm text-slate-600">
          Planning a refresh instead of a new build? Start from typical packages, then customize
          rooms.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Kitchen', from: 'From ₹1.2L' },
            { label: 'Bathroom', from: 'From ₹85k' },
            { label: 'Flooring', from: 'From ₹90/sq ft' },
            { label: 'Painting', from: 'From ₹18/sq ft' },
          ].map((item) => (
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

      <p className="text-sm leading-relaxed text-slate-600">{landing.sizeNote}</p>
      <p className="text-xs text-slate-500">{landing.qualification}</p>
      <p className="text-xs text-slate-500">
        {landing.methodology} Landing {landing.version} · Cost engine {landing.costEngineVersion}
      </p>

      <ConstructionFAQ
        title="Frequently asked questions"
        faqs={landing.faqs.map((faq, index) => ({ id: `faq-${index}`, ...faq }))}
      />
    </div>
  );
}
