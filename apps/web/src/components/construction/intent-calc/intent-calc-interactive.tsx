'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  computeIntentCalcResult,
  type IntentCalcTopicKey,
  type ConstructionCostQuality,
} from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

const QUALITIES: ConstructionCostQuality[] = ['basic', 'standard', 'premium'];

export function IntentCalcInteractive({
  topic,
  areaSqft,
  initialFloors,
  initialQuality,
  calculatorHref,
  calculatorLabel,
}: {
  topic: IntentCalcTopicKey;
  areaSqft: number;
  initialFloors: number;
  initialQuality: ConstructionCostQuality;
  calculatorHref: string;
  calculatorLabel: string;
}) {
  const [quality, setQuality] = useState<ConstructionCostQuality>(initialQuality);
  const [floors, setFloors] = useState(initialFloors);

  const result = useMemo(
    () =>
      computeIntentCalcResult({
        topic,
        areaSqft,
        quality,
        floors,
      }),
    [topic, areaSqft, quality, floors],
  );

  return (
    <section className={cn(cx.card, 'space-y-4 p-4 sm:p-5')}>
      <div>
        <h2 className="text-lg font-bold text-[#0b1f3a]">Interactive estimate</h2>
        <p className="mt-1 text-xs text-slate-500">
          Area is fixed for this landing ({areaSqft.toLocaleString('en-IN')} sq ft). Adjust quality
          and floors — same validated logic as the published figure.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quality
          </span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            value={quality}
            onChange={(e) => setQuality(e.target.value as ConstructionCostQuality)}
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Floors
          </span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            value={floors}
            onChange={(e) => setFloors(Number(e.target.value))}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {result.primaryLabel}
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
          {result.primaryValue}
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {result.secondaryLines.map((line) => (
            <li key={line.label}>
              <span className="font-semibold text-slate-700">{line.label}:</span> {line.value}
            </li>
          ))}
        </ul>
      </div>

      <Link href={calculatorHref} className={cx.primaryBtn}>
        {calculatorLabel}
      </Link>
    </section>
  );
}
