import type { ConstructionAssumption } from '@/components/construction/types';
import { cn, cx } from '@/components/construction/styles';

export function AssumptionPanel({
  title = 'Assumptions',
  items,
  note = 'Change inputs above to recalculate. Estimates are indicative only.',
  className,
}: {
  title?: string;
  items: ConstructionAssumption[];
  note?: string;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <aside
      className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5', className)}
      aria-labelledby="assumption-panel-heading"
    >
      <h3 id="assumption-panel-heading" className="text-sm font-bold text-[#0b1f3a]">
        {title}
      </h3>
      <dl className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.id ?? item.label}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <dt className="text-slate-600">{item.label}</dt>
            <dd className="font-medium tabular-nums text-[#0b1f3a]">{item.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-3 text-xs leading-relaxed text-slate-500">{note}</p> : null}
    </aside>
  );
}

export function MethodologyPanel({
  title = 'Methodology',
  formula,
  steps,
  lastUpdated,
  className,
}: {
  title?: string;
  formula?: string;
  steps?: string[];
  lastUpdated?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(cx.card, 'p-4 sm:p-5', className)}
      aria-labelledby="methodology-panel-heading"
    >
      <h3 id="methodology-panel-heading" className="text-sm font-bold text-[#0b1f3a]">
        {title}
      </h3>
      {formula ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 sm:text-sm">
          {formula}
        </p>
      ) : null}
      {steps?.length ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {lastUpdated ? (
        <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated}</p>
      ) : null}
    </aside>
  );
}
