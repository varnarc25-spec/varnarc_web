import { PrismaClient } from '@prisma/client';

type FieldSeed = {
  key: string;
  label: string;
  fieldType: string;
  sortOrder: number;
  required?: boolean;
  defaultValue?: string;
  validation?: object;
  options?: unknown;
};

type ResultCard = { key: string; label: string; format?: string };

type CalculatorInput = {
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  formula: object;
  resultTemplate: {
    cards?: ResultCard[];
    table?: object;
    chart?: object;
    breakdown?: object;
    recommendations?: boolean;
  };
  settings?: object;
  seoTitle?: string;
  seoDescription?: string;
  fields: FieldSeed[];
  /** Skip auto-enrichment (EMI/SIP already fully configured) */
  skipEnrich?: boolean;
};

export function enrichResultTemplate(
  resultTemplate: CalculatorInput['resultTemplate'],
  settings?: { chartKeys?: string[] },
): CalculatorInput['resultTemplate'] {
  const rt = { ...resultTemplate };
  const cards = rt.cards ?? [];

  if (!rt.table && cards.length > 0) {
    rt.table = {
      title: 'Summary',
      rows: cards.map((c) => ({ label: c.label, key: c.key, format: c.format })),
    };
  }

  if (!rt.chart && cards.length >= 2) {
    const chartKeys = settings?.chartKeys ?? cards.slice(0, 2).map((c) => c.key);
    if (chartKeys.length >= 2) {
      const labels = Object.fromEntries(
        cards.filter((c) => chartKeys.includes(c.key)).map((c) => [c.key, c.label]),
      );
      rt.chart = { title: 'Visual breakdown', keys: chartKeys, labels };
    }
  }

  if (!rt.breakdown && cards.length > 0) {
    rt.breakdown = {
      title: 'Details',
      items: cards.map((c) => ({ label: c.label, key: c.key, format: c.format })),
    };
  }

  if (rt.recommendations === undefined) {
    rt.recommendations = true;
  }

  return rt;
}

function enrichSettings(
  settings: object | undefined,
  name: string,
  fields: FieldSeed[],
): object {
  const s = { ...(settings ?? {}) } as Record<string, unknown>;
  if (!s.faq) {
    s.faq = [
      {
        q: `How does the ${name} work?`,
        a: 'Enter your values and calculate. Results use standard formulas with the inputs you provide.',
      },
      {
        q: 'Are these results guaranteed?',
        a: 'No. This tool provides estimates for planning purposes only. Consult a professional for final decisions.',
      },
    ];
  }
  if (!s.mode && fields.length >= 4) {
    s.mode = 'wizard';
    const steps: Array<{ title: string; fields: string[] }> = [];
    const keys = fields.map((f) => f.key);
    for (let i = 0; i < keys.length; i += 2) {
      steps.push({
        title: i === 0 ? 'Basic details' : 'Additional details',
        fields: keys.slice(i, i + 2),
      });
    }
    s.steps = steps;
  }
  return s;
}

async function upsertCalculator(prisma: PrismaClient, input: CalculatorInput) {
  const chartKeys = (input.settings as { chartKeys?: string[] } | undefined)?.chartKeys;
  const resultTemplate = input.skipEnrich
    ? input.resultTemplate
    : enrichResultTemplate(input.resultTemplate, { chartKeys });
  const settings = input.skipEnrich
    ? input.settings
    : enrichSettings(input.settings, input.name, input.fields);
  const formula = JSON.stringify(input.formula);

  const row = await prisma.calculator.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      formula,
      resultTemplate,
      settings: settings ?? undefined,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      deletedAt: null,
    },
    create: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      formula,
      resultTemplate,
      settings: settings ?? undefined,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.calculatorField.deleteMany({ where: { calculatorId: row.id } });
  for (const f of input.fields) {
    await prisma.calculatorField.create({
      data: {
        calculatorId: row.id,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType,
        sortOrder: f.sortOrder,
        required: f.required ?? true,
        defaultValue: f.defaultValue ?? null,
        validation: (f.validation as never) ?? undefined,
        options: (f.options as never) ?? undefined,
      },
    });
  }
  return row;
}

type CategoryIds = {
  finance: string;
  construction: string;
  automobile: string;
  general: string;
};

