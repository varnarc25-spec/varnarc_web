'use client';

import type { FormEvent, ReactNode } from 'react';
import { cn, cx } from '@/components/construction/styles';
import { trackCalculatorReset, trackCalculatorStarted } from '@/lib/construction/analytics';

export function CalculatorForm({
  onSubmit,
  onReset,
  children,
  submitLabel = 'Calculate',
  resetLabel = 'Reset',
  loading = false,
  footer,
  className,
  calculatorType,
  loggedIn = false,
}: {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  children: ReactNode;
  submitLabel?: string;
  resetLabel?: string;
  loading?: boolean;
  footer?: ReactNode;
  className?: string;
  /** When set, emits calculator_started / calculator_reset automatically. */
  calculatorType?: string;
  loggedIn?: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        if (calculatorType) {
          trackCalculatorStarted({
            calculator_type: calculatorType,
            logged_in: loggedIn,
          });
        }
        onSubmit?.(event);
      }}
      onReset={
        onReset
          ? (e) => {
              e.preventDefault();
              if (calculatorType) {
                trackCalculatorReset({ calculator_type: calculatorType });
              }
              onReset();
            }
          : undefined
      }
      className={cn(cx.card, 'space-y-4 p-4 sm:p-5', className)}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
        <button type="submit" disabled={loading} className={cn(cx.primaryBtn, 'sm:min-w-[8.5rem]')}>
          {loading ? 'Calculating…' : submitLabel}
        </button>
        {onReset ? (
          <button type="reset" disabled={loading} className={cx.secondaryBtn}>
            {resetLabel}
          </button>
        ) : null}
        {footer}
      </div>
    </form>
  );
}
