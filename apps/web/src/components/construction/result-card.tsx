import type { ReactNode } from 'react';
import { cn, cx } from '@/components/construction/styles';

/** Primary result display — large readable numbers. */
export function ResultCard({
  label,
  value,
  unit,
  hint,
  children,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-xl bg-[#0b1f3a] p-5 text-white sm:p-6', className)}
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">
        {value}
        {unit ? <span className="ml-1.5 text-lg font-semibold text-slate-300">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-300">{hint}</p> : null}
      {children ? <div className="mt-4 border-t border-white/10 pt-4">{children}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn(cx.card, 'p-4', className)}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
