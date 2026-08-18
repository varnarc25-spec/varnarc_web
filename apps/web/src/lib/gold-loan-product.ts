/**
 * Gold Loan product metadata resolution — never invent missing fields.
 */

import type { FinanceLoan } from '@/services/finance';

export type GoldRepaymentProductType = 'emi' | 'interest_only' | 'bullet' | 'multiple' | 'unknown';

export type GoldLoanProductFields = {
  repaymentType: GoldRepaymentProductType;
  purityAcceptedSummary: string | null;
};

function readMeta(loan: FinanceLoan, keys: string[]): unknown {
  const meta = (loan as { metadata?: Record<string, unknown> | null }).metadata;
  if (!meta || typeof meta !== 'object') return undefined;
  for (const key of keys) {
    if (key in meta) return meta[key];
  }
  return undefined;
}

export function resolveGoldLoanProductFields(loan: FinanceLoan): GoldLoanProductFields {
  const repaymentRaw = String(
    readMeta(loan, ['repaymentType', 'repaymentMethod', 'repayment']) ?? '',
  ).toLowerCase();
  let repaymentType: GoldRepaymentProductType = 'unknown';
  if (repaymentRaw.includes('emi') && repaymentRaw.includes('interest')) repaymentType = 'multiple';
  else if (repaymentRaw.includes('emi')) repaymentType = 'emi';
  else if (repaymentRaw.includes('interest')) repaymentType = 'interest_only';
  else if (repaymentRaw.includes('bullet')) repaymentType = 'bullet';

  const purity = readMeta(loan, ['purityAccepted', 'acceptedPurity', 'minPurity']);
  const purityAcceptedSummary = typeof purity === 'string' && purity.trim() ? purity.trim() : null;

  return { repaymentType, purityAcceptedSummary };
}

export function formatGoldRepaymentProductLabel(t: GoldRepaymentProductType): string {
  switch (t) {
    case 'emi':
      return 'EMI';
    case 'interest_only':
      return 'Periodic interest';
    case 'bullet':
      return 'Bullet-style';
    case 'multiple':
      return 'Multiple structures';
    default:
      return 'Not currently available';
  }
}
