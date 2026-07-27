import type { FieldVisibilityMap } from './calculator-field-visibility';

const LOAN_TYPE_CODE: Record<string, number> = {
  home: 1,
  personal: 2,
  car: 3,
  education: 4,
};

const STANDARD_EMI_OUTPUTS = {
  monthlyRate: 'annualRate / 12 / 100',
  emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
  totalPayment: 'emi * tenureMonths',
  totalInterest: 'totalPayment - principal',
};

export const LOAN_CALCULATOR_SLUG = 'loan';

export const LOAN_CALCULATOR_FIELD_VISIBILITY: FieldVisibilityMap = {
  propertyValue: { loanType: ['home'] },
  onRoadPrice: { loanType: ['car'] },
  downPayment: { loanType: ['home', 'car'] },
  principal: { loanType: ['personal', 'home', 'car', 'education'] },
  courseFee: { loanType: ['education'] },
  loanPercent: { loanType: ['education'] },
  moratoriumMonths: { loanType: ['education'] },
};

export const LOAN_CALCULATOR_FORMULA = {
  type: 'rules',
  rules: [
    {
      when: 'loanTypeCode == 4',
      outputs: {
        principal: 'principal',
        moratoriumInterest: 'principal * annualRate / 100 * moratoriumMonths / 12',
        effectivePrincipal: 'principal + moratoriumInterest',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'effectivePrincipal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    {
      when: 'loanTypeCode == 1',
      outputs: {
        principal: 'principal',
        ...STANDARD_EMI_OUTPUTS,
      },
    },
    {
      when: 'loanTypeCode == 3',
      outputs: {
        principal: 'principal',
        ...STANDARD_EMI_OUTPUTS,
      },
    },
  ],
  outputs: {
    principal: 'principal',
    ...STANDARD_EMI_OUTPUTS,
  },
};

/** Normalize loan calculator inputs before formula execution. */
export function resolveLoanCalculatorInputs(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const loanType = String(inputs.loanType ?? 'personal');
  const resolved: Record<string, unknown> = {
    ...inputs,
    loanType,
    loanTypeCode: LOAN_TYPE_CODE[loanType] ?? 2,
  };

  const num = (key: string) => {
    const raw = inputs[key];
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  if (loanType === 'home') {
    const propertyValue = num('propertyValue');
    const downPayment = num('downPayment');
    const manualPrincipal = num('principal');
    resolved.principal = manualPrincipal > 0 ? manualPrincipal : propertyValue - downPayment;
  } else if (loanType === 'car') {
    const onRoadPrice = num('onRoadPrice');
    const downPayment = num('downPayment');
    const manualPrincipal = num('principal');
    resolved.principal = manualPrincipal > 0 ? manualPrincipal : onRoadPrice - downPayment;
  } else if (loanType === 'education') {
    const courseFee = num('courseFee');
    const loanPercent = num('loanPercent') || 90;
    const moratoriumMonths = num('moratoriumMonths');
    const annualRate = num('annualRate');
    const loanAmount = num('principal') > 0 ? num('principal') : (courseFee * loanPercent) / 100;
    const moratoriumInterest = (loanAmount * annualRate * moratoriumMonths) / 1200;
    resolved.principal = loanAmount;
    resolved.effectivePrincipal = loanAmount + moratoriumInterest;
  } else {
    resolved.principal = num('principal');
  }

  return resolved;
}

export function syncLoanAmountFromPrice(
  loanType: string,
  values: Record<string, string>,
): Record<string, string> {
  const num = (key: string) => Number(values[key] ?? 0);
  if (loanType === 'home') {
    const computed = Math.max(num('propertyValue') - num('downPayment'), 0);
    if (computed > 0) return { ...values, principal: String(Math.round(computed)) };
  }
  if (loanType === 'car') {
    const computed = Math.max(num('onRoadPrice') - num('downPayment'), 0);
    if (computed > 0) return { ...values, principal: String(Math.round(computed)) };
  }
  if (loanType === 'education') {
    const computed = Math.round((num('courseFee') * (num('loanPercent') || 90)) / 100);
    if (computed > 0) return { ...values, principal: String(computed) };
  }
  return values;
}
