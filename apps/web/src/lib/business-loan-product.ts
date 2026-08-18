/**
 * Business Loan product metadata resolution — never invent missing fields.
 */

import type { FinanceLoan } from '@/services/finance';

export type BusinessSecurityType = 'secured' | 'unsecured' | 'both' | 'unknown';
export type BusinessFacilityType = 'working_capital' | 'term_loan' | 'both' | 'unknown';

export type BusinessLoanProductFields = {
  securityType: BusinessSecurityType;
  facilityType: BusinessFacilityType;
};

function readMeta(loan: FinanceLoan, keys: string[]): unknown {
  const meta = (loan as { metadata?: Record<string, unknown> | null }).metadata;
  if (!meta || typeof meta !== 'object') return undefined;
  for (const key of keys) {
    if (key in meta) return meta[key];
  }
  return undefined;
}

export function resolveBusinessLoanProductFields(loan: FinanceLoan): BusinessLoanProductFields {
  const securityRaw = String(
    readMeta(loan, ['securityType', 'securedUnsecured', 'security']) ?? '',
  ).toLowerCase();
  let securityType: BusinessSecurityType = 'unknown';
  if (securityRaw.includes('both')) securityType = 'both';
  else if (securityRaw.includes('unsecured')) securityType = 'unsecured';
  else if (securityRaw.includes('secured')) securityType = 'secured';

  const facilityRaw = String(
    readMeta(loan, ['facilityType', 'businessFacility', 'loanStructure']) ?? '',
  ).toLowerCase();
  let facilityType: BusinessFacilityType = 'unknown';
  if (facilityRaw.includes('both')) facilityType = 'both';
  else if (facilityRaw.includes('working')) facilityType = 'working_capital';
  else if (facilityRaw.includes('term')) facilityType = 'term_loan';

  return { securityType, facilityType };
}

export function formatBusinessSecurityLabel(t: BusinessSecurityType): string {
  switch (t) {
    case 'secured':
      return 'Secured';
    case 'unsecured':
      return 'Unsecured';
    case 'both':
      return 'Secured / Unsecured';
    default:
      return 'Not currently available';
  }
}

export function formatBusinessFacilityLabel(t: BusinessFacilityType): string {
  switch (t) {
    case 'working_capital':
      return 'Working Capital';
    case 'term_loan':
      return 'Term Loan';
    case 'both':
      return 'Working Capital / Term';
    default:
      return 'Not currently available';
  }
}
