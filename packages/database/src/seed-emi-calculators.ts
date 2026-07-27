import type { PrismaClient } from '@prisma/client';
import { type CalculatorInput, upsertCalculator } from './seed-calculators';

type CategoryIds = {
  finance: string;
  automobile: string;
};

const EMI_CARDS = [
  { key: 'emi', label: 'Monthly EMI', format: 'currency' as const },
  { key: 'totalPayment', label: 'Total payment', format: 'currency' as const },
  { key: 'totalInterest', label: 'Total interest', format: 'currency' as const },
];

const EMI_CHART = {
  title: 'Principal vs interest',
  keys: ['loanAmount', 'totalInterest'],
  labels: { loanAmount: 'Principal', totalInterest: 'Interest' },
};

function emiFormula(loanAmountExpr: string) {
  return {
    loanAmount: loanAmountExpr,
    monthlyRate: 'annualRate / 12 / 100',
    emi: 'loanAmount * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
    totalPayment: 'emi * tenureMonths',
    totalInterest: 'totalPayment - loanAmount',
  };
}

function emiResultTemplate(
  extraCards: Array<{ key: string; label: string; format?: string }> = [],
) {
  const cards = [...extraCards, ...EMI_CARDS];
  return {
    cards,
    table: {
      title: 'Payment summary',
      rows: cards.map((c) => ({ label: c.label, key: c.key, format: c.format })),
    },
    chart: EMI_CHART,
    breakdown: {
      title: 'Breakdown',
      items: EMI_CARDS.map((c) => ({ label: c.label, key: c.key, format: c.format })),
    },
    recommendations: true,
  };
}

const singlePageSettings = (faq: Array<{ q: string; a: string }>) => ({
  layout: 'single',
  faq,
});

