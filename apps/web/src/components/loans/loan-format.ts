import type { FinanceLoan } from '@/services/finance';
import { loanDetailPath } from '@/lib/finance-routes';

export function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatPercent(value: number | string | null | undefined): string | null {
  const n = toNumber(value);
  if (n == null) return null;
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}%`;
}

export function formatInr(value: number | string | null | undefined): string | null {
  const n = toNumber(value);
  if (n == null) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTenureUnit(months: number): string {
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

export function formatTenureMonths(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    const bothYears = min >= 12 && max >= 12 && min % 12 === 0 && max % 12 === 0;
    if (bothYears) return `${min / 12} – ${max / 12} years`;
    return `${min} – ${max} months`;
  }
  return formatTenureUnit(min ?? max!);
}

/** Safe public rate presentation — never invents rates. */
export function formatLoanRateLabel(loan: FinanceLoan): {
  label: string;
  /** Dominant numeric/range display without the "Starting from" prefix. */
  rateDisplay: string;
  /** Secondary qualifier such as "Starting from" / "From". */
  qualifier: string | null;
  unit: string;
  verified: boolean;
  startingFrom: boolean;
} {
  const min = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  const max = toNumber(loan.interestRateMax) ?? toNumber(loan.interestRate);
  const verified = Boolean(loan.rateLastVerifiedAt);
  const unit = 'p.a.';

  if (min == null && max == null) {
    return {
      label: 'Rate on request',
      rateDisplay: 'Rate on request',
      qualifier: null,
      unit: '',
      verified: false,
      startingFrom: false,
    };
  }

  if (min != null && max != null && min !== max) {
    const rateDisplay = `${formatPercent(min)} – ${formatPercent(max)}`;
    return {
      label: `${rateDisplay} ${unit}`,
      rateDisplay,
      qualifier: null,
      unit,
      verified,
      startingFrom: false,
    };
  }

  const single = formatPercent(min ?? max)!;
  // Floor-only figure → qualify. Equal min/max → published single rate (not "starting from").
  const startingFrom = min != null && max == null;
  const qualifier = startingFrom ? 'From' : null;

  return {
    label: qualifier ? `${qualifier} ${single} ${unit}` : `${single} ${unit}`,
    rateDisplay: single,
    qualifier,
    unit,
    verified,
    startingFrom,
  };
}

export function formatVerifiedDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function loanDetailHref(loan: FinanceLoan): string {
  // Keep existing UUID URLs until Phase 4 slug routes ship.
  return loanDetailPath(loan.id);
}

export function loanAmountLabel(loan: FinanceLoan): string | null {
  const min = toNumber(loan.loanAmountMin);
  const max = toNumber(loan.loanAmountMax) ?? toNumber(loan.maxAmount);
  if (min != null && max != null) return `${formatInr(min)} – ${formatInr(max)}`;
  if (max != null) return `Up to ${formatInr(max)}`;
  if (min != null) return `From ${formatInr(min)}`;
  return null;
}

/**
 * Processing fee label for catalog cards.
 * Returns null when missing — callers should show "Not currently available".
 * Never invents 0% from null/undefined (0% only when explicitly stored as 0).
 */
export function processingFeeLabel(loan: FinanceLoan): string | null {
  if (loan.processingFeeText?.trim()) return loan.processingFeeText.trim();
  const min = toNumber(loan.processingFeeMin) ?? toNumber(loan.processingFee);
  const max = toNumber(loan.processingFeeMax) ?? toNumber(loan.processingFee);
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    return `${formatPercent(min)} – ${formatPercent(max)}`;
  }
  return formatPercent(min ?? max);
}

/** Extract feature chip labels from stored JSON only — never invents features. */
export function loanFeatureLabels(features: unknown): string[] {
  if (features == null) return [];

  if (typeof features === 'string') {
    const trimmed = features.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(features)) {
    return features
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          const label = row.label ?? row.name ?? row.title ?? row.feature;
          return typeof label === 'string' ? label.trim() : '';
        }
        return '';
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  if (typeof features === 'object') {
    return Object.entries(features as Record<string, unknown>)
      .filter(([, value]) => value === true || value === 'true' || value === 1)
      .map(([key]) =>
        key
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 6);
  }

  return [];
}

export function lenderInitials(name?: string | null): string {
  const parts = (name ?? 'L').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0] ?? 'L').slice(0, 2).toUpperCase();
}
