'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  RENOVATION_CATEGORY_CARDS,
  calculateRenovationCost,
  type RenovationQuality,
  type RenovationWorkId,
} from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { RenoCategoryIcon } from '@/components/construction/renovation-cost-calculator/reno-category-icon';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ConstructionRenovationCostCompact() {
  const [area, setArea] = useState('1000');
  const [finish, setFinish] = useState<RenovationQuality>('standard');
  const [selected, setSelected] = useState<RenovationWorkId[]>(['kitchen', 'bathroom', 'painting']);

  const preview = useMemo(() => {
    try {
      const result = calculateRenovationCost({
        location: 'India',
        propertyType: 'apartment',
        renovationArea: Number(area),
        areaUnit: 'sqft',
        roomsBhk: '2bhk',
        finishTier: finish,
        propertyAgeYears: 10,
        workItems: RENOVATION_CATEGORY_CARDS.map((card) => ({
          id: card.id,
          enabled: selected.includes(card.id),
          quality: finish,
        })),
      });
      return { result, error: null as string | null };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : 'Select at least one category.',
      };
    }
  }, [area, finish, selected]);

  function toggle(id: RenovationWorkId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const qs = new URLSearchParams({
    renovationArea: area,
    finishTier: finish,
    work: selected.join(','),
  });

  return (
    <ConstructionSection
      id="renovation-cost"
      title="Renovation cost"
      description="Indicative kitchen, bathroom, painting and more — local rates still apply."
      action={{
        href: `/construction/renovation-cost-calculator?${qs.toString()}`,
        label: 'Full calculator →',
      }}
    >
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className={cx.label}>Property size (sq ft)</span>
            <input
              className={cx.input}
              inputMode="decimal"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className={cx.label}>Finish</span>
            <select
              className={cx.input}
              value={finish}
              onChange={(e) => setFinish(e.target.value as RenovationQuality)}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RENOVATION_CATEGORY_CARDS.map((card) => {
            const on = selected.includes(card.id);
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => toggle(card.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 rounded-lg border p-2 text-left text-xs',
                    on ? 'border-[#f97316] bg-orange-50' : 'border-slate-200',
                  )}
                  aria-pressed={on}
                >
                  <RenoCategoryIcon name={card.icon} />
                  <span className="font-semibold text-[#0b1f3a]">{card.title}</span>
                  <span className="text-slate-500">{card.startingLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {preview.error ? <p className={cn(cx.error, 'mt-2')}>{preview.error}</p> : null}
        {preview.result ? (
          <p className="mt-4 text-lg font-extrabold tabular-nums text-[#0b1f3a]">
            {formatInr(preview.result.estimatedTotal)}
            <span className="ml-2 text-xs font-normal text-slate-500">
              likely {formatInr(preview.result.rangeLow)} – {formatInr(preview.result.rangeHigh)}
            </span>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          Indicative estimate. Local labour and material prices vary — confirm with contractors.
        </p>
        <Link
          href={`/construction/renovation-cost-calculator?${qs.toString()}`}
          className={cn(cx.accentBtn, 'mt-4 w-full sm:w-auto')}
        >
          Open renovation calculator
        </Link>
      </div>
    </ConstructionSection>
  );
}
