import type { ReactNode } from 'react';
import { ResultCard, MetricCard } from '@/components/construction/result-card';
import type { ConstructionBreakdownRow, ConstructionMetric } from '@/components/construction/types';
import { cn, cx } from '@/components/construction/styles';

export function CalculationResult({
  label,
  value,
  unit,
  hint = 'Indicative estimate — verify quantities and rates with local suppliers.',
  metrics,
  actions,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  metrics?: ConstructionMetric[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <ResultCard label={label} value={value} unit={unit} hint={hint}>
        {actions}
      </ResultCard>
      {metrics?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <MetricCard key={m.id ?? m.label} label={m.label} value={m.value} hint={m.hint} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CalculationBreakdown({
  title = 'Calculation breakdown',
  rows,
  caption,
  className,
}: {
  title?: string;
  rows: ConstructionBreakdownRow[];
  caption?: string;
  className?: string;
}) {
  if (!rows.length) return null;

  return (
    <div className={cn(cx.card, 'overflow-hidden', className)}>
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-[#0b1f3a]">{title}</h3>
        {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.label} className="border-t border-slate-100 first:border-t-0">
              <th scope="row" className="px-4 py-3 font-medium text-slate-600 sm:px-5">
                {row.label}
                {row.hint ? (
                  <span className="mt-0.5 block text-xs font-normal text-slate-400">
                    {row.hint}
                  </span>
                ) : null}
              </th>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#0b1f3a] sm:px-5">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
