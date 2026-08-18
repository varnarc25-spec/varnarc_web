/**
 * Education Loan product metadata resolution — never invents values.
 */

import type { FinanceLoan } from '@/services/finance';

export type EducationStudyCoverage = 'india' | 'abroad' | 'both' | null;
export type EducationSecurityType = 'secured' | 'unsecured' | 'both' | null;

export type ResolvedEducationLoanProductFields = {
  studyCoverage: EducationStudyCoverage;
  securityType: EducationSecurityType;
  moratoriumMonthsMax: number | null;
  coApplicantRequired: boolean | null;
  collateralRequired: boolean | null;
};

function meta(loan: FinanceLoan): Record<string, unknown> {
  return loan.metadata && typeof loan.metadata === 'object' && !Array.isArray(loan.metadata)
    ? (loan.metadata as Record<string, unknown>)
    : {};
}

function readStudyCoverage(raw: unknown): EducationStudyCoverage {
  if (raw === 'india' || raw === 'abroad' || raw === 'both') return raw;
  return null;
}

function readSecurity(raw: unknown): EducationSecurityType {
  if (raw === 'secured' || raw === 'unsecured' || raw === 'both') return raw;
  return null;
}

function readNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() && Number.isFinite(Number(raw))) return Number(raw);
  return null;
}

function readBoolean(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  return null;
}

export function resolveEducationLoanProductFields(
  loan: FinanceLoan,
): ResolvedEducationLoanProductFields {
  const m = meta(loan);
  return {
    studyCoverage: readStudyCoverage(m.studyCoverage ?? m.studyDestination),
    securityType: readSecurity(m.securityType ?? m.securedUnsecured),
    moratoriumMonthsMax: readNumber(m.moratoriumMonthsMax),
    coApplicantRequired: readBoolean(m.coApplicantRequired),
    collateralRequired: readBoolean(m.collateralRequired),
  };
}

export function formatEducationStudyCoverageLabel(v: EducationStudyCoverage): string {
  if (v === 'india') return 'Domestic';
  if (v === 'abroad') return 'Abroad';
  if (v === 'both') return 'Domestic & Abroad';
  return 'Not currently available';
}

export function formatEducationSecurityLabel(v: EducationSecurityType): string {
  if (v === 'secured') return 'Secured';
  if (v === 'unsecured') return 'Unsecured';
  if (v === 'both') return 'Secured / Unsecured';
  return 'Not currently available';
}

export function formatEducationMoratoriumLabel(months: number | null): string {
  if (months == null) return 'Not currently available';
  return `Up to ${months} months`;
}

export function filterEducationLoanCatalog(
  loans: FinanceLoan[],
  filters: {
    studyCoverage?: string | null;
    securityType?: string | null;
  },
): FinanceLoan[] {
  return loans.filter((loan) => {
    const fields = resolveEducationLoanProductFields(loan);
    if (filters.studyCoverage === 'india' || filters.studyCoverage === 'abroad') {
      if (
        fields.studyCoverage != null &&
        fields.studyCoverage !== 'both' &&
        fields.studyCoverage !== filters.studyCoverage
      ) {
        return false;
      }
    }
    if (filters.securityType === 'secured' || filters.securityType === 'unsecured') {
      if (
        fields.securityType != null &&
        fields.securityType !== 'both' &&
        fields.securityType !== filters.securityType
      ) {
        return false;
      }
    }
    return true;
  });
}