/** Full EMI calculator suite (15 specialized tools) */
export async function seedEmiCalculators(prisma: PrismaClient, cats: CategoryIds) {
  const { finance, automobile } = cats;

  const calculators: CalculatorInput[] = [
    {
      slug: 'personal-loan-emi',
      name: 'Personal Loan EMI Calculator',
      description:
        'Calculate EMI for personal loans — medical expenses, travel, weddings, or any unsecured borrowing.',
      categoryId: finance,
      seoTitle: 'Personal Loan EMI Calculator | Varnarc',
      seoDescription: 'Estimate monthly EMI and total interest for personal loans in India.',
      skipEnrich: true,
      formula: { outputs: emiFormula('loanAmount') },
      resultTemplate: emiResultTemplate(),
      settings: singlePageSettings([
        {
          q: 'What is a good personal loan interest rate?',
          a: 'Rates typically range from 10–24% p.a. depending on credit score and lender.',
        },
        {
          q: 'Does this include processing fees?',
          a: 'No. Processing fees and GST are charged separately by lenders.',
        },
      ]),
      fields: [
        {
          key: 'loanAmount',
          label: 'Loan amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '500000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '12.5',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'slider',
          sortOrder: 2,
          defaultValue: '36',
          validation: { min: 6, max: 84, step: 6 },
        },
      ],
    },
    {
      slug: 'home-loan-emi',
      name: 'Home Loan EMI Calculator',
      description:
        'Estimate home loan EMI from property value, down payment, interest rate, and tenure.',
      categoryId: finance,
      seoTitle: 'Home Loan EMI Calculator | Varnarc',
      seoDescription: 'Calculate home loan EMI, total interest, and repayment for buying a house.',
      skipEnrich: true,
      formula: { outputs: emiFormula('propertyValue - downPayment') },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'How much down payment is required?',
          a: 'Most banks finance 75–90% of property value; you pay the rest as down payment.',
        },
        {
          q: 'Are registration and stamp duty included?',
          a: 'No. This calculator covers only the loan principal and interest.',
        },
      ]),
      fields: [
        {
          key: 'propertyValue',
          label: 'Property value',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '7500000',
        },
        {
          key: 'downPayment',
          label: 'Down payment',
          fieldType: 'currency',
          sortOrder: 1,
          defaultValue: '1500000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '8.75',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'slider',
          sortOrder: 3,
          defaultValue: '240',
          validation: { min: 12, max: 360, step: 12 },
        },
      ],
    },
    {
      slug: 'car-loan',
      name: 'Car Loan EMI Calculator',
      description: 'Plan EMI for a new or used car purchase with down payment and on-road price.',
      categoryId: automobile,
      seoTitle: 'Car Loan EMI Calculator | Varnarc',
      seoDescription: 'Calculate car loan EMI from on-road price, down payment, rate, and tenure.',
      skipEnrich: true,
      formula: { outputs: emiFormula('onRoadPrice - downPayment') },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What is on-road price?',
          a: 'On-road price includes ex-showroom price, RTO, insurance, and other charges.',
        },
        {
          q: 'Can I get 100% car finance?',
          a: 'Most lenders require 10–20% down payment on the on-road price.',
        },
      ]),
      fields: [
        {
          key: 'onRoadPrice',
          label: 'On-road price',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '1000000',
        },
        {
          key: 'downPayment',
          label: 'Down payment',
          fieldType: 'currency',
          sortOrder: 1,
          defaultValue: '200000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '9.5',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '60',
        },
      ],
    },
    {
      slug: 'bike-loan-emi',
      name: 'Bike Loan EMI Calculator',
      description:
        'Calculate two-wheeler loan EMI from bike price, down payment, rate, and tenure.',
      categoryId: automobile,
      seoTitle: 'Bike Loan EMI Calculator | Varnarc',
      seoDescription: 'Estimate monthly EMI for new or used bike and scooter loans.',
      skipEnrich: true,
      formula: { outputs: emiFormula('bikePrice - downPayment') },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What tenure is typical for bike loans?',
          a: 'Most two-wheeler loans run 12–48 months depending on the lender.',
        },
        {
          q: 'Is insurance included in bike price?',
          a: 'Include on-road price with insurance for an accurate loan estimate.',
        },
      ]),
      fields: [
        {
          key: 'bikePrice',
          label: 'Bike on-road price',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '150000',
        },
        {
          key: 'downPayment',
          label: 'Down payment',
          fieldType: 'currency',
          sortOrder: 1,
          defaultValue: '30000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '11',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '36',
        },
      ],
    },
    {
      slug: 'education-loan-emi',
      name: 'Education Loan EMI Calculator',
      description:
        'Estimate student loan EMI including moratorium interest accrued during the study period.',
      categoryId: finance,
      seoTitle: 'Education Loan EMI Calculator | Varnarc',
      seoDescription:
        'Calculate education loan EMI with course fee, moratorium period, rate, and repayment tenure.',
      skipEnrich: true,
      formula: {
        outputs: {
          loanAmount: 'courseFee * loanPercent / 100',
          moratoriumInterest: 'loanAmount * annualRate / 100 * moratoriumMonths / 12',
          effectivePrincipal: 'loanAmount + moratoriumInterest',
          monthlyRate: 'annualRate / 12 / 100',
          emi: 'effectivePrincipal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          totalPayment: 'emi * tenureMonths',
          totalInterest: 'totalPayment - loanAmount',
        },
      },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
        { key: 'moratoriumInterest', label: 'Moratorium interest', format: 'currency' },
        { key: 'effectivePrincipal', label: 'Principal after moratorium', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What is a moratorium period?',
          a: 'A study-period grace window when you may not pay EMI; interest usually still accrues.',
        },
        {
          q: 'Is Section 80E tax benefit included?',
          a: 'No. Interest deduction under Section 80E is not modeled in this estimate.',
        },
      ]),
      fields: [
        {
          key: 'courseFee',
          label: 'Course fee',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '2000000',
        },
        {
          key: 'loanPercent',
          label: 'Loan coverage (%)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '90',
        },
        {
          key: 'moratoriumMonths',
          label: 'Moratorium (months)',
          fieldType: 'number',
          sortOrder: 2,
          defaultValue: '24',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 3,
          defaultValue: '9.5',
        },
        {
          key: 'tenureMonths',
          label: 'Repayment tenure (months)',
          fieldType: 'number',
          sortOrder: 4,
          defaultValue: '120',
        },
      ],
    },
    {
      slug: 'business-loan-emi',
      name: 'Business Loan EMI Calculator',
      description:
        'Estimate MSME and business loan EMI by loan amount, business type, rate, and tenure.',
      categoryId: finance,
      seoTitle: 'Business Loan EMI Calculator | Varnarc',
      seoDescription: 'Calculate monthly EMI for business and MSME loans in India.',
      skipEnrich: true,
      formula: {
        outputs: {
          rateAdjustment:
            'if(businessType == 1, 1.5, if(businessType == 2, 0.5, if(businessType == 3, 1, 0)))',
          adjustedRate: 'annualRate + rateAdjustment',
          monthlyRate: 'adjustedRate / 12 / 100',
          emi: 'loanAmount * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          totalPayment: 'emi * tenureMonths',
          totalInterest: 'totalPayment - loanAmount',
        },
      },
      resultTemplate: emiResultTemplate([
        { key: 'adjustedRate', label: 'Adjusted rate (% p.a.)', format: 'percentage' },
      ]),
      settings: singlePageSettings([
        {
          q: 'How does business type affect the rate?',
          a: 'Trading businesses may see slightly higher risk premiums; manufacturing may qualify for better rates.',
        },
        {
          q: 'Are collateral requirements included?',
          a: 'No. Secured vs unsecured terms vary by lender and are not modeled here.',
        },
      ]),
      fields: [
        {
          key: 'loanAmount',
          label: 'Loan amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '2500000',
        },
        {
          key: 'businessType',
          label: 'Business type',
          fieldType: 'dropdown',
          sortOrder: 1,
          defaultValue: '1',
          options: [
            { value: '1', label: 'Trading' },
            { value: '2', label: 'Manufacturing' },
            { value: '3', label: 'Services' },
            { value: '4', label: 'Startup' },
          ],
        },
        {
          key: 'annualRate',
          label: 'Base interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '14',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '48',
        },
      ],
    },
    {
      slug: 'gold-loan-emi',
      name: 'Gold Loan EMI Calculator',
      description:
        'Calculate gold loan EMI from gold value, loan-to-value ratio, interest, and tenure.',
      categoryId: finance,
      seoTitle: 'Gold Loan EMI Calculator | Varnarc',
      seoDescription: 'Estimate EMI for gold-backed loans based on LTV and gold value.',
      skipEnrich: true,
      formula: { outputs: emiFormula('goldValue * ltvPercent / 100') },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What LTV do gold loan lenders offer?',
          a: 'Banks and NBFCs typically lend 65–90% of gold value depending on purity and policy.',
        },
        {
          q: 'Is gold price per gram included?',
          a: 'Enter total gold value (weight × current rate) in the gold value field.',
        },
      ]),
      fields: [
        {
          key: 'goldValue',
          label: 'Gold value',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '500000',
        },
        {
          key: 'ltvPercent',
          label: 'Loan-to-value (%)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '75',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '11',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '12',
        },
      ],
    },
    {
      slug: 'loan-against-property-emi',
      name: 'Loan Against Property EMI Calculator',
      description:
        'Estimate mortgage loan EMI from property value, LTV, interest rate, and tenure.',
      categoryId: finance,
      seoTitle: 'Loan Against Property EMI Calculator | Varnarc',
      seoDescription: 'Calculate LAP / mortgage loan EMI and total interest.',
      skipEnrich: true,
      formula: { outputs: emiFormula('propertyValue * ltvPercent / 100') },
      resultTemplate: emiResultTemplate([
        { key: 'loanAmount', label: 'Loan amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What is LTV for LAP?',
          a: 'Lenders typically offer 50–70% of property market value for loan against property.',
        },
        {
          q: 'Can I use commercial property?',
          a: 'Yes, but LTV and rates may differ from residential property — adjust inputs accordingly.',
        },
      ]),
      fields: [
        {
          key: 'propertyValue',
          label: 'Property value',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '10000000',
        },
        {
          key: 'ltvPercent',
          label: 'LTV (%)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '60',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '10.5',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'slider',
          sortOrder: 3,
          defaultValue: '180',
          validation: { min: 12, max: 240, step: 12 },
        },
      ],
    },
    {
      slug: 'credit-card-emi',
      name: 'Credit Card EMI Calculator',
      description:
        'Convert a credit card purchase to EMI with conversion fee, interest rate, and tenure.',
      categoryId: finance,
      seoTitle: 'Credit Card EMI Calculator | Varnarc',
      seoDescription:
        'Estimate monthly EMI when converting a credit card purchase to installments.',
      skipEnrich: true,
      formula: {
        outputs: {
          conversionFee: 'purchaseAmount * conversionFeePercent / 100',
          loanAmount: 'purchaseAmount + conversionFee',
          monthlyRate: 'annualRate / 12 / 100',
          emi: 'loanAmount * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          totalPayment: 'emi * tenureMonths',
          totalInterest: 'totalPayment - loanAmount',
        },
      },
      resultTemplate: emiResultTemplate([
        { key: 'conversionFee', label: 'Conversion fee', format: 'currency' },
        { key: 'loanAmount', label: 'Financed amount', format: 'currency' },
      ]),
      settings: singlePageSettings([
        {
          q: 'What is a credit card EMI conversion fee?',
          a: 'Banks charge 1–3% of the purchase amount to convert a transaction to EMI.',
        },
        {
          q: 'Is GST on conversion fee included?',
          a: 'No. GST on fees may apply separately depending on the issuer.',
        },
      ]),
      fields: [
        {
          key: 'purchaseAmount',
          label: 'Purchase amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '75000',
        },
        {
          key: 'conversionFeePercent',
          label: 'Conversion fee (%)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '2',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '18',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '12',
        },
      ],
    },
    {
      slug: 'debt-planner',
      name: 'Personal Finance EMI Planner',
      description:
        'Plan total EMI burden across multiple loans using income, expenses, and existing obligations.',
      categoryId: finance,
      seoTitle: 'Debt & EMI Planner | Varnarc',
      seoDescription:
        'Check if you can afford another loan given income, expenses, and existing EMIs.',
      skipEnrich: true,
      formula: {
        outputs: {
          totalExistingEmi: 'loan1Emi + loan2Emi + loan3Emi',
          totalEmi: 'totalExistingEmi + proposedEmi',
          disposableIncome: 'monthlyIncome - monthlyExpenses',
          emiBurdenPercent: 'totalEmi / max(monthlyIncome, 1) * 100',
          surplusAfterEmi: 'disposableIncome - totalEmi',
          recommendedMaxNewEmi: 'max(disposableIncome * 0.4 - totalExistingEmi, 0)',
          withinSafeLimit: 'if(emiBurdenPercent <= 45, 1, 0)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'totalEmi', label: 'Total monthly EMI', format: 'currency' },
          { key: 'emiBurdenPercent', label: 'EMI burden (% of income)', format: 'percentage' },
          { key: 'surplusAfterEmi', label: 'Surplus after EMIs', format: 'currency' },
          { key: 'recommendedMaxNewEmi', label: 'Recommended max new EMI', format: 'currency' },
        ],
        table: {
          title: 'Debt summary',
          rows: [
            { label: 'Existing EMIs', key: 'totalExistingEmi', format: 'currency' },
            { label: 'Total EMI', key: 'totalEmi', format: 'currency' },
            { label: 'Disposable income', key: 'disposableIncome', format: 'currency' },
          ],
        },
        chart: {
          title: 'Income allocation',
          keys: ['disposableIncome', 'totalEmi'],
          labels: { disposableIncome: 'Disposable income', totalEmi: 'Total EMIs' },
        },
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'What is a safe EMI-to-income ratio?',
          a: 'Lenders often cap total EMIs at 40–50% of net monthly income.',
        },
        {
          q: 'Should I include rent in expenses?',
          a: 'Yes. Add all fixed monthly expenses for a realistic affordability check.',
        },
      ]),
      fields: [
        {
          key: 'monthlyIncome',
          label: 'Monthly net income',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '100000',
        },
        {
          key: 'monthlyExpenses',
          label: 'Monthly expenses',
          fieldType: 'currency',
          sortOrder: 1,
          defaultValue: '40000',
        },
        {
          key: 'loan1Emi',
          label: 'Loan 1 EMI',
          fieldType: 'currency',
          sortOrder: 2,
          defaultValue: '15000',
        },
        {
          key: 'loan2Emi',
          label: 'Loan 2 EMI',
          fieldType: 'currency',
          sortOrder: 3,
          defaultValue: '0',
        },
        {
          key: 'loan3Emi',
          label: 'Loan 3 EMI',
          fieldType: 'currency',
          sortOrder: 4,
          defaultValue: '0',
        },
        {
          key: 'proposedEmi',
          label: 'Proposed new loan EMI',
          fieldType: 'currency',
          sortOrder: 5,
          defaultValue: '20000',
        },
      ],
    },
    {
      slug: 'loan-prepayment',
      name: 'Prepayment EMI Calculator',
      description:
        'See interest saved and EMI reduced with a lump-sum prepayment on an existing loan.',
      categoryId: finance,
      seoTitle: 'Loan Prepayment Calculator | Varnarc',
      seoDescription: 'Calculate interest savings and tenure reduction from loan prepayment.',
      skipEnrich: true,
      formula: {
        outputs: {
          monthlyRate: 'annualRate / 12 / 100',
          emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          newPrincipal: 'principal - prepayment',
          newEmi:
            'newPrincipal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          interestSaved: '(emi - newEmi) * tenureMonths',
          tenureSavedMonths: 'prepayment / max(emi, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'interestSaved', label: 'Estimated interest saved', format: 'currency' },
          { key: 'newEmi', label: 'EMI after prepayment', format: 'currency' },
          { key: 'tenureSavedMonths', label: 'Tenure saved (months)', format: 'number' },
        ],
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'Should I reduce EMI or tenure after prepayment?',
          a: 'Reducing tenure saves more interest; lowering EMI improves monthly cash flow.',
        },
        {
          q: 'Are prepayment charges included?',
          a: 'No. Check your lender for foreclosure or prepayment penalties.',
        },
      ]),
      fields: [
        {
          key: 'principal',
          label: 'Outstanding principal',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '2000000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '8.5',
        },
        {
          key: 'tenureMonths',
          label: 'Remaining tenure (months)',
          fieldType: 'number',
          sortOrder: 2,
          defaultValue: '180',
        },
        {
          key: 'prepayment',
          label: 'Prepayment amount',
          fieldType: 'currency',
          sortOrder: 3,
          defaultValue: '200000',
        },
      ],
    },
    {
      slug: 'emi-tenure-calculator',
      name: 'EMI vs Tenure Calculator',
      description: 'Find the loan tenure needed to match your target monthly EMI.',
      categoryId: finance,
      seoTitle: 'EMI vs Tenure Calculator | Varnarc',
      seoDescription: 'Calculate affordable loan tenure for a given EMI budget.',
      skipEnrich: true,
      formula: {
        outputs: {
          monthlyRate: 'annualRate / 12 / 100',
          minEmi: 'loanAmount * monthlyRate',
          tenureMonths:
            'ln(desiredEmi / max(desiredEmi - loanAmount * monthlyRate, 0.01)) / ln(1 + monthlyRate)',
          roundedTenureMonths: 'ceil(tenureMonths)',
          totalPayment: 'desiredEmi * roundedTenureMonths',
          totalInterest: 'totalPayment - loanAmount',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'roundedTenureMonths', label: 'Tenure needed (months)', format: 'number' },
          { key: 'minEmi', label: 'Minimum EMI required', format: 'currency' },
          { key: 'totalInterest', label: 'Total interest', format: 'currency' },
        ],
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'What if my desired EMI is too low?',
          a: 'EMI must exceed the monthly interest (shown as minimum EMI) for the loan to amortize.',
        },
        {
          q: 'Is the tenure exact?',
          a: 'Tenure is rounded up to the nearest month for planning purposes.',
        },
      ]),
      fields: [
        {
          key: 'loanAmount',
          label: 'Loan amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '3000000',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 1,
          defaultValue: '9',
        },
        {
          key: 'desiredEmi',
          label: 'Desired monthly EMI',
          fieldType: 'currency',
          sortOrder: 2,
          defaultValue: '35000',
        },
      ],
    },
    {
      slug: 'emi-rate-compare',
      name: 'EMI vs Interest Calculator',
      description: 'Compare EMI and total interest across two interest rates for the same loan.',
      categoryId: finance,
      seoTitle: 'EMI Rate Comparison Calculator | Varnarc',
      seoDescription: 'Compare banks by EMI and total interest for different interest rates.',
      skipEnrich: true,
      formula: {
        outputs: {
          monthlyRate1: 'rate1 / 12 / 100',
          emi1: 'loanAmount * monthlyRate1 * pow(1 + monthlyRate1, tenureMonths) / (pow(1 + monthlyRate1, tenureMonths) - 1)',
          totalInterest1: 'emi1 * tenureMonths - loanAmount',
          monthlyRate2: 'rate2 / 12 / 100',
          emi2: 'loanAmount * monthlyRate2 * pow(1 + monthlyRate2, tenureMonths) / (pow(1 + monthlyRate2, tenureMonths) - 1)',
          totalInterest2: 'emi2 * tenureMonths - loanAmount',
          emiDifference: 'emi1 - emi2',
          interestSaved: 'totalInterest2 - totalInterest1',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'emi1', label: 'EMI at rate 1', format: 'currency' },
          { key: 'emi2', label: 'EMI at rate 2', format: 'currency' },
          { key: 'interestSaved', label: 'Interest saved (rate 1 vs 2)', format: 'currency' },
        ],
        table: {
          title: 'Rate comparison',
          rows: [
            { label: 'EMI — rate 1', key: 'emi1', format: 'currency' },
            { label: 'EMI — rate 2', key: 'emi2', format: 'currency' },
            { label: 'Total interest — rate 1', key: 'totalInterest1', format: 'currency' },
            { label: 'Total interest — rate 2', key: 'totalInterest2', format: 'currency' },
          ],
        },
        chart: {
          title: 'Total interest comparison',
          keys: ['totalInterest1', 'totalInterest2'],
          labels: { totalInterest1: 'Rate 1', totalInterest2: 'Rate 2' },
        },
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'Which rate should I enter as rate 1?',
          a: 'Enter your current offer as rate 1 and a competing bank rate as rate 2.',
        },
        {
          q: 'Are processing fees compared?',
          a: 'No. Compare only interest cost; add fees separately for a full picture.',
        },
      ]),
      fields: [
        {
          key: 'loanAmount',
          label: 'Loan amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '5000000',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 1,
          defaultValue: '240',
        },
        {
          key: 'rate1',
          label: 'Interest rate 1 (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '8.75',
        },
        {
          key: 'rate2',
          label: 'Interest rate 2 (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 3,
          defaultValue: '9.25',
        },
      ],
    },
    {
      slug: 'fixed-vs-floating-emi',
      name: 'Fixed vs Floating Rate Calculator',
      description:
        'Compare fixed-rate EMI with a floating rate that may increase after an initial period.',
      categoryId: finance,
      seoTitle: 'Fixed vs Floating Home Loan Calculator | Varnarc',
      seoDescription: 'Compare fixed and floating home loan EMI and total interest.',
      skipEnrich: true,
      formula: {
        outputs: {
          fixedMonthlyRate: 'fixedRate / 12 / 100',
          fixedEmi:
            'loanAmount * fixedMonthlyRate * pow(1 + fixedMonthlyRate, tenureMonths) / (pow(1 + fixedMonthlyRate, tenureMonths) - 1)',
          fixedTotalInterest: 'fixedEmi * tenureMonths - loanAmount',
          blendedFloatingRate:
            '(floatingRate * hikeAfterMonths + floatingRateAfter * max(tenureMonths - hikeAfterMonths, 0)) / tenureMonths',
          floatingMonthlyRate: 'blendedFloatingRate / 12 / 100',
          floatingEmi:
            'loanAmount * floatingMonthlyRate * pow(1 + floatingMonthlyRate, tenureMonths) / (pow(1 + floatingMonthlyRate, tenureMonths) - 1)',
          floatingTotalInterest: 'floatingEmi * tenureMonths - loanAmount',
          emiDifference: 'fixedEmi - floatingEmi',
          interestDifference: 'floatingTotalInterest - fixedTotalInterest',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'fixedEmi', label: 'Fixed-rate EMI', format: 'currency' },
          { key: 'floatingEmi', label: 'Floating-rate EMI (blended)', format: 'currency' },
          { key: 'interestDifference', label: 'Interest difference', format: 'currency' },
        ],
        table: {
          title: 'Fixed vs floating',
          rows: [
            { label: 'Fixed EMI', key: 'fixedEmi', format: 'currency' },
            { label: 'Floating EMI', key: 'floatingEmi', format: 'currency' },
            { label: 'Fixed total interest', key: 'fixedTotalInterest', format: 'currency' },
            { label: 'Floating total interest', key: 'floatingTotalInterest', format: 'currency' },
          ],
        },
        chart: {
          title: 'Total interest comparison',
          keys: ['fixedTotalInterest', 'floatingTotalInterest'],
          labels: { fixedTotalInterest: 'Fixed', floatingTotalInterest: 'Floating' },
        },
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'How is the floating rate blended?',
          a: 'We average the initial floating rate for the hike period and the post-hike rate for the remainder.',
        },
        {
          q: 'Should I choose fixed or floating?',
          a: 'Fixed gives payment certainty; floating may save money if rates fall or stay stable.',
        },
      ]),
      fields: [
        {
          key: 'loanAmount',
          label: 'Loan amount',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '5000000',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 1,
          defaultValue: '240',
        },
        {
          key: 'fixedRate',
          label: 'Fixed rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 2,
          defaultValue: '9',
        },
        {
          key: 'floatingRate',
          label: 'Initial floating rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 3,
          defaultValue: '8.5',
        },
        {
          key: 'floatingRateAfter',
          label: 'Floating rate after hike (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 4,
          defaultValue: '9.5',
        },
        {
          key: 'hikeAfterMonths',
          label: 'Rate hike after (months)',
          fieldType: 'number',
          sortOrder: 5,
          defaultValue: '36',
        },
      ],
    },
    {
      slug: 'loan-eligibility',
      name: 'Loan Eligibility Calculator',
      description:
        'Estimate maximum loan amount from income, expenses, credit score, and existing EMIs.',
      categoryId: finance,
      seoTitle: 'Loan Eligibility Calculator | Varnarc',
      seoDescription: 'Check how much loan you may qualify for before applying.',
      skipEnrich: true,
      formula: {
        outputs: {
          emiRatio:
            'if(creditScore >= 750, 0.55, if(creditScore >= 650, 0.5, if(creditScore >= 550, 0.45, 0.4)))',
          disposableIncome: 'monthlyIncome - monthlyExpenses',
          maxEmi: 'disposableIncome * emiRatio - existingEmi',
          monthlyRate: 'annualRate / 12 / 100',
          eligibleAmount:
            'max(maxEmi, 0) * ((pow(1 + monthlyRate, tenureMonths) - 1) / (monthlyRate * pow(1 + monthlyRate, tenureMonths)))',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'maxEmi', label: 'Max affordable EMI', format: 'currency' },
          { key: 'eligibleAmount', label: 'Eligible loan amount', format: 'currency' },
          { key: 'emiRatio', label: 'EMI ratio applied', format: 'percentage' },
        ],
        recommendations: true,
      },
      settings: singlePageSettings([
        {
          q: 'How does credit score affect eligibility?',
          a: 'Higher scores may qualify for a higher EMI-to-income ratio and better rates.',
        },
        {
          q: 'Is this a bank approval guarantee?',
          a: 'No. This is an estimate; lenders also check employment, age, and property details.',
        },
      ]),
      fields: [
        {
          key: 'monthlyIncome',
          label: 'Monthly net income',
          fieldType: 'currency',
          sortOrder: 0,
          defaultValue: '80000',
        },
        {
          key: 'monthlyExpenses',
          label: 'Monthly expenses',
          fieldType: 'currency',
          sortOrder: 1,
          defaultValue: '25000',
        },
        {
          key: 'existingEmi',
          label: 'Existing EMIs',
          fieldType: 'currency',
          sortOrder: 2,
          defaultValue: '0',
        },
        {
          key: 'creditScore',
          label: 'Credit score',
          fieldType: 'number',
          sortOrder: 3,
          defaultValue: '720',
        },
        {
          key: 'annualRate',
          label: 'Interest rate (% p.a.)',
          fieldType: 'percentage',
          sortOrder: 4,
          defaultValue: '9',
        },
        {
          key: 'tenureMonths',
          label: 'Tenure (months)',
          fieldType: 'number',
          sortOrder: 5,
          defaultValue: '240',
        },
      ],
    },
  ];

  for (const calc of calculators) {
    await upsertCalculator(prisma, calc);
  }
}
