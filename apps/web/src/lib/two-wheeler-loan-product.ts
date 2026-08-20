/**
 * Two-Wheeler loan product field resolution.
 * Reads optional top-level fields or Loan.metadata — never invents values.
 */

import type { FinanceLoan } from '@/services/finance';
import { toNumber } from '@/components/loans/loan-format';

export type TwoWheelerVehicleCondition = 'new' | 'used' | 'both';

export type ResolvedTwoWheelerProductFields = {
  vehicleCondition: TwoWheelerVehicleCondition | null;
  vehicleAgeMax: number | null;
  financingPercentageMin: number | null;
  financingPercentageMax: number | null;
  prepaymentTerms: string | null;
  foreclosureTerms: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCondition(raw: unknown): TwoWheelerVehicleCondition | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  if (v === 'new' || v === 'used' || v === 'both') return v;
  return null;
}

function readPositiveNumber(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function resolveTwoWheelerProductFields(loan: FinanceLoan): ResolvedTwoWheelerProductFields {
  const meta = asRecord(loan.metadata);

  const vehicleCondition =
    readCondition(loan.vehicleCondition) ?? readCondition(meta?.vehicleCondition) ?? null;

  const vehicleAgeMax =
    readPositiveNumber(loan.vehicleAgeMax) ?? readPositiveNumber(meta?.vehicleAgeMax) ?? null;

  const financingPercentageMin =
    readPositiveNumber(loan.financingPercentageMin) ??
    readPositiveNumber(meta?.financingPercentageMin) ??
    null;

  const financingPercentageMax =
    readPositiveNumber(loan.financingPercentageMax) ??
    readPositiveNumber(meta?.financingPercentageMax) ??
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
    prepaymentTerms: prepaymentTerms || null,
    foreclosureTerms: foreclosureTerms || null,
  };
}

export function formatTwoWheelerVehicleConditionLabel(
  condition: TwoWheelerVehicleCondition | null,
): string {
  if (condition === 'new') return 'New';
  if (condition === 'used') return 'Used';
  if (condition === 'both') return 'New & Used';
  return 'Not currently available';
}

export function formatTwoWheelerFinancingPercentLabel(
  fields: ResolvedTwoWheelerProductFields,
): string {
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

export function twoWheelerMatchesVehicleConditionFilter(
  fields: ResolvedTwoWheelerProductFields,
  filter: string | undefined,
): boolean {
  if (!filter?.trim()) return true;
  const wanted = filter.trim().toLowerCase();
  if (wanted !== 'new' && wanted !== 'used') return true;
  if (fields.vehicleCondition == null) return false;
  if (fields.vehicleCondition === 'both') return true;
  return fields.vehicleCondition === wanted;
}

export function twoWheelerMatchesFinancingPercentFilter(
  fields: ResolvedTwoWheelerProductFields,
  financingPercentMin: string | undefined,
): boolean {
  if (!financingPercentMin?.trim()) return true;
  const wanted = toNumber(financingPercentMin);
  if (wanted == null) return true;
  const productMax = fields.financingPercentageMax ?? fields.financingPercentageMin;
  if (productMax == null) return false;
  return productMax >= wanted;
}

export function filterTwoWheelerCatalog(
  loans: FinanceLoan[],
  filters?: { vehicleCondition?: string; financingPercentMin?: string },
): FinanceLoan[] {
  if (!filters?.vehicleCondition && !filters?.financingPercentMin) return loans;
  return loans.filter((loan) => {
    const fields = resolveTwoWheelerProductFields(loan);
    return (
      twoWheelerMatchesVehicleConditionFilter(fields, filters.vehicleCondition) &&
      twoWheelerMatchesFinancingPercentFilter(fields, filters.financingPercentMin)
    );
  });
}

/** Short aliases used by older call sites / tests */
export const resolveTwProductFields = resolveTwoWheelerProductFields;
export const formatTwVehicleConditionLabel = formatTwoWheelerVehicleConditionLabel;
export const formatTwFinancingPercentLabel = formatTwoWheelerFinancingPercentLabel;
export const filterTwLoanCatalog = filterTwoWheelerCatalog;
