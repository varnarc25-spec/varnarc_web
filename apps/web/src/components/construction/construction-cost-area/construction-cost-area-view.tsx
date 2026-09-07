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
import { cn, cx } from '@/components/construction/styles';

const QUALITIES: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];

export function ConstructionCostAreaInteractive({
  landing,
}: {
  landing: ConstructionCostAreaLanding;
}) {
  const [location, setLocation] = useState(landing.estimate.locationLabel);
  const [floors, setFloors] = useState(landing.estimate.floors);
  const [quality, setQuality] = useState<ConstructionCostQuality>(landing.estimate.quality);
  const [applied, setApplied] = useState({
    location: landing.estimate.locationLabel,
    floors: landing.estimate.floors,
    quality: landing.estimate.quality,
  });

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

  return (
    <section className={cn(cx.card, 'space-y-4 p-4 sm:p-5')}>
      <div>
        <h2 className="text-lg font-bold text-[#0b1f3a]">Interactive calculator</h2>
        <p className="mt-1 text-sm text-slate-600">
          Area is fixed at {landing.areaSqft.toLocaleString('en-IN')} sq ft for this page. Change
          city, floors and quality, then recalculate with the same engine.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
      </div>

      <button
        type="button"
        className={cx.primaryBtn}
        onClick={() => setApplied({ location, floors, quality })}
      >
        Recalculate
      </button>

      <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Estimated total · {estimate.locationLabel}
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
          {estimate.rangeLabel}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          About {formatInr(estimate.costPerSqft)} / sq ft · {estimate.floors} floor
          {estimate.floors > 1 ? 's' : ''} · {estimate.quality}
        </p>
      </div>
    </section>
  );
}

export function ConstructionCostAreaView({ landing }: { landing: ConstructionCostAreaLanding }) {
  const { estimate } = landing;
  const standard =
    estimate.qualityRows.find((row) => row.quality === 'standard') ?? estimate.qualityRows[1];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">{landing.editorialIntro}</p>
        <p className="text-sm leading-relaxed text-slate-700">{landing.sizeNote}</p>
        <p className="text-xs text-slate-500">{landing.qualification}</p>
      </section>

      <section className={cn(cx.card, 'p-4 sm:p-6')}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Estimated construction cost
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#0b1f3a] sm:text-4xl">
          {estimate.rangeLabel}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {estimate.locationLabel} · {estimate.floors} floor{estimate.floors > 1 ? 's' : ''} ·
          standard quality · about {formatInr(standard?.costPerSqft ?? estimate.costPerSqft)} / sq
          ft
        </p>
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
        <h2 className="text-lg font-bold text-[#0b1f3a]">Materials required for {landing.label}</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-semibold">Cement</span> — approximately{' '}
            {estimate.materials.cementBags.toLocaleString('en-IN')} bags
          </li>
          <li>
            <span className="font-semibold">Steel</span> — approximately{' '}
            {estimate.materials.steelKg.toLocaleString('en-IN')} kg
          </li>
          <li>
            <span className="font-semibold">Sand</span> — approximately{' '}
            {estimate.materials.sandTonnes} tonnes
          </li>
          <li>
            <span className="font-semibold">Aggregate</span> — {estimate.materials.aggregateTonnes}{' '}
            tonnes
          </li>
          <li>
            <span className="font-semibold">Bricks</span> —{' '}
            {estimate.materials.bricks.toLocaleString('en-IN')}
          </li>
        </ul>
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

      <ConstructionCostAreaInteractive landing={landing} />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Next tools</h2>
        <ul className="flex flex-wrap gap-2">
          {landing.relatedTools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className={tool.label.includes('cost calculator') ? cx.primaryBtn : cx.secondaryBtn}
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
        <p className="text-xs text-slate-500">
          Landing {landing.version} · Cost engine {landing.costEngineVersion}
        </p>
      </section>

      <ConstructionFAQ
        title="Frequently asked questions"
        faqs={landing.faqs.map((faq, index) => ({ id: `faq-${index}`, ...faq }))}
      />
    </div>
  );
}
