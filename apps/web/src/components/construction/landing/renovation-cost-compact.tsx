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
  const [selected, setSelected] = useState<RenovationWorkId[]>(['kitchen', 'bathroom', 'painting']);
  const finish: RenovationQuality = 'standard';

  const preview = useMemo(() => {
    try {
      const result = calculateRenovationCost({
        location: 'India',
        propertyType: 'apartment',
        renovationArea: 1000,
        areaUnit: 'sqft',
        roomsBhk: '2bhk',
        finishTier: finish,
        propertyAgeYears: 10,
        contingencyPercent: 12,
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
  }, [finish, selected]);

  function toggle(id: RenovationWorkId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const qs = new URLSearchParams({
    renovationArea: '1000',
    finishTier: finish,
    work: selected.join(','),
  });

  return (
    <ConstructionSection
      id="renovation-cost"
      title="Renovation cost calculator"
      description="Tap the work you need for a planning range, then open the full calculator."
      action={{
        href: `/construction/renovation-cost-calculator?${qs.toString()}`,
        label: 'Full calculator →',
      }}
    >
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RENOVATION_CATEGORY_CARDS.map((card) => {
            const on = selected.includes(card.id);
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => toggle(card.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 rounded-lg border p-2.5 text-left text-xs',
                    on ? 'border-[#f97316] bg-[#fff7ed]' : 'border-slate-200 bg-white',
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
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estimate preview · 1,000 sq ft · {finish}
            </p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(preview.result.estimatedTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Likely {formatInr(preview.result.rangeLow)} – {formatInr(preview.result.rangeHigh)}
            </p>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-slate-500">
          Indicative only. Confirm labour and material rates with contractors.
        </p>
        <Link
          href={`/construction/renovation-cost-calculator?${qs.toString()}`}
          className={cn(cx.secondaryBtn, 'mt-4')}
        >
          Open renovation calculator
        </Link>
      </div>
    </ConstructionSection>
  );
}
