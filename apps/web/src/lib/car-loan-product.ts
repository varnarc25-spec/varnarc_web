/**
 * Car-loan product field resolution.
 * Reads optional top-level fields or Loan.metadata — never invents values.
 */

import type { FinanceLoan } from '@/services/finance';
import { toNumber } from '@/components/loans/loan-format';

export type CarLoanVehicleCondition = 'new' | 'used' | 'both';

export type ResolvedCarLoanProductFields = {
  vehicleCondition: CarLoanVehicleCondition | null;
  vehicleAgeMax: number | null;
  financingPercentageMin: number | null;
  financingPercentageMax: number | null;
  vehicleValuationRequired: boolean | null;
  prepaymentTerms: string | null;
  foreclosureTerms: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCondition(raw: unknown): CarLoanVehicleCondition | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  if (v === 'new' || v === 'used' || v === 'both') return v;
  return null;
}

function readBool(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

function readPositiveNumber(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Resolve car-specific fields from typed columns and/or metadata JSON. */
export function resolveCarLoanProductFields(loan: FinanceLoan): ResolvedCarLoanProductFields {
  const meta = asRecord(loan.metadata);

  const vehicleCondition =
    readCondition(loan.vehicleCondition) ?? readCondition(meta?.vehicleCondition) ?? null;

  const vehicleAgeMax =
    readPositiveNumber(loan.vehicleAgeMax) ?? readPositiveNumber(meta?.vehicleAgeMax) ?? null;

  const financingPercentageMin =
    readPositiveNumber(loan.financingPercentageMin) ??
    readPositiveNumber(meta?.financingPercentageMin) ??
    readPositiveNumber(meta?.financing_percentage_min) ??
    null;

  const financingPercentageMax =
    readPositiveNumber(loan.financingPercentageMax) ??
    readPositiveNumber(meta?.financingPercentageMax) ??
    readPositiveNumber(meta?.financing_percentage_max) ??
    null;

  const vehicleValuationRequired =
    readBool(loan.vehicleValuationRequired) ??
    readBool(meta?.vehicleValuationRequired) ??
    readBool(meta?.vehicle_valuation_required) ??
    null;

  const prepaymentTerms =
    loan.prepaymentChargeText?.trim() ||
    (typeof meta?.prepaymentTerms === 'string' ? meta.prepaymentTerms.trim() : '') ||
    null;

  const foreclosureTerms =
    loan.foreclosureChargeText?.trim() ||
    (typeof meta?.foreclosureTerms === 'string' ? meta.foreclosureTerms.trim() : '') ||
    null;

  return {
    vehicleCondition,
    vehicleAgeMax,
    financingPercentageMin,
    financingPercentageMax,
    vehicleValuationRequired,
    prepaymentTerms: prepaymentTerms || null,
    foreclosureTerms: foreclosureTerms || null,
  };
}

export function formatCarVehicleConditionLabel(condition: CarLoanVehicleCondition | null): string {
  if (condition === 'new') return 'New';
  if (condition === 'used') return 'Used';
  if (condition === 'both') return 'New & Used';
  return 'Not currently available';
}

/** Display financing % range from product data only. */
export function formatCarFinancingPercentLabel(fields: ResolvedCarLoanProductFields): string {
  const min = fields.financingPercentageMin;
  const max = fields.financingPercentageMax;
  if (min != null && max != null) {
    if (min === max) return `${Math.round(min)}%`;
    return `${Math.round(min)}–${Math.round(max)}%`;
  }
  if (max != null) return `Up to ${Math.round(max)}%`;
  if (min != null) return `From ${Math.round(min)}%`;
  return 'Not currently available';
}

export function carLoanMatchesVehicleConditionFilter(
  fields: ResolvedCarLoanProductFields,
  filter: string | undefined,
): boolean {
  if (!filter?.trim()) return true;
  const wanted = filter.trim().toLowerCase();
  if (wanted !== 'new' && wanted !== 'used') return true;
  if (fields.vehicleCondition == null) return false;
  if (fields.vehicleCondition === 'both') return true;
  return fields.vehicleCondition === wanted;
}

/**
 * Filter: product must support at least this financing % (uses max when present).
 * Products without financing % data are excluded when the filter is active.
 */
export function carLoanMatchesFinancingPercentFilter(
  fields: ResolvedCarLoanProductFields,
  financingPercentMin: string | undefined,
): boolean {
  if (!financingPercentMin?.trim()) return true;
  const wanted = toNumber(financingPercentMin);
  if (wanted == null) return true;
  const productMax = fields.financingPercentageMax ?? fields.financingPercentageMin;
  if (productMax == null) return false;
  return productMax >= wanted;
}

export function filterCarLoanCatalog(
  loans: FinanceLoan[],
  filters?: { vehicleCondition?: string; financingPercentMin?: string },
): FinanceLoan[] {
  if (!filters?.vehicleCondition && !filters?.financingPercentMin) return loans;
  return loans.filter((loan) => {
    const fields = resolveCarLoanProductFields(loan);
    return (
      carLoanMatchesVehicleConditionFilter(fields, filters.vehicleCondition) &&
      carLoanMatchesFinancingPercentFilter(fields, filters.financingPercentMin)
    );
  });
}
