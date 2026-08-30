import {
  AFFORDABILITY_CALC_VERSION,
  BALANCED_TOLERANCE_RATIO,
  EMI_BURDEN_INFO,
  PEAK_CASH_FACTOR,
  RECOMMENDED_CONTINGENCY_PERCENT,
} from './rates';
import {
  affordabilityCostInputSchema,
  type AffordabilityCostInput,
  type AffordabilityCostResult,
  type AffordabilityStatus,
} from './types';

function roundMoney(n: number): number {
  return Math.round(n);
}

function resolveStatus(difference: number, totalNeed: number): AffordabilityStatus {
  const tol = Math.max(totalNeed * BALANCED_TOLERANCE_RATIO, 25_000);
  if (Math.abs(difference) <= tol) return 'balanced';
  return difference > 0 ? 'surplus' : 'gap';
}

/**
 * Construction Affordability Calculator — pure function.
 * Educational planning only — not personalized financial advice.
 */
export function calculateConstructionAffordability(
  raw: AffordabilityCostInput,
): AffordabilityCostResult {
  const input = affordabilityCostInputSchema.parse(raw);
  const projectCost = roundMoney(input.estimatedProjectCost);
  const savings = roundMoney(input.availableSavings);
  const loan = roundMoney(input.expectedLoanAmount ?? 0);
  const duration = input.constructionDurationMonths;
  const reservePercent = input.contingencyReservePercent ?? 10;
  const reserveAmount = roundMoney((projectCost * reservePercent) / 100);
  const recommendedPercent = RECOMMENDED_CONTINGENCY_PERCENT;
  const recommendedAmount = roundMoney((projectCost * recommendedPercent) / 100);

  // Funding need = project cost + user's chosen contingency reserve
  // (if contingency is already inside project cost, reserve is an additional buffer)
  const totalFundingNeed = projectCost + reserveAmount;
  const availableFunds = savings + loan;
  const fundingDifference = availableFunds - totalFundingNeed;
  const status = resolveStatus(fundingDifference, totalFundingNeed);

  const monthlyCashRequirement = roundMoney(totalFundingNeed / duration);
  const peakCashRequirement = roundMoney(monthlyCashRequirement * PEAK_CASH_FACTOR);

  let financing: AffordabilityCostResult['financing'] = null;
  const emi = input.monthlyEmi != null ? Number(input.monthlyEmi) : null;
  const income = input.monthlyIncome != null ? Number(input.monthlyIncome) : null;
  if (emi != null && emi > 0 && income != null && income > 0) {
    const emiToIncomePercent = Math.round((emi / income) * 1000) / 10;
    let note = `EMI is about ${emiToIncomePercent}% of stated monthly income (informational only).`;
    if (emiToIncomePercent < EMI_BURDEN_INFO.comfortableBelow) {
      note += ` Below ~${EMI_BURDEN_INFO.comfortableBelow}% is often discussed as a lighter repayment load in planning guides — lenders use their own rules.`;
    } else if (emiToIncomePercent >= EMI_BURDEN_INFO.elevatedAbove) {
      note += ` At or above ~${EMI_BURDEN_INFO.elevatedAbove}% many planning guides flag repayment pressure — this is not a credit decision.`;
    } else {
      note += ' Mid-range EMI-to-income share for planning discussion only.';
    }
    financing = {
      monthlyEmi: roundMoney(emi),
      monthlyIncome: roundMoney(income),
      emiToIncomePercent,
      residualIncomeAfterEmi: roundMoney(income - emi),
      note,
    };
  }

  const alreadyPct = input.contingencyAlreadyPercent ?? 10;

  return {
    currency: 'INR',
    estimatedProjectCost: projectCost,
    contingencyReservePercent: reservePercent,
    contingencyReserveAmount: reserveAmount,
    recommendedContingencyPercent: recommendedPercent,
    recommendedContingencyAmount: recommendedAmount,
    totalFundingNeed,
    availableSavings: savings,
    expectedLoanAmount: loan,
    availableFunds,
    fundingDifference,
    status,
    constructionDurationMonths: duration,
    monthlyCashRequirement,
    peakCashRequirement,
    financing,
    sourceLabel: input.sourceLabel ?? null,
    assumptions: [
      `Project cost ₹${projectCost.toLocaleString('en-IN')} (may already include ~${alreadyPct}% contingency from a prior estimate).`,
      `Additional contingency reserve ${reservePercent}% (₹${reserveAmount.toLocaleString('en-IN')}) held on top for planning.`,
      `Recommended contingency band ~${recommendedPercent}% (₹${recommendedAmount.toLocaleString('en-IN')}) for typical builds.`,
      `Available funds = savings ₹${savings.toLocaleString('en-IN')} + expected loan ₹${loan.toLocaleString('en-IN')}.`,
      `Cash flow spread evenly over ${duration} months for the monthly figure; peak uses ×${PEAK_CASH_FACTOR} for early-phase intensity.`,
      'Loan sanction, disbursement schedule, interest and fees are not modelled.',
      'Land cost, registration, interiors extras and inflation are excluded unless already inside the project cost input.',
    ],
    methodology: {
      title: 'How Varnarc calculated this affordability view',
      steps: [
        'Take estimated project cost (manual entry or linked Varnarc calculation).',
        `Add contingency reserve (${reservePercent}%).`,
        'Sum available savings and expected loan as available funds.',
        'Surplus / gap = available funds − total funding need.',
        `Monthly cash ≈ total funding need ÷ ${duration} months; peak ≈ monthly × ${PEAK_CASH_FACTOR}.`,
        'If EMI and income are provided, show EMI-to-income % as an informational ratio only.',
      ],
    },
    disclaimer:
      'This tool is an educational planning aid. It is not personalized financial, credit, tax or investment advice and is not a loan offer or eligibility decision. Always verify costs with contractors and funding terms with your bank or advisor.',
    version: AFFORDABILITY_CALC_VERSION,
  };
}
