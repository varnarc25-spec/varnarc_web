/**
 * LAP product metadata resolution — never invent missing fields.
 */

import type { FinanceLoan } from '@/services/finance';
import { formatRateTypeLabel } from '@/lib/home-loan-page';
import { toNumber } from '@/components/loans/loan-format';

export type LapProductFields = {
  propertyTypeSummary: string | null;
  illustrativeLtvPercent: number | null;
  rateTypeLabel: string;
};

function readMeta(loan: FinanceLoan, keys: string[]): unknown {
  const meta = (loan as { metadata?: Record<string, unknown> | null }).metadata;
  if (!meta || typeof meta !== 'object') return undefined;
  for (const key of keys) {
    if (key in meta) return meta[key];
  }
  return undefined;
}

export function resolveLapProductFields(loan: FinanceLoan): LapProductFields {
  const propertyRaw = readMeta(loan, ['propertyType', 'property_type', 'acceptedPropertyType']);
  const propertyTypeSummary =
    typeof propertyRaw === 'string' && propertyRaw.trim() ? propertyRaw.trim() : null;

  const ltvRaw =
    toNumber(readMeta(loan, ['ltv', 'ltvMax', 'maxLtv', 'illustrativeLtv']) as string | number) ??
    null;

  return {
    propertyTypeSummary,
    illustrativeLtvPercent: ltvRaw != null && ltvRaw > 0 ? ltvRaw : null,
    rateTypeLabel: formatRateTypeLabel(loan.rateType),
  };
}