/** 25+ additional calculators to reach 50+ plan target */
export async function seedExtendedCalculators(prisma: PrismaClient, cats: CategoryIds) {
  const { finance, construction, automobile, general } = cats;

  const calculators: CalculatorInput[] = [
    {
      slug: 'bmi',
      name: 'BMI Calculator',
      description: 'Calculate Body Mass Index and health category from height and weight.',
      categoryId: general,
      seoTitle: 'BMI Calculator | Varnarc',
      seoDescription: 'Calculate your Body Mass Index instantly.',
      formula: {
        outputs: {
          bmi: 'weight / pow(height / 100, 2)',
          idealWeightMin: '18.5 * pow(height / 100, 2)',
          idealWeightMax: '24.9 * pow(height / 100, 2)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'bmi', label: 'BMI', format: 'number' },
          { key: 'idealWeightMin', label: 'Ideal weight min (kg)', format: 'number' },
          { key: 'idealWeightMax', label: 'Ideal weight max (kg)', format: 'number' },
        ],
      },
      settings: {
        chartKeys: ['idealWeightMin', 'idealWeightMax'],
        faq: [
          { q: 'What is a healthy BMI?', a: 'For adults, 18.5–24.9 is generally considered normal weight.' },
          { q: 'Does BMI work for athletes?', a: 'BMI may overestimate body fat in muscular individuals.' },
        ],
      },
      fields: [
        { key: 'weight', label: 'Weight (kg)', fieldType: 'number', sortOrder: 0, defaultValue: '70' },
        {
          key: 'height',
          label: 'Height (cm)',
          fieldType: 'slider',
          sortOrder: 1,
          defaultValue: '170',
          validation: { min: 100, max: 220, step: 1 },
        },
      ],
    },
    {
      slug: 'percentage',
      name: 'Percentage Calculator',
      description: 'Find percentage of a number, increase/decrease, and difference.',
      categoryId: general,
      formula: {
        outputs: {
          result: 'value * percent / 100',
          increased: 'value * (1 + percent / 100)',
          decreased: 'value * (1 - percent / 100)',
          difference: 'increased - value',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'result', label: 'Percentage value', format: 'number' },
          { key: 'increased', label: 'After increase', format: 'number' },
          { key: 'decreased', label: 'After decrease', format: 'number' },
        ],
      },
      settings: { chartKeys: ['increased', 'decreased'] },
      fields: [
        { key: 'value', label: 'Base value', fieldType: 'number', sortOrder: 0, defaultValue: '1000' },
        { key: 'percent', label: 'Percentage (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '15' },
      ],
    },
    {
      slug: 'salary',
      name: 'Salary Calculator',
      description: 'Estimate monthly take-home pay from CTC with basic deductions.',
      categoryId: finance,
      seoTitle: 'Salary Calculator | Take Home Pay',
      formula: {
        outputs: {
          monthlyCtc: 'annualCtc / 12',
          basic: 'monthlyCtc * basicPercent / 100',
          hra: 'basic * hraPercent / 100',
          pfEmployee: 'basic * pfPercent / 100 * 2',
          professionalTax: '200',
          taxableBeforeTds: 'monthlyCtc - pfEmployee - professionalTax',
          tds: 'max(taxableBeforeTds * tdsPercent / 100, 0)',
          takeHome: 'monthlyCtc - pfEmployee - professionalTax - tds',
          annualTakeHome: 'takeHome * 12',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'takeHome', label: 'Monthly take-home', format: 'currency' },
          { key: 'annualTakeHome', label: 'Annual take-home', format: 'currency' },
          { key: 'tds', label: 'Monthly TDS', format: 'currency' },
        ],
      },
      settings: {
        mode: 'wizard',
        steps: [
          { title: 'CTC & structure', fields: ['annualCtc', 'basicPercent'] },
          { title: 'Benefits & tax', fields: ['hraPercent', 'pfPercent', 'tdsPercent'] },
        ],
        chartKeys: ['takeHome', 'tds'],
      },
      fields: [
        { key: 'annualCtc', label: 'Annual CTC', fieldType: 'currency', sortOrder: 0, defaultValue: '1200000' },
        { key: 'basicPercent', label: 'Basic (% of CTC)', fieldType: 'percentage', sortOrder: 1, defaultValue: '40' },
        { key: 'hraPercent', label: 'HRA (% of basic)', fieldType: 'percentage', sortOrder: 2, defaultValue: '50' },
        { key: 'pfPercent', label: 'PF (% of basic)', fieldType: 'percentage', sortOrder: 3, defaultValue: '12' },
        { key: 'tdsPercent', label: 'Effective TDS (%)', fieldType: 'percentage', sortOrder: 4, defaultValue: '5' },
      ],
    },
    {
      slug: 'age',
      name: 'Age Calculator',
      description: 'Calculate exact age in years, months, and days from date of birth.',
      categoryId: general,
      formula: {
        outputs: {
          ageYears: 'currentYear - birthYear',
          ageMonths: 'ageYears * 12 + (currentMonth - birthMonth)',
          totalDays: 'ageYears * 365 + ageMonths * 30',
          nextBirthdayDays: '365 - (currentMonth - birthMonth) * 30',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'ageYears', label: 'Age (years)', format: 'number' },
          { key: 'ageMonths', label: 'Age (months)', format: 'number' },
          { key: 'totalDays', label: 'Approx. total days', format: 'number' },
        ],
      },
      fields: [
        { key: 'birthYear', label: 'Birth year', fieldType: 'number', sortOrder: 0, defaultValue: '1990' },
        { key: 'birthMonth', label: 'Birth month (1-12)', fieldType: 'number', sortOrder: 1, defaultValue: '6' },
        { key: 'currentYear', label: 'Current year', fieldType: 'number', sortOrder: 2, defaultValue: '2026' },
        { key: 'currentMonth', label: 'Current month (1-12)', fieldType: 'number', sortOrder: 3, defaultValue: '7' },
      ],
    },
    {
      slug: 'unit-converter',
      name: 'Unit Converter',
      description: 'Convert length between meters, feet, inches, and centimeters.',
      categoryId: general,
      formula: {
        outputs: {
          meters: 'value * conversionFactor',
          feet: 'meters * 3.28084',
          inches: 'feet * 12',
          centimeters: 'meters * 100',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'meters', label: 'Meters', format: 'number' },
          { key: 'feet', label: 'Feet', format: 'number' },
          { key: 'inches', label: 'Inches', format: 'number' },
          { key: 'centimeters', label: 'Centimeters', format: 'number' },
        ],
      },
      settings: {
        chartKeys: ['meters', 'feet'],
        faq: [{ q: 'Which unit should I use?', a: 'Meters and feet are common for room dimensions; centimeters for precision.' }],
      },
      fields: [
        { key: 'value', label: 'Value to convert', fieldType: 'number', sortOrder: 0, defaultValue: '10' },
        {
          key: 'conversionFactor',
          label: 'From unit',
          fieldType: 'dropdown',
          sortOrder: 1,
          defaultValue: '1',
          options: [
            { value: '1', label: 'Meters' },
            { value: '0.3048', label: 'Feet' },
            { value: '0.01', label: 'Centimeters' },
            { value: '0.0254', label: 'Inches' },
          ],
        },
      ],
    },
    {
      slug: 'fd',
      name: 'Fixed Deposit Calculator',
      description: 'Estimate FD maturity with quarterly compounding.',
      categoryId: finance,
      formula: {
        outputs: {
          quarters: 'years * 4',
          quarterlyRate: 'annualRate / 4 / 100',
          maturity: 'principal * pow(1 + quarterlyRate, quarters)',
          interestEarned: 'maturity - principal',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'maturity', label: 'Maturity amount', format: 'currency' },
          { key: 'interestEarned', label: 'Interest earned', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['maturity', 'interestEarned'] },
      fields: [
        { key: 'principal', label: 'Deposit amount', fieldType: 'currency', sortOrder: 0, defaultValue: '500000' },
        { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '7' },
        {
          key: 'years',
          label: 'Tenure (years)',
          fieldType: 'slider',
          sortOrder: 2,
          defaultValue: '5',
          validation: { min: 1, max: 10, step: 1 },
        },
      ],
    },
    {
      slug: 'rd',
      name: 'Recurring Deposit Calculator',
      description: 'Project RD maturity with monthly deposits and compounding.',
      categoryId: finance,
      formula: {
        outputs: {
          months: 'years * 12',
          monthlyRate: 'annualRate / 12 / 100',
          invested: 'monthlyDeposit * months',
          maturity: 'monthlyDeposit * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
          interestEarned: 'maturity - invested',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'maturity', label: 'Maturity amount', format: 'currency' },
          { key: 'invested', label: 'Total deposited', format: 'currency' },
          { key: 'interestEarned', label: 'Interest earned', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['invested', 'interestEarned'] },
      fields: [
        { key: 'monthlyDeposit', label: 'Monthly deposit', fieldType: 'currency', sortOrder: 0, defaultValue: '5000' },
        { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '6.5' },
        { key: 'years', label: 'Tenure (years)', fieldType: 'number', sortOrder: 2, defaultValue: '3' },
      ],
    },
    {
      slug: 'home-affordability',
      name: 'Home Affordability Calculator',
      description: 'Estimate maximum home price based on income and existing obligations.',
      categoryId: finance,
      formula: {
        outputs: {
          maxEmi: 'monthlyIncome * 0.4 - existingEmi',
          monthlyRate: 'annualRate / 12 / 100',
          maxLoan: 'maxEmi * ((pow(1 + monthlyRate, tenureMonths) - 1) / (monthlyRate * pow(1 + monthlyRate, tenureMonths)))',
          maxHomePrice: 'maxLoan + downPayment',
          ltvPercent: 'maxLoan / max(maxHomePrice, 1) * 100',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'maxHomePrice', label: 'Max affordable price', format: 'currency' },
          { key: 'maxLoan', label: 'Max loan amount', format: 'currency' },
          { key: 'maxEmi', label: 'Max EMI', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['maxLoan', 'maxHomePrice'] },
      fields: [
        { key: 'monthlyIncome', label: 'Monthly net income', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
        { key: 'existingEmi', label: 'Existing EMIs', fieldType: 'currency', sortOrder: 1, defaultValue: '15000' },
        { key: 'downPayment', label: 'Available down payment', fieldType: 'currency', sortOrder: 2, defaultValue: '1000000' },
        { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 3, defaultValue: '8.5' },
        { key: 'tenureMonths', label: 'Loan tenure (months)', fieldType: 'number', sortOrder: 4, defaultValue: '240' },
      ],
    },
    {
      slug: 'credit-card-payoff',
      name: 'Credit Card Payoff Calculator',
      description: 'Estimate months to clear credit card debt and total interest.',
      categoryId: finance,
      formula: {
        outputs: {
          monthlyRate: 'annualRate / 12 / 100',
          monthsToPayoff: 'balance / max(monthlyPayment - balance * monthlyRate, 1)',
          totalPaid: 'monthlyPayment * monthsToPayoff',
          totalInterest: 'totalPaid - balance',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'monthsToPayoff', label: 'Months to payoff', format: 'number' },
          { key: 'totalInterest', label: 'Total interest', format: 'currency' },
          { key: 'totalPaid', label: 'Total paid', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['balance', 'totalInterest'] },
      fields: [
        { key: 'balance', label: 'Outstanding balance', fieldType: 'currency', sortOrder: 0, defaultValue: '50000' },
        { key: 'annualRate', label: 'APR (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '42' },
        { key: 'monthlyPayment', label: 'Monthly payment', fieldType: 'currency', sortOrder: 2, defaultValue: '5000' },
      ],
    },
    {
      slug: 'inflation',
      name: 'Inflation Calculator',
      description: 'See how purchasing power changes with inflation over time.',
      categoryId: finance,
      formula: {
        outputs: {
          futureValue: 'amount * pow(1 + inflationRate / 100, years)',
          purchasingPowerToday: 'amount / pow(1 + inflationRate / 100, years)',
          valueLost: 'amount - purchasingPowerToday',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'futureValue', label: 'Future cost of today\'s amount', format: 'currency' },
          { key: 'purchasingPowerToday', label: 'Today\'s value of future amount', format: 'currency' },
          { key: 'valueLost', label: 'Purchasing power lost', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['amount', 'valueLost'] },
      fields: [
        { key: 'amount', label: 'Amount today', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
        { key: 'inflationRate', label: 'Inflation rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '6' },
        { key: 'years', label: 'Years', fieldType: 'number', sortOrder: 2, defaultValue: '10' },
      ],
    },
    {
      slug: 'gold-returns',
      name: 'Gold Investment Calculator',
      description: 'Project gold investment returns based on weight and price appreciation.',
      categoryId: finance,
      formula: {
        outputs: {
          purchaseValue: 'grams * buyPricePerGram',
          futureValue: 'grams * buyPricePerGram * pow(1 + annualAppreciation / 100, years)',
          gains: 'futureValue - purchaseValue',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'futureValue', label: 'Projected value', format: 'currency' },
          { key: 'purchaseValue', label: 'Purchase value', format: 'currency' },
          { key: 'gains', label: 'Estimated gains', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['purchaseValue', 'gains'] },
      fields: [
        { key: 'grams', label: 'Gold weight (grams)', fieldType: 'number', sortOrder: 0, defaultValue: '50' },
        { key: 'buyPricePerGram', label: 'Buy price / gram', fieldType: 'currency', sortOrder: 1, defaultValue: '6500' },
        { key: 'annualAppreciation', label: 'Expected appreciation (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '8' },
        { key: 'years', label: 'Holding period (years)', fieldType: 'number', sortOrder: 3, defaultValue: '5' },
      ],
    },
    {
      slug: 'sip-vs-lumpsum',
      name: 'SIP vs Lumpsum Calculator',
      description: 'Compare wealth from monthly SIP versus one-time lumpsum investment.',
      categoryId: finance,
      formula: {
        outputs: {
          months: 'years * 12',
          monthlyRate: 'expectedReturn / 12 / 100',
          sipInvested: 'monthlySip * months',
          sipMaturity: 'monthlySip * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
          lumpsumMaturity: 'lumpsum * pow(1 + expectedReturn / 100, years)',
          difference: 'sipMaturity - lumpsumMaturity',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'sipMaturity', label: 'SIP maturity', format: 'currency' },
          { key: 'lumpsumMaturity', label: 'Lumpsum maturity', format: 'currency' },
          { key: 'difference', label: 'Difference (SIP − Lumpsum)', format: 'currency' },
        ],
      },
      settings: {
        chartKeys: ['sipMaturity', 'lumpsumMaturity'],
        mode: 'wizard',
        steps: [
          { title: 'SIP details', fields: ['monthlySip', 'years'] },
          { title: 'Lumpsum & return', fields: ['lumpsum', 'expectedReturn'] },
        ],
      },
      fields: [
        { key: 'monthlySip', label: 'Monthly SIP', fieldType: 'currency', sortOrder: 0, defaultValue: '10000' },
        { key: 'lumpsum', label: 'Lumpsum amount', fieldType: 'currency', sortOrder: 1, defaultValue: '500000' },
        { key: 'expectedReturn', label: 'Expected return (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '12' },
        { key: 'years', label: 'Investment period (years)', fieldType: 'number', sortOrder: 3, defaultValue: '10' },
      ],
    },
    {
      slug: 'hra',
      name: 'HRA Calculator',
      description: 'Estimate House Rent Allowance exemption under Indian tax rules (simplified).',
      categoryId: finance,
      formula: {
        outputs: {
          hraReceived: 'monthlyHra * 12',
          rentPaidAnnual: 'annualRent',
          tenPercentBasic: 'annualBasic * 0.1',
          excessRent: 'max(rentPaidAnnual - tenPercentBasic, 0)',
          fortyPercentBasic: 'annualBasic * 0.4',
          exemption: 'min(hraReceived, excessRent, fortyPercentBasic)',
          taxableHra: 'hraReceived - exemption',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'exemption', label: 'HRA exemption', format: 'currency' },
          { key: 'taxableHra', label: 'Taxable HRA', format: 'currency' },
          { key: 'hraReceived', label: 'HRA received (annual)', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['exemption', 'taxableHra'] },
      fields: [
        { key: 'monthlyHra', label: 'Monthly HRA received', fieldType: 'currency', sortOrder: 0, defaultValue: '20000' },
        { key: 'annualBasic', label: 'Annual basic salary', fieldType: 'currency', sortOrder: 1, defaultValue: '480000' },
        { key: 'annualRent', label: 'Annual rent paid', fieldType: 'currency', sortOrder: 2, defaultValue: '240000' },
      ],
    },
    {
      slug: 'roi',
      name: 'ROI Calculator',
      description: 'Calculate return on investment as amount and percentage.',
      categoryId: finance,
      formula: {
        outputs: {
          netProfit: 'revenue - cost',
          roiPercent: 'netProfit / max(cost, 1) * 100',
          revenueMultiple: 'revenue / max(cost, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'roiPercent', label: 'ROI (%)', format: 'percent' },
          { key: 'netProfit', label: 'Net profit', format: 'currency' },
          { key: 'revenueMultiple', label: 'Revenue multiple', format: 'number' },
        ],
      },
      fields: [
        { key: 'cost', label: 'Investment / cost', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
        { key: 'revenue', label: 'Returns / revenue', fieldType: 'currency', sortOrder: 1, defaultValue: '150000' },
      ],
    },
    {
      slug: 'break-even',
      name: 'Break-Even Calculator',
      description: 'Find units and revenue needed to cover fixed and variable costs.',
      categoryId: general,
      formula: {
        outputs: {
          contributionMargin: 'sellingPrice - variableCostPerUnit',
          breakEvenUnits: 'fixedCosts / max(contributionMargin, 1)',
          breakEvenRevenue: 'breakEvenUnits * sellingPrice',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'breakEvenUnits', label: 'Break-even units', format: 'number' },
          { key: 'breakEvenRevenue', label: 'Break-even revenue', format: 'currency' },
          { key: 'contributionMargin', label: 'Contribution margin / unit', format: 'currency' },
        ],
      },
      fields: [
        { key: 'fixedCosts', label: 'Fixed costs', fieldType: 'currency', sortOrder: 0, defaultValue: '500000' },
        { key: 'sellingPrice', label: 'Selling price / unit', fieldType: 'currency', sortOrder: 1, defaultValue: '500' },
        { key: 'variableCostPerUnit', label: 'Variable cost / unit', fieldType: 'currency', sortOrder: 2, defaultValue: '300' },
      ],
    },
    {
      slug: 'electricity-bill',
      name: 'Electricity Bill Calculator',
      description: 'Estimate monthly electricity bill from consumption and slab rates.',
      categoryId: general,
      formula: {
        outputs: {
          slab1Units: 'min(units, 100)',
          slab1Cost: 'slab1Units * rate1',
          slab2Units: 'max(min(units - 100, 100), 0)',
          slab2Cost: 'slab2Units * rate2',
          slab3Units: 'max(units - 200, 0)',
          slab3Cost: 'slab3Units * rate3',
          energyCharge: 'slab1Cost + slab2Cost + slab3Cost',
          fixedCharge: 'fixedMonthly',
          totalBill: 'energyCharge + fixedCharge',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'totalBill', label: 'Estimated bill', format: 'currency' },
          { key: 'energyCharge', label: 'Energy charges', format: 'currency' },
          { key: 'fixedCharge', label: 'Fixed charges', format: 'currency' },
        ],
      },
      settings: {
        mode: 'wizard',
        steps: [
          { title: 'Consumption', fields: ['units'] },
          { title: 'Tariff slabs', fields: ['rate1', 'rate2', 'rate3', 'fixedMonthly'] },
        ],
        chartKeys: ['energyCharge', 'fixedCharge'],
      },
      fields: [
        { key: 'units', label: 'Units consumed', fieldType: 'number', sortOrder: 0, defaultValue: '250' },
        { key: 'rate1', label: 'Rate 0–100 units (₹/unit)', fieldType: 'number', sortOrder: 1, defaultValue: '4' },
        { key: 'rate2', label: 'Rate 101–200 units (₹/unit)', fieldType: 'number', sortOrder: 2, defaultValue: '6' },
        { key: 'rate3', label: 'Rate 201+ units (₹/unit)', fieldType: 'number', sortOrder: 3, defaultValue: '8' },
        { key: 'fixedMonthly', label: 'Fixed monthly charge', fieldType: 'currency', sortOrder: 4, defaultValue: '50' },
      ],
    },
    {
      slug: 'water-tank',
      name: 'Water Tank Capacity Calculator',
      description: 'Calculate water tank volume and capacity in litres.',
      categoryId: construction,
      formula: {
        outputs: {
          volumeCuFt: 'length * width * height',
          volumeLitres: 'volumeCuFt * 28.3168',
          fillCost: 'volumeLitres * costPerLitre',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'volumeLitres', label: 'Capacity (litres)', format: 'number' },
          { key: 'volumeCuFt', label: 'Volume (cu ft)', format: 'number' },
          { key: 'fillCost', label: 'Fill cost estimate', format: 'currency' },
        ],
      },
      fields: [
        { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '4' },
        { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '4' },
        { key: 'height', label: 'Height (ft)', fieldType: 'number', sortOrder: 2, defaultValue: '5' },
        { key: 'costPerLitre', label: 'Water cost / litre', fieldType: 'number', sortOrder: 3, defaultValue: '0.05' },
      ],
    },
    {
      slug: 'room-area',
      name: 'Room Area Calculator',
      description: 'Calculate floor area, wall area, and painting estimate for a room.',
      categoryId: construction,
      formula: {
        outputs: {
          floorArea: 'length * width',
          wallArea: '2 * (length + width) * height',
          paintLitres: 'wallArea / coveragePerLitre * coats',
          paintCost: 'paintLitres * paintPricePerLitre',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'floorArea', label: 'Floor area (sq ft)', format: 'number' },
          { key: 'wallArea', label: 'Wall area (sq ft)', format: 'number' },
          { key: 'paintCost', label: 'Paint cost estimate', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['floorArea', 'wallArea'] },
      fields: [
        { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '14' },
        { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '12' },
        { key: 'height', label: 'Ceiling height (ft)', fieldType: 'number', sortOrder: 2, defaultValue: '10' },
        { key: 'coats', label: 'Paint coats', fieldType: 'number', sortOrder: 3, defaultValue: '2' },
        { key: 'coveragePerLitre', label: 'Coverage per litre (sq ft)', fieldType: 'number', sortOrder: 4, defaultValue: '100' },
        { key: 'paintPricePerLitre', label: 'Paint price / litre', fieldType: 'currency', sortOrder: 5, defaultValue: '250' },
      ],
    },
    {
      slug: 'staircase',
      name: 'Staircase Calculator',
      description: 'Design staircase rise, run, and number of steps.',
      categoryId: construction,
      formula: {
        outputs: {
          numberOfRisers: 'floorHeight / riserHeight',
          numberOfTreads: 'numberOfRisers - 1',
          totalRun: 'numberOfTreads * treadDepth',
          stairAngle: 'floorHeight / max(totalRun, 1) * 57.3',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'numberOfRisers', label: 'Number of risers', format: 'number' },
          { key: 'numberOfTreads', label: 'Number of treads', format: 'number' },
          { key: 'totalRun', label: 'Total run (in)', format: 'number' },
        ],
      },
      fields: [
        { key: 'floorHeight', label: 'Floor-to-floor height (in)', fieldType: 'number', sortOrder: 0, defaultValue: '108' },
        { key: 'riserHeight', label: 'Riser height (in)', fieldType: 'number', sortOrder: 1, defaultValue: '7' },
        { key: 'treadDepth', label: 'Tread depth (in)', fieldType: 'number', sortOrder: 2, defaultValue: '10' },
      ],
    },
    {
      slug: 'carpet-builtup',
      name: 'Carpet to Built-up Area Converter',
      description: 'Convert between carpet, built-up, and super built-up areas.',
      categoryId: construction,
      formula: {
        outputs: {
          builtUpArea: 'carpetArea / loadingFactor * 100',
          superBuiltUp: 'builtUpArea * (1 + superLoading / 100)',
          commonArea: 'builtUpArea - carpetArea',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'builtUpArea', label: 'Built-up area (sq ft)', format: 'number' },
          { key: 'superBuiltUp', label: 'Super built-up (sq ft)', format: 'number' },
          { key: 'commonArea', label: 'Common area share (sq ft)', format: 'number' },
        ],
      },
      fields: [
        { key: 'carpetArea', label: 'Carpet area (sq ft)', fieldType: 'number', sortOrder: 0, defaultValue: '1000' },
        { key: 'loadingFactor', label: 'Loading factor (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '25' },
        { key: 'superLoading', label: 'Super built-up loading (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '15' },
      ],
    },
    {
      slug: 'ev-charging',
      name: 'EV Charging Cost Calculator',
      description: 'Estimate cost and time to charge an electric vehicle.',
      categoryId: automobile,
      formula: {
        outputs: {
          energyNeeded: 'batteryCapacity * (targetCharge - currentCharge) / 100',
          chargingCost: 'energyNeeded * electricityRate',
          chargingHours: 'energyNeeded / chargerPower',
          costPerKm: 'chargingCost / max(rangeKm, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'chargingCost', label: 'Charging cost', format: 'currency' },
          { key: 'chargingHours', label: 'Charging time (hours)', format: 'number' },
          { key: 'costPerKm', label: 'Cost per km', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['chargingCost', 'energyNeeded'] },
      fields: [
        { key: 'batteryCapacity', label: 'Battery capacity (kWh)', fieldType: 'number', sortOrder: 0, defaultValue: '40' },
        { key: 'currentCharge', label: 'Current charge (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '20' },
        { key: 'targetCharge', label: 'Target charge (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '80' },
        { key: 'electricityRate', label: 'Electricity rate (₹/kWh)', fieldType: 'number', sortOrder: 3, defaultValue: '8' },
        { key: 'chargerPower', label: 'Charger power (kW)', fieldType: 'number', sortOrder: 4, defaultValue: '7.4' },
        { key: 'rangeKm', label: 'Expected range (km)', fieldType: 'number', sortOrder: 5, defaultValue: '300' },
      ],
    },
    {
      slug: 'loan-prepayment',
      name: 'Loan Prepayment Calculator',
      description: 'See interest saved and tenure reduced with a lump-sum prepayment.',
      categoryId: finance,
      formula: {
        outputs: {
          monthlyRate: 'annualRate / 12 / 100',
          emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          newPrincipal: 'principal - prepayment',
          newEmi: 'newPrincipal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
          interestSaved: '(emi - newEmi) * tenureMonths + prepayment * monthlyRate * tenureMonths / 2',
          tenureSavedMonths: 'prepayment / emi * 12',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'interestSaved', label: 'Estimated interest saved', format: 'currency' },
          { key: 'newEmi', label: 'EMI after prepayment', format: 'currency' },
          { key: 'tenureSavedMonths', label: 'Tenure saved (months)', format: 'number' },
        ],
      },
      settings: {
        mode: 'wizard',
        steps: [
          { title: 'Loan details', fields: ['principal', 'annualRate', 'tenureMonths'] },
          { title: 'Prepayment', fields: ['prepayment'] },
        ],
        chartKeys: ['emi', 'newEmi'],
      },
      fields: [
        { key: 'principal', label: 'Outstanding principal', fieldType: 'currency', sortOrder: 0, defaultValue: '2000000' },
        { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '8.5' },
        { key: 'tenureMonths', label: 'Remaining tenure (months)', fieldType: 'number', sortOrder: 2, defaultValue: '180' },
        { key: 'prepayment', label: 'Prepayment amount', fieldType: 'currency', sortOrder: 3, defaultValue: '200000' },
      ],
    },
    {
      slug: 'simple-interest',
      name: 'Simple Interest Calculator',
      description: 'Calculate simple interest and total amount on a principal.',
      categoryId: finance,
      formula: {
        outputs: {
          interest: 'principal * rate * years / 100',
          totalAmount: 'principal + interest',
          monthlyInterest: 'interest / max(years * 12, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'totalAmount', label: 'Total amount', format: 'currency' },
          { key: 'interest', label: 'Simple interest', format: 'currency' },
          { key: 'monthlyInterest', label: 'Avg. monthly interest', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['principal', 'interest'] },
      fields: [
        { key: 'principal', label: 'Principal', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
        { key: 'rate', label: 'Rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '10' },
        { key: 'years', label: 'Time (years)', fieldType: 'number', sortOrder: 2, defaultValue: '3' },
      ],
    },
    {
      slug: 'mutual-fund-lumpsum',
      name: 'Mutual Fund Lumpsum Calculator',
      description: 'Project mutual fund returns on a one-time investment.',
      categoryId: finance,
      formula: {
        outputs: {
          maturity: 'principal * pow(1 + expectedReturn / 100, years)',
          gains: 'maturity - principal',
          cagr: 'expectedReturn',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'maturity', label: 'Maturity value', format: 'currency' },
          { key: 'gains', label: 'Estimated gains', format: 'currency' },
          { key: 'cagr', label: 'Assumed CAGR (%)', format: 'percent' },
        ],
      },
      settings: { chartKeys: ['maturity', 'gains'] },
      fields: [
        { key: 'principal', label: 'Investment amount', fieldType: 'currency', sortOrder: 0, defaultValue: '500000' },
        { key: 'expectedReturn', label: 'Expected return (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '12' },
        {
          key: 'years',
          label: 'Investment period (years)',
          fieldType: 'slider',
          sortOrder: 2,
          defaultValue: '10',
          validation: { min: 1, max: 30, step: 1 },
        },
      ],
    },
    {
      slug: 'leave-encashment',
      name: 'Leave Encashment Calculator',
      description: 'Estimate leave encashment payout based on salary and unused leave.',
      categoryId: finance,
      formula: {
        outputs: {
          dailyRate: 'basicSalary / 30',
          encashment: 'dailyRate * unusedLeaveDays',
          taxEstimate: 'encashment * taxPercent / 100',
          netEncashment: 'encashment - taxEstimate',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'encashment', label: 'Gross encashment', format: 'currency' },
          { key: 'taxEstimate', label: 'Estimated tax', format: 'currency' },
          { key: 'netEncashment', label: 'Net encashment', format: 'currency' },
        ],
      },
      settings: { chartKeys: ['encashment', 'taxEstimate'] },
      fields: [
        { key: 'basicSalary', label: 'Monthly basic salary', fieldType: 'currency', sortOrder: 0, defaultValue: '50000' },
        { key: 'unusedLeaveDays', label: 'Unused leave days', fieldType: 'number', sortOrder: 1, defaultValue: '15' },
        { key: 'taxPercent', label: 'Tax rate (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '20' },
      ],
    },
    {
      slug: 'tds',
      name: 'TDS Calculator',
      description: 'Calculate Tax Deducted at Source on payments.',
      categoryId: finance,
      formula: {
        outputs: {
          tdsAmount: 'paymentAmount * tdsRate / 100',
          netPayment: 'paymentAmount - tdsAmount',
          annualTds: 'tdsAmount * paymentsPerYear',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'tdsAmount', label: 'TDS amount', format: 'currency' },
          { key: 'netPayment', label: 'Net payment', format: 'currency' },
          { key: 'annualTds', label: 'Annual TDS (if recurring)', format: 'currency' },
        ],
      },
      fields: [
        { key: 'paymentAmount', label: 'Payment amount', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
        {
          key: 'tdsRate',
          label: 'TDS rate (%)',
          fieldType: 'dropdown',
          sortOrder: 1,
          defaultValue: '10',
          options: [
            { value: '1', label: '1% (Section 194C)' },
            { value: '2', label: '2% (Section 194C)' },
            { value: '10', label: '10% (Professional fees)' },
            { value: '20', label: '20% (No PAN)' },
          ],
        },
        { key: 'paymentsPerYear', label: 'Payments per year', fieldType: 'number', sortOrder: 2, defaultValue: '12' },
      ],
    },
    {
      slug: 'discount',
      name: 'Discount Calculator',
      description: 'Calculate sale price after discount and amount saved.',
      categoryId: general,
      formula: {
        outputs: {
          discountAmount: 'originalPrice * discountPercent / 100',
          salePrice: 'originalPrice - discountAmount',
          savingsPercent: 'discountPercent',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'salePrice', label: 'Sale price', format: 'currency' },
          { key: 'discountAmount', label: 'You save', format: 'currency' },
          { key: 'savingsPercent', label: 'Discount (%)', format: 'percent' },
        ],
      },
      settings: { chartKeys: ['salePrice', 'discountAmount'] },
      fields: [
        { key: 'originalPrice', label: 'Original price', fieldType: 'currency', sortOrder: 0, defaultValue: '5000' },
        {
          key: 'discountPercent',
          label: 'Discount (%)',
          fieldType: 'slider',
          sortOrder: 1,
          defaultValue: '20',
          validation: { min: 1, max: 90, step: 1 },
        },
      ],
    },
    {
      slug: 'tip',
      name: 'Tip Calculator',
      description: 'Split bill with tip among diners.',
      categoryId: general,
      formula: {
        outputs: {
          tipAmount: 'billAmount * tipPercent / 100',
          totalWithTip: 'billAmount + tipAmount',
          perPerson: 'totalWithTip / diners',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'totalWithTip', label: 'Total with tip', format: 'currency' },
          { key: 'tipAmount', label: 'Tip amount', format: 'currency' },
          { key: 'perPerson', label: 'Per person', format: 'currency' },
        ],
      },
      fields: [
        { key: 'billAmount', label: 'Bill amount', fieldType: 'currency', sortOrder: 0, defaultValue: '2000' },
        { key: 'tipPercent', label: 'Tip (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '10' },
        { key: 'diners', label: 'Number of diners', fieldType: 'number', sortOrder: 2, defaultValue: '4' },
      ],
    },
    {
      slug: 'lease-vs-buy',
      name: 'Lease vs Buy Calculator',
      description: 'Compare total cost of leasing versus buying a vehicle.',
      categoryId: automobile,
      formula: {
        outputs: {
          buyTotal: 'purchasePrice + maintenanceYears * annualMaintenance',
          leaseTotal: 'monthlyLease * leaseMonths + leaseDeposit',
          difference: 'leaseTotal - buyTotal',
          buyMonthlyEquiv: 'buyTotal / max(leaseMonths, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'buyTotal', label: 'Buy total cost', format: 'currency' },
          { key: 'leaseTotal', label: 'Lease total cost', format: 'currency' },
          { key: 'difference', label: 'Lease − Buy', format: 'currency' },
        ],
      },
      settings: {
        mode: 'wizard',
        steps: [
          { title: 'Buy option', fields: ['purchasePrice', 'annualMaintenance', 'maintenanceYears'] },
          { title: 'Lease option', fields: ['monthlyLease', 'leaseMonths', 'leaseDeposit'] },
        ],
        chartKeys: ['buyTotal', 'leaseTotal'],
      },
      fields: [
        { key: 'purchasePrice', label: 'Purchase price', fieldType: 'currency', sortOrder: 0, defaultValue: '1200000' },
        { key: 'annualMaintenance', label: 'Annual maintenance (buy)', fieldType: 'currency', sortOrder: 1, defaultValue: '25000' },
        { key: 'maintenanceYears', label: 'Ownership years', fieldType: 'number', sortOrder: 2, defaultValue: '5' },
        { key: 'monthlyLease', label: 'Monthly lease', fieldType: 'currency', sortOrder: 3, defaultValue: '25000' },
        { key: 'leaseMonths', label: 'Lease tenure (months)', fieldType: 'number', sortOrder: 4, defaultValue: '36' },
        { key: 'leaseDeposit', label: 'Lease deposit', fieldType: 'currency', sortOrder: 5, defaultValue: '100000' },
      ],
    },
    {
      slug: 'toll-cost',
      name: 'Toll Cost Estimator',
      description: 'Estimate highway toll cost for a trip.',
      categoryId: automobile,
      formula: {
        outputs: {
          totalTolls: 'tollPlazas * tollPerPlaza',
          tripTotal: 'totalTolls + fuelCost',
          costPerKm: 'tripTotal / max(distance, 1)',
        },
      },
      resultTemplate: {
        cards: [
          { key: 'totalTolls', label: 'Total tolls', format: 'currency' },
          { key: 'tripTotal', label: 'Tolls + fuel', format: 'currency' },
          { key: 'costPerKm', label: 'Cost per km', format: 'currency' },
        ],
      },
      fields: [
        { key: 'distance', label: 'Distance (km)', fieldType: 'number', sortOrder: 0, defaultValue: '400' },
        { key: 'tollPlazas', label: 'Toll plazas', fieldType: 'number', sortOrder: 1, defaultValue: '8' },
        { key: 'tollPerPlaza', label: 'Avg. toll / plaza', fieldType: 'currency', sortOrder: 2, defaultValue: '120' },
        { key: 'fuelCost', label: 'Fuel cost', fieldType: 'currency', sortOrder: 3, defaultValue: '2500' },
      ],
    },
  ];

  for (const calc of calculators) {
    await upsertCalculator(prisma, calc);
  }
}

/** Re-enrich existing calculators that only have basic cards */
export async function enrichExistingCalculators(prisma: PrismaClient) {
  const skipSlugs = new Set(['emi', 'sip']);
  const rows = await prisma.calculator.findMany({
    where: { deletedAt: null, slug: { notIn: [...skipSlugs] } },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });

  for (const row of rows) {
    const rt = (row.resultTemplate as CalculatorInput['resultTemplate']) ?? { cards: [] };
    if (rt.table && rt.chart && rt.breakdown && rt.recommendations) continue;

    const enriched = enrichResultTemplate(rt);
    const settings = enrichSettings(
      (row.settings as object) ?? {},
      row.name,
      row.fields.map((f) => ({
        key: f.key,
        label: f.label,
        fieldType: f.fieldType,
        sortOrder: f.sortOrder,
      })),
    );

    await prisma.calculator.update({
      where: { id: row.id },
      data: { resultTemplate: enriched, settings },
    });
  }
}
