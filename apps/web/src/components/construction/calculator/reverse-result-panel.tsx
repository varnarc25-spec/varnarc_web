import type { ReverseCalculationDisplay } from '@varnarc/validation';
import { cn } from '@/components/construction/styles';

/**
 * Required reverse-result panel: assumptions, unit, wastage, formula, limitations.
 */
export function ReverseResultPanel({
  display,
  className,
}: {
  display: ReverseCalculationDisplay;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700',
        className,
      )}
      aria-label="Reverse calculation details"
      data-calc-mode="reverse"
    >
      <h3 className="text-sm font-bold text-[#0b1f3a]">Reverse calculation details</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected unit
          </dt>
          <dd className="mt-1 font-medium text-slate-800">{display.selectedUnit}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {display.wastageLabel}
          </dt>
          <dd className="mt-1 font-medium text-slate-800">{display.wastagePercent}%</dd>
        </div>
      </dl>
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formula</p>
        <p className="mt-1 rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-800">
          {display.formula}
        </p>
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assumptions</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          {display.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Limitations</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          {display.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
