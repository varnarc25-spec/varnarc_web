import Link from 'next/link';
import { calculatePlanningBoq, createPlanningBoq } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';

const PREVIEW_COUNT = 5;

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ConstructionBoqPreview() {
  const boq = createPlanningBoq({
    title: 'Example planning BOQ',
    handoff: { builtUpArea: 1500, floors: 2, quality: 'standard', areaUnit: 'sqft' },
  });
  const totals = calculatePlanningBoq(boq);
  const rows = totals.items
    .filter((item) => item.isIncluded && item.quantity > 0)
    .slice(0, PREVIEW_COUNT);
  const remaining = Math.max(
    0,
    totals.items.filter((item) => item.isIncluded).length - rows.length,
  );

  return (
    <ConstructionSection
      id="boq-preview"
      title="BOQ generator"
      description="A short look at a planning bill of quantities. Open the full tool to edit rates and sections."
      action={{ href: '/construction/boq', label: 'Open BOQ →' }}
    >
      <div className={cn(cx.card, 'overflow-hidden p-4 sm:p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Example · 1,500 sq ft, 2 floors
        </p>
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 text-slate-600">
                <span className="block truncate font-medium text-[#0b1f3a]">
                  {item.description}
                </span>
                <span className="text-xs text-slate-500">
                  {item.quantity.toLocaleString('en-IN', { maximumFractionDigits: 1 })} {item.unit}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[#0b1f3a]">
                {formatInr(item.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-sm font-semibold tabular-nums text-[#0b1f3a]">
            Indicative total {formatInr(totals.grandTotal)}
          </p>
          <Link href="/construction/boq" className={cx.link}>
            View all items{remaining > 0 ? ` (${remaining} more)` : ''} →
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Planning BOQ only — not a tender document. Confirm quantities and rates locally.
        </p>
      </div>
    </ConstructionSection>
  );
}
