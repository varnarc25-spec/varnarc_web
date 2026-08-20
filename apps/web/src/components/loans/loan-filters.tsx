'use client';

import type { FormEvent } from 'react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FinanceBank, FinanceCategory } from '@/services/finance';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import { loansHubPath } from '@/lib/finance-routes';

export type LoanFilterState = {
  categorySlug?: string;
  bankId?: string;
  rateMax?: string;
  amountMin?: string;
  tenureMin?: string;
  processingFeeMax?: string;
  creditScoreMaxRequired?: string;
  employmentType?: string;
  /** Car loan only: new | used */
  vehicleCondition?: string;
  /** Car loan only: min financing % product should support */
  financingPercentMin?: string;
  sort?: string;
};

const FILTER_KEYS = [
  'categorySlug',
  'bankId',
  'rateMax',
  'amountMin',
  'tenureMin',
  'processingFeeMax',
  'creditScoreMaxRequired',
  'employmentType',
  'vehicleCondition',
  'financingPercentMin',
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

const MORE_FILTER_KEYS: FilterKey[] = [
  'tenureMin',
  'processingFeeMax',
  'creditScoreMaxRequired',
  'employmentType',
  'vehicleCondition',
  'financingPercentMin',
];

/** Build catalog URL — category lives in the path, never as ?categorySlug=. */
export function buildLoanFilterHref(next: LoanFilterState): string {
  const categorySlug =
    next.categorySlug && isLoanHubCategorySlug(next.categorySlug) ? next.categorySlug : undefined;

  return loansHubPath({
    categorySlug,
    sort: next.sort,
    filters: {
      bankId: next.bankId,
      rateMax: next.rateMax,
      amountMin: next.amountMin,
      tenureMin: next.tenureMin,
      processingFeeMax: next.processingFeeMax,
      creditScoreMaxRequired: next.creditScoreMaxRequired,
      employmentType: next.employmentType,
      vehicleCondition: next.vehicleCondition,
      financingPercentMin: next.financingPercentMin,
    },
  });
}

function buildHref(next: LoanFilterState) {
  return buildLoanFilterHref(next);
}

function countActiveFilters(state: LoanFilterState): number {
  return FILTER_KEYS.reduce((count, key) => {
    const value = state[key];
    return value != null && String(value).trim() !== '' ? count + 1 : count;
  }, 0);
}

function hasMoreFilterValues(state: LoanFilterState): boolean {
  return MORE_FILTER_KEYS.some((key) => {
    const value = state[key];
    return value != null && String(value).trim() !== '';
  });
}

function formatInrShort(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function employmentLabel(value: string): string {
  switch (value) {
    case 'salaried':
      return 'Salaried';
    case 'self-employed':
      return 'Self-employed';
    case 'professional':
      return 'Professional';
    default:
      return value;
  }
}

export type LoanFilterChip = {
  key: FilterKey;
  label: string;
};

export function getLoanFilterChips(
  current: LoanFilterState,
  categories: FinanceCategory[],
  banks: FinanceBank[],
): LoanFilterChip[] {
  const chips: LoanFilterChip[] = [];

  if (current.categorySlug) {
    const name =
      categories.find((c) => c.slug === current.categorySlug)?.name ?? current.categorySlug;
    chips.push({ key: 'categorySlug', label: name });
  }
  if (current.bankId) {
    const name = banks.find((b) => b.id === current.bankId)?.name ?? 'Lender';
    chips.push({ key: 'bankId', label: name });
  }
  if (current.rateMax) {
    chips.push({ key: 'rateMax', label: `Under ${current.rateMax}%` });
  }
  if (current.amountMin) {
    chips.push({ key: 'amountMin', label: `From ${formatInrShort(current.amountMin)}` });
  }
  if (current.tenureMin) {
    chips.push({ key: 'tenureMin', label: `Tenure ${current.tenureMin}+ months` });
  }
  if (current.processingFeeMax) {
    chips.push({ key: 'processingFeeMax', label: `Fee under ${current.processingFeeMax}%` });
  }
  if (current.creditScoreMaxRequired) {
    chips.push({
      key: 'creditScoreMaxRequired',
      label: `Credit score ${current.creditScoreMaxRequired}`,
    });
  }
  if (current.employmentType) {
    chips.push({
      key: 'employmentType',
      label: employmentLabel(current.employmentType),
    });
  }
  if (current.vehicleCondition) {
    chips.push({
      key: 'vehicleCondition',
      label:
        current.vehicleCondition === 'used'
          ? 'Used car'
          : current.vehicleCondition === 'new'
            ? 'New car'
            : current.vehicleCondition,
    });
  }
  if (current.financingPercentMin) {
    chips.push({
      key: 'financingPercentMin',
      label: `Financing ≥ ${current.financingPercentMin}%`,
    });
  }

  return chips;
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700">
      {children}
    </label>
  );
}

const inputClass =
  'mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2';

function FilterFields({
  draft,
  setDraft,
  categories,
  banks,
  moreOpen,
  setMoreOpen,
  hideLoanType = false,
  showCarLoanFilters = false,
}: {
  draft: LoanFilterState;
  setDraft: Dispatch<SetStateAction<LoanFilterState>>;
  categories: FinanceCategory[];
  banks: FinanceBank[];
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
  hideLoanType?: boolean;
  showCarLoanFilters?: boolean;
}) {
  return (
    <div className="space-y-3.5">
      {hideLoanType ? null : (
        <div>
          <FieldLabel htmlFor="loan-filter-type">Loan Type</FieldLabel>
          <select
            id="loan-filter-type"
            value={draft.categorySlug ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, categorySlug: e.target.value || undefined }))}
            className={inputClass}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <FieldLabel htmlFor="loan-filter-lender">Lender</FieldLabel>
        <select
          id="loan-filter-lender"
          value={draft.bankId ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, bankId: e.target.value || undefined }))}
          className={inputClass}
        >
          <option value="">All lenders</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="loan-filter-rate">Interest Rate</FieldLabel>
        <input
          id="loan-filter-rate"
          type="number"
          min={0}
          max={100}
          step="0.1"
          placeholder="Max % p.a."
          value={draft.rateMax ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, rateMax: e.target.value || undefined }))}
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="loan-filter-amount">Loan Amount</FieldLabel>
        <input
          id="loan-filter-amount"
          type="number"
          min={0}
          placeholder="Min amount (₹)"
          value={draft.amountMin ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, amountMin: e.target.value || undefined }))}
          className={inputClass}
        />
      </div>

      <div className="rounded-xl bg-[#f8fafc] ring-1 ring-slate-200/70">
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-[#0b1f3a]"
          aria-expanded={moreOpen}
        >
          More filters
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition motion-reduce:transition-none ${moreOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {moreOpen ? (
          <div className="space-y-3.5 border-t border-slate-200 px-3 py-3">
            <div>
              <FieldLabel htmlFor="loan-filter-tenure">Tenure</FieldLabel>
              <input
                id="loan-filter-tenure"
                type="number"
                min={1}
                placeholder="Min months"
                value={draft.tenureMin ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, tenureMin: e.target.value || undefined }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="loan-filter-fee">Processing Fee</FieldLabel>
              <input
                id="loan-filter-fee"
                type="number"
                min={0}
                step="0.1"
                placeholder="Max %"
                value={draft.processingFeeMax ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, processingFeeMax: e.target.value || undefined }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="loan-filter-score">Credit Score</FieldLabel>
              <input
                id="loan-filter-score"
                type="number"
                min={300}
                max={900}
                placeholder="Your score"
                value={draft.creditScoreMaxRequired ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    creditScoreMaxRequired: e.target.value || undefined,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="loan-filter-employment">Employment Type</FieldLabel>
              <select
                id="loan-filter-employment"
                value={draft.employmentType ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, employmentType: e.target.value || undefined }))
                }
                className={inputClass}
              >
                <option value="">Any</option>
                <option value="salaried">Salaried</option>
                <option value="self-employed">Self-employed</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            {showCarLoanFilters ? (
              <>
                <div>
                  <FieldLabel htmlFor="loan-filter-vehicle">New / Used Vehicle</FieldLabel>
                  <select
                    id="loan-filter-vehicle"
                    value={draft.vehicleCondition ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vehicleCondition: e.target.value || undefined,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Any</option>
                    <option value="new">New car</option>
                    <option value="used">Used car</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="loan-filter-financing">Financing %</FieldLabel>
                  <input
                    id="loan-filter-financing"
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    placeholder="Min financing %"
                    value={draft.financingPercentMin ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        financingPercentMin: e.target.value || undefined,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LoanFilters({
  categories,
  banks,
  current,
  hideLoanType = false,
  lockCategorySlug,
  quiet = false,
}: {
  categories: FinanceCategory[];
  banks: FinanceBank[];
  current: LoanFilterState;
  /** Hide Loan Type control (e.g. Personal Loan page). */
  hideLoanType?: boolean;
  /** Force category slug on apply/clear when Loan Type is hidden. */
  lockCategorySlug?: string;
  /** Quieter visual weight so product results dominate (Personal Loan page). */
  quiet?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const drawerTitleId = useId();
  const drawerPanelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<LoanFilterState>(current);
  const [moreOpen, setMoreOpen] = useState(() => hasMoreFilterValues(current));

  useEffect(() => {
    setDraft(current);
    if (hasMoreFilterValues(current)) setMoreOpen(true);
  }, [current]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = drawerRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const nodes = Array.from(focusable);
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (!firstNode || !lastNode) return;
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [drawerOpen]);

  const activeCount = countActiveFilters(
    hideLoanType || lockCategorySlug ? { ...current, categorySlug: undefined } : current,
  );

  function apply(e?: FormEvent) {
    e?.preventDefault();
    startTransition(() => {
      router.push(
        buildHref({
          ...draft,
          categorySlug: lockCategorySlug ?? draft.categorySlug,
          sort: current.sort ?? draft.sort ?? 'recommended',
        }),
      );
    });
    setDrawerOpen(false);
  }

  function clear() {
    const next: LoanFilterState = {};
    if (current.sort) next.sort = current.sort;
    if (lockCategorySlug) next.categorySlug = lockCategorySlug;
    setDraft(next);
    startTransition(() => {
      router.push(buildHref(next));
    });
    setDrawerOpen(false);
  }

  const actions = (
    <div className={`flex gap-2 ${quiet ? 'pt-0.5' : 'pt-1'}`}>
      <button
        type="submit"
        className="min-h-11 flex-1 rounded-lg bg-[#0b1f3a] px-3 text-sm font-semibold text-white hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
      >
        Apply Filters
      </button>
      <button
        type="button"
        onClick={clear}
        className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 ${
          quiet
            ? 'text-slate-500 hover:text-[#0b1f3a]'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Clear
      </button>
    </div>
  );

  const formBody = (
    <FilterFields
      draft={draft}
      setDraft={setDraft}
      categories={categories}
      banks={banks}
      moreOpen={moreOpen}
      setMoreOpen={setMoreOpen}
      hideLoanType={hideLoanType}
      showCarLoanFilters={lockCategorySlug === 'car-loan'}
    />
  );

  return (
    <>
      {/* Tablet / mobile trigger */}
      <div className="mb-3 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={drawerOpen}
          aria-controls={drawerPanelId}
          onClick={() => {
            setDraft(current);
            if (hasMoreFilterValues(current)) setMoreOpen(true);
            setDrawerOpen(true);
          }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0b1f3a] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 sm:w-auto"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b1f3a] px-1.5 text-xs font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Desktop sticky sidebar — lighter so results stay dominant */}
      <aside
        className={`hidden lg:sticky lg:top-24 lg:block lg:self-start ${
          quiet
            ? 'rounded-xl bg-white/60 p-3'
            : 'rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className={
              quiet
                ? 'text-xs font-semibold uppercase tracking-wide text-slate-500'
                : 'text-sm font-bold text-[#0b1f3a]'
            }
          >
            Filters
          </p>
          {activeCount > 0 ? (
            <span className="rounded-full bg-[#e8eef5] px-2 py-0.5 text-xs font-semibold text-[#0b1f3a]">
              {activeCount} active
            </span>
          ) : null}
        </div>
        <form
          onSubmit={apply}
          className={`mt-3 ${quiet ? 'space-y-2.5' : 'space-y-3.5'}`}
          aria-label="Loan filters"
        >
          {formBody}
          {actions}
        </form>
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            id={drawerPanelId}
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2">
              <div className="flex items-center gap-2">
                <p id={drawerTitleId} className="text-sm font-extrabold text-[#0b1f3a]">
                  Filters
                </p>
                {activeCount > 0 ? (
                  <span className="rounded-full bg-[#e8eef5] px-2 py-0.5 text-xs font-bold text-[#0b1f3a]">
                    {activeCount} active
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <form
              onSubmit={apply}
              className="flex min-h-0 flex-1 flex-col"
              aria-label="Loan filters"
            >
              <div className="flex-1 overflow-y-auto px-4 py-3">{formBody}</div>
              <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">{actions}</div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LoanActiveFilterChips({
  current,
  categories,
  banks,
  hideCategoryChip = false,
  lockCategorySlug,
}: {
  current: LoanFilterState;
  categories: FinanceCategory[];
  banks: FinanceBank[];
  /** Hide category chip on category-locked pages (e.g. Personal Loan). */
  hideCategoryChip?: boolean;
  lockCategorySlug?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const chips = useMemo(() => {
    const all = getLoanFilterChips(current, categories, banks);
    return hideCategoryChip ? all.filter((c) => c.key !== 'categorySlug') : all;
  }, [current, categories, banks, hideCategoryChip]);

  if (!chips.length) return null;

  function removeChip(key: FilterKey) {
    if (key === 'categorySlug' && lockCategorySlug) return;
    const next: LoanFilterState = { ...current };
    delete next[key];
    if (lockCategorySlug) next.categorySlug = lockCategorySlug;
    startTransition(() => {
      router.push(buildHref(next));
    });
  }

  function clearAll() {
    const next: LoanFilterState = {};
    if (current.sort) next.sort = current.sort;
    if (lockCategorySlug) next.categorySlug = lockCategorySlug;
    startTransition(() => {
      router.push(buildHref(next));
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeChip(chip.key)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0b1f3a] shadow-sm hover:border-[#f97316]"
        >
          {chip.label}
          <X className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          <span className="sr-only">Remove {chip.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="inline-flex min-h-11 items-center text-xs font-semibold text-slate-600 underline-offset-2 hover:text-[#0b1f3a] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export function LoanSortSelect({
  currentSort,
  pathname = '/finance/loans',
}: {
  currentSort?: string;
  pathname?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete('categorySlug');
    if (value && value !== 'recommended') qs.set('sort', value);
    else qs.delete('sort');
    const query = qs.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-semibold text-slate-700 sm:inline-flex sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      Sort by
      <select
        value={currentSort || 'recommended'}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 sm:w-auto"
      >
        <option value="recommended">Recommended</option>
        <option value="lowest_interest">Lowest Interest Rate</option>
        <option value="highest_amount">Highest Loan Amount</option>
        <option value="lowest_processing_fee">Lowest Processing Fee</option>
        <option value="longest_tenure">Longest Tenure</option>
      </select>
    </label>
  );
}
