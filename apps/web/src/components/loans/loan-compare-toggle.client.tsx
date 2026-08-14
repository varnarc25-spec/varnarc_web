'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LOAN_COMPARE_MAX, canAddToCompare, toggleCompareSelection } from '@/lib/loan-catalog';
import { financeCompareLoansPath } from '@/lib/finance-routes';

type LoanCompareContextValue = {
  selected: string[];
  max: number;
  toggle: (loanId: string) => void;
  clear: () => void;
  isSelected: (loanId: string) => boolean;
  isDisabled: (loanId: string) => boolean;
};

const LoanCompareContext = createContext<LoanCompareContextValue | null>(null);

function useLoanCompare(): LoanCompareContextValue {
  const ctx = useContext(LoanCompareContext);
  if (!ctx) {
    throw new Error('LoanCompareToggle must be used within LoanCompareShell');
  }
  return ctx;
}

export function LoanCompareShell({
  children,
  max = LOAN_COMPARE_MAX,
}: {
  children: ReactNode;
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback(
    (loanId: string) => {
      setSelected((prev) => toggleCompareSelection(prev, loanId, max));
    },
    [max],
  );

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo<LoanCompareContextValue>(
    () => ({
      selected,
      max,
      toggle,
      clear,
      isSelected: (loanId: string) => selected.includes(loanId),
      isDisabled: (loanId: string) => !canAddToCompare(selected, loanId, max),
    }),
    [selected, max, toggle, clear],
  );

  return <LoanCompareContext.Provider value={value}>{children}</LoanCompareContext.Provider>;
}

export function LoanCompareToggle({ loanId }: { loanId: string }) {
  const { isSelected, isDisabled, toggle, max } = useLoanCompare();
  const selected = isSelected(loanId);
  const disabled = isDisabled(loanId);

  return (
    <label className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
      <input
        type="checkbox"
        checked={selected}
        disabled={!selected && disabled}
        onChange={() => toggle(loanId)}
        className="h-4 w-4 rounded border-slate-300 accent-[#0b1f3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
        aria-describedby={!selected && disabled ? `compare-max-${loanId}` : undefined}
        title={!selected && disabled ? `Maximum ${max} loans can be compared` : 'Add to comparison'}
      />
      Compare
      {!selected && disabled ? (
        <span id={`compare-max-${loanId}`} className="sr-only">
          Maximum {max} loans can be compared. Deselect one to add this loan.
        </span>
      ) : null}
    </label>
  );
}

export function LoanCompareStickyCta() {
  const { selected, clear, max } = useLoanCompare();
  if (selected.length < 2) return null;

  const compareHref = financeCompareLoansPath(selected);

  return (
    <div className="sticky bottom-3 z-20 rounded-xl border border-[#0b1f3a]/20 bg-[#0b1f3a] p-3 text-white shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm font-semibold">
          {selected.length} selected for comparison
          <span className="ml-2 text-xs font-medium text-white/80">(up to {max})</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/30 px-3 text-sm font-semibold hover:bg-white/10 sm:flex-none"
          >
            Clear
          </button>
          <Link
            href={compareHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-[#0b1f3a] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1f3a] sm:flex-none"
          >
            Compare selected
          </Link>
        </div>
      </div>
    </div>
  );
}
