import { type PrismaClient } from '@prisma/client';
import { enrichExistingCalculators, seedExtendedCalculators } from './seed-calculators';
import { seedEmiCalculators } from './seed-emi-calculators';

/** Catalog categories + published calculators (EMI, SIP, EMI variants, utilities). */
export async function seedCalculatorCatalog(prisma: PrismaClient) {
  const calcCategories = [
    {
      slug: 'finance',
      name: 'Finance',
      sortOrder: 1,
      description: 'Loans, investments, and tax tools',
    },
    {
      slug: 'construction',
      name: 'Construction',
      sortOrder: 2,
      description: 'Building material estimators',
    },
    {
      slug: 'automobile',
      name: 'Automobile',
      sortOrder: 3,
      description: 'Vehicle cost and loan tools',
    },
    { slug: 'general', name: 'General', sortOrder: 4, description: 'Everyday utility calculators' },
  ];

  for (const cat of calcCategories) {
    await prisma.calculatorCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        deletedAt: null,
      },
      create: cat,
    });
  }

  const finance = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'finance' } });
  const construction = await prisma.calculatorCategory.findUniqueOrThrow({
    where: { slug: 'construction' },
  });
  const automobile = await prisma.calculatorCategory.findUniqueOrThrow({
    where: { slug: 'automobile' },
  });
  const general = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'general' } });

  type FieldSeed = {
    key: string;
    label: string;
    fieldType: string;
    sortOrder: number;
    required?: boolean;
    defaultValue?: string;
    validation?: object;
  };

  async function upsertCalculator(input: {
    slug: string;
    name: string;
    description: string;
    categoryId: string;
    formula: object;
    resultTemplate: object;
    settings?: object;
    seoTitle?: string;
    seoDescription?: string;
    fields: FieldSeed[];
  }) {
    const formula = JSON.stringify(input.formula);
    const row = await prisma.calculator.upsert({
      where: { slug: input.slug },
      update: {
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        formula,
        resultTemplate: input.resultTemplate,
        settings: input.settings ?? undefined,
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
        resultTemplate: input.resultTemplate,
        settings: input.settings ?? undefined,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await prisma.calculatorField.deleteMany({
      where: { calculatorId: row.id },
    });
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
        },
      });
    }
    return row;
  }

  // Slugs match homepage / finance / construction / automobile links
  await upsertCalculator({
    slug: 'emi',
    name: 'EMI Calculator',
    description: 'Estimate monthly EMI, total payment, and interest for a loan.',
    categoryId: finance.id,
    seoTitle: 'EMI Calculator | Varnarc',
    seoDescription: 'Calculate loan EMI instantly.',
    formula: {
      outputs: {
        principal: 'principal',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalPayment', label: 'Total Payment', format: 'currency' },
        { key: 'totalInterest', label: 'Total Interest', format: 'currency' },
      ],
      table: {
        title: 'Payment summary',
        rows: [
          { label: 'Monthly EMI', key: 'emi', format: 'currency' },
          { label: 'Total payment', key: 'totalPayment', format: 'currency' },
          { label: 'Total interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      chart: {
        title: 'Principal vs interest',
        keys: ['principal', 'totalInterest'],
        labels: { principal: 'Principal', totalInterest: 'Interest' },
      },
      breakdown: {
        title: 'Breakdown',
        items: [
          { label: 'EMI', key: 'emi', format: 'currency' },
          { label: 'Interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      recommendations: true,
    },
    settings: {
      faq: [
        {
          q: 'What is EMI?',
          a: 'Equated Monthly Installment is the fixed payment you make each month.',
        },
        {
          q: 'Does this include fees?',
          a: 'This estimate excludes processing fees and insurance.',
        },
      ],
    },
    fields: [
      {
        key: 'principal',
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
        defaultValue: '8.5',
      },
      {
        key: 'tenureMonths',
        label: 'Tenure (months)',
        fieldType: 'slider',
        sortOrder: 2,
        defaultValue: '60',
        validation: { min: 6, max: 360, step: 6 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'loan',
    name: 'Loan Calculator',
    description: 'Calculate EMI, total interest, and repayment for any loan type.',
    categoryId: finance.id,
    seoTitle: 'Loan Calculator | Varnarc',
    seoDescription:
      'Estimate monthly EMI and total interest for home, personal, car, or education loans.',
    formula: {
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
            monthlyRate: 'annualRate / 12 / 100',
            emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
            totalPayment: 'emi * tenureMonths',
            totalInterest: 'totalPayment - principal',
          },
        },
        {
          when: 'loanTypeCode == 3',
          outputs: {
            principal: 'principal',
            monthlyRate: 'annualRate / 12 / 100',
            emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
            totalPayment: 'emi * tenureMonths',
            totalInterest: 'totalPayment - principal',
          },
        },
      ],
      outputs: {
        principal: 'principal',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalPayment', label: 'Total payment', format: 'currency' },
        { key: 'totalInterest', label: 'Total interest', format: 'currency' },
      ],
      table: {
        title: 'Repayment summary',
        rows: [
          { label: 'Monthly EMI', key: 'emi', format: 'currency' },
          { label: 'Total payment', key: 'totalPayment', format: 'currency' },
          { label: 'Total interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      chart: {
        title: 'Principal vs interest',
        type: 'donut',
        keys: ['principal', 'totalInterest'],
        labels: { principal: 'Principal', totalInterest: 'Interest' },
      },
    },
    settings: {
      layout: 'single',
      fieldVisibility: {
        propertyValue: { loanType: ['home'] },
        onRoadPrice: { loanType: ['car'] },
        downPayment: { loanType: ['home', 'car'] },
        principal: { loanType: ['personal', 'home', 'car', 'education'] },
        courseFee: { loanType: ['education'] },
        loanPercent: { loanType: ['education'] },
        moratoriumMonths: { loanType: ['education'] },
      },
      relatedArticles: {
        topicField: 'loanType',
        topicCategorySlugs: {
          home: 'home-loans',
          personal: 'personal-loans',
          car: 'car-loans',
          education: 'education-loans',
        },
      },
      faq: [
        {
          q: 'Which loans does this cover?',
          a: 'Use it for home, personal, car, or education loans — adjust rate and tenure to match your offer.',
        },
        {
          q: 'Are fees included?',
          a: 'Processing fees, insurance, and GST are excluded from this estimate.',
        },
      ],
    },
    fields: [
      {
        key: 'loanType',
        label: 'Loan type',
        fieldType: 'select',
        sortOrder: 0,
        defaultValue: 'home',
        validation: { options: ['home', 'personal', 'car', 'education'] },
      },
      {
        key: 'propertyValue',
        label: 'Property value',
        fieldType: 'currency',
        sortOrder: 1,
        defaultValue: '7500000',
        required: false,
      },
      {
        key: 'onRoadPrice',
        label: 'On-road price',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '1000000',
        required: false,
      },
      {
        key: 'downPayment',
        label: 'Down payment',
        fieldType: 'currency',
        sortOrder: 3,
        defaultValue: '1500000',
        required: false,
      },
      {
        key: 'courseFee',
        label: 'Course fee',
        fieldType: 'currency',
        sortOrder: 4,
        defaultValue: '2000000',
        required: false,
      },
      {
        key: 'loanPercent',
        label: 'Loan coverage (%)',
        fieldType: 'percentage',
        sortOrder: 5,
        defaultValue: '90',
        required: false,
      },
      {
        key: 'moratoriumMonths',
        label: 'Moratorium (months)',
        fieldType: 'number',
        sortOrder: 6,
        defaultValue: '24',
        required: false,
      },
      {
        key: 'principal',
        label: 'Loan amount',
        fieldType: 'currency',
        sortOrder: 7,
        defaultValue: '2500000',
        required: false,
      },
      {
        key: 'annualRate',
        label: 'Interest rate (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 8,
        defaultValue: '8.75',
      },
      {
        key: 'tenureMonths',
        label: 'Tenure (months)',
        fieldType: 'slider',
        sortOrder: 9,
        defaultValue: '240',
        validation: { min: 6, max: 360, step: 6 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'sip',
    name: 'SIP Calculator',
    description: 'Project mutual fund wealth from a monthly SIP.',
    categoryId: finance.id,
    seoTitle: 'SIP Calculator | Varnarc',
    seoDescription: 'Estimate SIP returns and maturity amount.',
    formula: {
      outputs: {
        monthlyRate: 'expectedReturn / 12 / 100',
        months: 'years * 12',
        invested: 'monthlyInvestment * months',
        maturity:
          'monthlyInvestment * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        gains: 'maturity - invested',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity value', format: 'currency' },
        { key: 'invested', label: 'Total invested', format: 'currency' },
        { key: 'gains', label: 'Estimated gains', format: 'currency' },
      ],
      table: {
        title: 'SIP summary',
        rows: [
          { label: 'Maturity value', key: 'maturity', format: 'currency' },
          { label: 'Total invested', key: 'invested', format: 'currency' },
          { label: 'Estimated gains', key: 'gains', format: 'currency' },
        ],
      },
      chart: {
        title: 'Invested vs gains',
        keys: ['invested', 'gains'],
        labels: { invested: 'Invested', gains: 'Gains' },
      },
      breakdown: {
        title: 'Breakdown',
        items: [
          { label: 'Maturity', key: 'maturity', format: 'currency' },
          { label: 'Gains', key: 'gains', format: 'currency' },
        ],
      },
      recommendations: true,
    },
    settings: {
      faq: [
        {
          q: 'What is SIP?',
          a: 'A Systematic Investment Plan invests a fixed amount every month into a mutual fund.',
        },
        {
          q: 'Is the return guaranteed?',
          a: 'No. Expected return is an assumption for estimation only.',
        },
      ],
    },
    fields: [
      {
        key: 'monthlyInvestment',
        label: 'Monthly investment',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '5000',
      },
      {
        key: 'expectedReturn',
        label: 'Expected return (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '12',
      },
      {
        key: 'years',
        label: 'Investment period (years)',
        fieldType: 'slider',
        sortOrder: 2,
        defaultValue: '10',
        validation: { min: 1, max: 40, step: 1 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'income-tax',
    name: 'Income Tax Calculator',
    description:
      'Estimate income tax for Tax Year 2026–27 under the default new regime (Budget 2025 slabs, unchanged in Budget 2026). Includes Section 87A rebate up to ₹12 lakh and 4% health & education cess. Not a filing tool.',
    categoryId: finance.id,
    formula: {
      type: 'rules',
      rules: [
        { when: 'income <= 400000', outputs: { tax: '0', taxable: 'income' } },
        { when: 'income <= 1200000', outputs: { tax: '0', taxable: 'income' } },
        {
          when: 'income <= 1600000',
          outputs: { tax: '(60000 + (income - 1200000) * 0.15) * 1.04', taxable: 'income' },
        },
        {
          when: 'income <= 2000000',
          outputs: { tax: '(120000 + (income - 1600000) * 0.20) * 1.04', taxable: 'income' },
        },
        {
          when: 'income <= 2400000',
          outputs: { tax: '(200000 + (income - 2000000) * 0.25) * 1.04', taxable: 'income' },
        },
      ],
      outputs: { tax: '(300000 + (income - 2400000) * 0.30) * 1.04', taxable: 'income' },
    },
    resultTemplate: {
      cards: [
        { key: 'tax', label: 'Estimated tax', format: 'currency' },
        { key: 'taxable', label: 'Taxable income', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'income',
        label: 'Annual taxable income',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '900000',
      },
    ],
  });

  await upsertCalculator({
    slug: 'gst',
    name: 'GST Calculator',
    description: 'Add or remove GST from an amount.',
    categoryId: finance.id,
    formula: {
      outputs: {
        gstAmount: 'amount * gstRate / 100',
        totalInclusive: 'amount + gstAmount',
        amountExclusive: 'amount / (1 + gstRate / 100)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'gstAmount', label: 'GST amount', format: 'currency' },
        { key: 'totalInclusive', label: 'Total (inclusive)', format: 'currency' },
        { key: 'amountExclusive', label: 'Base (if amount includes GST)', format: 'currency' },
      ],
    },
    fields: [
      { key: 'amount', label: 'Amount', fieldType: 'currency', sortOrder: 0, defaultValue: '1000' },
      {
        key: 'gstRate',
        label: 'GST rate (%)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '18',
      },
    ],
  });

  await upsertCalculator({
    slug: 'retirement',
    name: 'Retirement Calculator',
    description: 'Estimate corpus needed and projected savings.',
    categoryId: finance.id,
    formula: {
      outputs: {
        yearsToRetire: 'max(retirementAge - currentAge, 1)',
        months: 'yearsToRetire * 12',
        monthlyRate: 'expectedReturn / 12 / 100',
        corpusNeeded: 'monthlyExpense * 12 * 25',
        projectedCorpus:
          'currentSavings * pow(1 + expectedReturn / 100, yearsToRetire) + monthlySip * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        shortfall: 'max(corpusNeeded - projectedCorpus, 0)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'corpusNeeded', label: 'Corpus needed', format: 'currency' },
        { key: 'projectedCorpus', label: 'Projected corpus', format: 'currency' },
        { key: 'shortfall', label: 'Shortfall', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'currentAge',
        label: 'Current age',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '30',
      },
      {
        key: 'retirementAge',
        label: 'Retirement age',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '60',
      },
      {
        key: 'monthlyExpense',
        label: 'Monthly expense today',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '50000',
      },
      {
        key: 'currentSavings',
        label: 'Current savings',
        fieldType: 'currency',
        sortOrder: 3,
        defaultValue: '500000',
      },
      {
        key: 'monthlySip',
        label: 'Monthly SIP',
        fieldType: 'currency',
        sortOrder: 4,
        defaultValue: '10000',
      },
      {
        key: 'expectedReturn',
        label: 'Expected return (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 5,
        defaultValue: '10',
      },
    ],
  });

  await upsertCalculator({
    slug: 'paint',
    name: 'Paint Calculator',
    description: 'Estimate paint required for a room.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        litres: 'area / coveragePerLitre * coats',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Area (sq units)', format: 'number' },
        { key: 'litres', label: 'Paint needed (L)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length', fieldType: 'number', sortOrder: 0, defaultValue: '12' },
      { key: 'width', label: 'Width', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'coats', label: 'Coats', fieldType: 'number', sortOrder: 2, defaultValue: '2' },
      {
        key: 'coveragePerLitre',
        label: 'Coverage per litre',
        fieldType: 'number',
        sortOrder: 3,
        defaultValue: '10',
      },
    ],
  });

  await upsertCalculator({
    slug: 'construction-cost',
    name: 'Construction Cost Calculator',
    description: 'Estimate build cost from area and rate per sq ft.',
    categoryId: construction.id,
    formula: {
      outputs: {
        baseCost: 'area * costPerSqft',
        contingency: 'baseCost * contingencyPercent / 100',
        totalCost: 'baseCost + contingency',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'baseCost', label: 'Base cost', format: 'currency' },
        { key: 'contingency', label: 'Contingency', format: 'currency' },
        { key: 'totalCost', label: 'Total estimate', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'area',
        label: 'Built-up area (sq ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '1200',
      },
      {
        key: 'costPerSqft',
        label: 'Cost per sq ft',
        fieldType: 'currency',
        sortOrder: 1,
        defaultValue: '1800',
      },
      {
        key: 'contingencyPercent',
        label: 'Contingency (%)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '10',
      },
    ],
  });

  await upsertCalculator({
    slug: 'cement',
    name: 'Cement Calculator',
    description: 'Estimate cement bags required for concrete or plaster work.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * thickness / 12',
        bags: 'volume * bagsPerCubicFt',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Volume (cu ft)', format: 'number' },
        { key: 'bags', label: 'Cement bags', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '10',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      {
        key: 'thickness',
        label: 'Thickness (in)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '4',
      },
      {
        key: 'bagsPerCubicFt',
        label: 'Bags per cu ft',
        fieldType: 'number',
        sortOrder: 3,
        defaultValue: '1.25',
      },
    ],
  });

  await upsertCalculator({
    slug: 'concrete',
    name: 'Concrete Calculator',
    description: 'Estimate concrete volume for slabs, footings, and columns.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volumeCuFt: 'length * width * depth / 12',
        volumeCuM: 'volumeCuFt / 35.3147',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volumeCuFt', label: 'Volume (cu ft)', format: 'number' },
        { key: 'volumeCuM', label: 'Volume (cu m)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '20',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'depth', label: 'Depth (in)', fieldType: 'number', sortOrder: 2, defaultValue: '6' },
    ],
  });

  await upsertCalculator({
    slug: 'sand',
    name: 'Sand Calculator',
    description: 'Estimate sand quantity for concrete or plaster mixes.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * thickness / 12',
        sandCuFt: 'volume * sandRatio',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Mix volume (cu ft)', format: 'number' },
        { key: 'sandCuFt', label: 'Sand needed (cu ft)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '10',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      {
        key: 'thickness',
        label: 'Thickness (in)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '4',
      },
      {
        key: 'sandRatio',
        label: 'Sand share of mix',
        fieldType: 'number',
        sortOrder: 3,
        defaultValue: '0.4',
      },
    ],
  });

  await upsertCalculator({
    slug: 'aggregate',
    name: 'Aggregate Calculator',
    description: 'Estimate coarse aggregate for RCC concrete mixes.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * depth / 12',
        aggregateCuFt: 'volume * aggregateRatio',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Concrete volume (cu ft)', format: 'number' },
        { key: 'aggregateCuFt', label: 'Aggregate (cu ft)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '20',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'depth', label: 'Depth (in)', fieldType: 'number', sortOrder: 2, defaultValue: '6' },
      {
        key: 'aggregateRatio',
        label: 'Aggregate share of mix',
        fieldType: 'number',
        sortOrder: 3,
        defaultValue: '0.55',
      },
    ],
  });

  await upsertCalculator({
    slug: 'plaster',
    name: 'Plaster Calculator',
    description: 'Estimate plaster area and material for walls and ceilings.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * height',
        plasterCuFt: 'area * thickness / 12',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Surface area (sq ft)', format: 'number' },
        { key: 'plasterCuFt', label: 'Plaster volume (cu ft)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Wall length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '40',
      },
      {
        key: 'height',
        label: 'Wall height (ft)',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '10',
      },
      {
        key: 'thickness',
        label: 'Plaster thickness (in)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '0.5',
      },
    ],
  });

  await upsertCalculator({
    slug: 'brick',
    name: 'Brick Calculator',
    description: 'Estimate brick count for wall construction.',
    categoryId: construction.id,
    formula: {
      outputs: {
        wallArea: 'length * height',
        bricks: 'wallArea * bricksPerSqft',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'wallArea', label: 'Wall area (sq ft)', format: 'number' },
        { key: 'bricks', label: 'Bricks required', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Wall length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '30',
      },
      {
        key: 'height',
        label: 'Wall height (ft)',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '10',
      },
      {
        key: 'bricksPerSqft',
        label: 'Bricks per sq ft',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '8',
      },
    ],
  });

  await upsertCalculator({
    slug: 'steel',
    name: 'Steel Calculator',
    description: 'Estimate TMT steel weight for RCC beams and columns.',
    categoryId: construction.id,
    formula: {
      outputs: {
        totalLength: 'bars * barLength',
        weightKg: 'totalLength * weightPerMeter',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'totalLength', label: 'Total bar length (m)', format: 'number' },
        { key: 'weightKg', label: 'Steel weight (kg)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'bars',
        label: 'Number of bars',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '20',
      },
      {
        key: 'barLength',
        label: 'Bar length (m)',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '12',
      },
      {
        key: 'weightPerMeter',
        label: 'Weight per meter (kg)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '0.89',
      },
    ],
  });

  await upsertCalculator({
    slug: 'tile',
    name: 'Tile Calculator',
    description: 'Estimate floor or wall tiles including wastage.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        tilesWithWastage: 'area * (1 + wastagePercent / 100) / tileArea',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Area (sq ft)', format: 'number' },
        { key: 'tilesWithWastage', label: 'Tiles (with wastage)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '12',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      {
        key: 'tileArea',
        label: 'Tile area (sq ft)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '1.77',
      },
      {
        key: 'wastagePercent',
        label: 'Wastage (%)',
        fieldType: 'percentage',
        sortOrder: 3,
        defaultValue: '8',
      },
    ],
  });

  await upsertCalculator({
    slug: 'flooring',
    name: 'Flooring Calculator',
    description: 'Estimate flooring material and cost for a room.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        materialUnits: 'area * (1 + wastagePercent / 100)',
        totalCost: 'materialUnits * costPerUnit',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Floor area (sq ft)', format: 'number' },
        { key: 'materialUnits', label: 'Material units', format: 'number' },
        { key: 'totalCost', label: 'Estimated cost', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'length',
        label: 'Length (ft)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '14',
      },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '12' },
      {
        key: 'wastagePercent',
        label: 'Wastage (%)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '10',
      },
      {
        key: 'costPerUnit',
        label: 'Cost per sq ft',
        fieldType: 'currency',
        sortOrder: 3,
        defaultValue: '85',
      },
    ],
  });

  await upsertCalculator({
    slug: 'solar',
    name: 'Solar Savings Calculator',
    description: 'Estimate annual savings from rooftop solar.',
    categoryId: general.id,
    formula: {
      outputs: {
        annualBill: 'monthlyBill * 12',
        annualSavings: 'annualBill * savingsPercent / 100',
        paybackYears: 'systemCost / max(annualSavings, 1)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'annualSavings', label: 'Annual savings', format: 'currency' },
        { key: 'paybackYears', label: 'Payback (years)', format: 'number' },
      ],
    },
    fields: [
      {
        key: 'monthlyBill',
        label: 'Monthly electricity bill',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '3000',
      },
      {
        key: 'savingsPercent',
        label: 'Bill offset (%)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '70',
      },
      {
        key: 'systemCost',
        label: 'System cost',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '250000',
      },
    ],
  });

  await upsertCalculator({
    slug: 'car-loan',
    name: 'Car Loan Calculator',
    description: 'Plan EMI for your next car purchase.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        principal: 'onRoadPrice - downPayment',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalInterest', label: 'Total interest', format: 'currency' },
        { key: 'totalPayment', label: 'Total payment', format: 'currency' },
      ],
    },
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
  });

  await upsertCalculator({
    slug: 'fuel',
    name: 'Fuel Cost Calculator',
    description: 'Estimate trip fuel cost from distance and mileage.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        fuelNeeded: 'distance / mileage',
        tripCost: 'fuelNeeded * fuelPrice',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'fuelNeeded', label: 'Fuel needed (L)', format: 'number' },
        { key: 'tripCost', label: 'Trip cost', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'distance',
        label: 'Distance (km)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '100',
      },
      {
        key: 'mileage',
        label: 'Mileage (km/L)',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '15',
      },
      {
        key: 'fuelPrice',
        label: 'Fuel price / L',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '105',
      },
    ],
  });

  await upsertCalculator({
    slug: 'mileage',
    name: 'Mileage Calculator',
    description: 'Calculate real-world fuel efficiency from trip distance and fuel used.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        mileage: 'distance / fuelUsed',
        costPerKm: 'fuelPrice / mileage',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'mileage', label: 'Mileage (km/L)', format: 'number' },
        { key: 'costPerKm', label: 'Cost per km', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'distance',
        label: 'Distance (km)',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '300',
      },
      {
        key: 'fuelUsed',
        label: 'Fuel used (L)',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '18',
      },
      {
        key: 'fuelPrice',
        label: 'Fuel price / L',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '105',
      },
    ],
  });

  await upsertCalculator({
    slug: 'car-insurance',
    name: 'Car Insurance Estimator',
    description: 'Estimate annual comprehensive car insurance premium.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        basePremium: 'idv * premiumRate / 100',
        ncbDiscount: 'basePremium * ncbPercent / 100',
        estimatedPremium: 'basePremium - ncbDiscount',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'basePremium', label: 'Base premium', format: 'currency' },
        { key: 'ncbDiscount', label: 'NCB discount', format: 'currency' },
        { key: 'estimatedPremium', label: 'Estimated premium', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'idv',
        label: 'Insured Declared Value',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '700000',
      },
      {
        key: 'premiumRate',
        label: 'Premium rate (%)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '2.5',
      },
      {
        key: 'ncbPercent',
        label: 'NCB (%)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '20',
      },
    ],
  });

  await upsertCalculator({
    slug: 'depreciation',
    name: 'Depreciation Calculator',
    description: 'Estimate vehicle resale value after years of ownership.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        remainingValue: 'purchasePrice * pow(1 - depreciationRate / 100, years)',
        totalDepreciation: 'purchasePrice - remainingValue',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'remainingValue', label: 'Estimated value', format: 'currency' },
        { key: 'totalDepreciation', label: 'Total depreciation', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'purchasePrice',
        label: 'Purchase price',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '1000000',
      },
      { key: 'years', label: 'Years owned', fieldType: 'number', sortOrder: 1, defaultValue: '3' },
      {
        key: 'depreciationRate',
        label: 'Depreciation (% / year)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '15',
      },
    ],
  });

  await upsertCalculator({
    slug: 'maintenance-cost',
    name: 'Maintenance Cost Estimator',
    description: 'Estimate annual service and maintenance spend.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        annualService: 'servicesPerYear * costPerService',
        annualConsumables: 'tyresAndOil',
        totalAnnual: 'annualService + annualConsumables',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'annualService', label: 'Service cost / year', format: 'currency' },
        { key: 'annualConsumables', label: 'Consumables / year', format: 'currency' },
        { key: 'totalAnnual', label: 'Total / year', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'servicesPerYear',
        label: 'Services per year',
        fieldType: 'number',
        sortOrder: 0,
        defaultValue: '2',
      },
      {
        key: 'costPerService',
        label: 'Cost per service',
        fieldType: 'currency',
        sortOrder: 1,
        defaultValue: '4500',
      },
      {
        key: 'tyresAndOil',
        label: 'Tyres / oil / misc / year',
        fieldType: 'currency',
        sortOrder: 2,
        defaultValue: '8000',
      },
    ],
  });

  await upsertCalculator({
    slug: 'loan-eligibility',
    name: 'Loan Eligibility Calculator',
    description: 'Estimate maximum loan amount based on income and existing EMIs.',
    categoryId: finance.id,
    seoTitle: 'Loan Eligibility Calculator | Varnarc',
    seoDescription: 'Check how much loan you may qualify for.',
    formula: {
      outputs: {
        maxEmi: 'monthlyIncome * 0.5 - existingEmi',
        eligibleAmount:
          'maxEmi * ((pow(1 + monthlyRate, tenureMonths) - 1) / (monthlyRate * pow(1 + monthlyRate, tenureMonths)))',
        monthlyRate: 'annualRate / 12 / 100',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maxEmi', label: 'Max affordable EMI', format: 'currency' },
        { key: 'eligibleAmount', label: 'Eligible loan amount', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'monthlyIncome',
        label: 'Monthly net income',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '80000',
      },
      {
        key: 'existingEmi',
        label: 'Existing EMIs',
        fieldType: 'currency',
        sortOrder: 1,
        defaultValue: '0',
      },
      {
        key: 'annualRate',
        label: 'Interest rate (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '9',
      },
      {
        key: 'tenureMonths',
        label: 'Tenure (months)',
        fieldType: 'number',
        sortOrder: 3,
        defaultValue: '240',
      },
    ],
  });

  await upsertCalculator({
    slug: 'nps',
    name: 'NPS Calculator',
    description: 'Project NPS corpus at retirement with monthly contributions.',
    categoryId: finance.id,
    formula: {
      outputs: {
        months: 'years * 12',
        invested: 'monthlyContribution * months',
        corpus:
          'monthlyContribution * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        monthlyRate: 'expectedReturn / 12 / 100',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'corpus', label: 'Projected corpus', format: 'currency' },
        { key: 'invested', label: 'Total contributed', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'monthlyContribution',
        label: 'Monthly contribution',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '5000',
      },
      {
        key: 'years',
        label: 'Years to retirement',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '25',
      },
      {
        key: 'expectedReturn',
        label: 'Expected return (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 2,
        defaultValue: '10',
      },
    ],
  });

  await upsertCalculator({
    slug: 'budget-planner',
    name: 'Budget Planner',
    description: 'Split monthly income into needs, wants, and savings.',
    categoryId: general.id,
    formula: {
      outputs: {
        needs: 'monthlyIncome * 0.5',
        wants: 'monthlyIncome * 0.3',
        savings: 'monthlyIncome * 0.2',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'needs', label: 'Needs (50%)', format: 'currency' },
        { key: 'wants', label: 'Wants (30%)', format: 'currency' },
        { key: 'savings', label: 'Savings (20%)', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'monthlyIncome',
        label: 'Monthly income',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '75000',
      },
    ],
  });

  await upsertCalculator({
    slug: 'compound-interest',
    name: 'Compound Interest Calculator',
    description: 'See how a lump sum grows with compound interest.',
    categoryId: finance.id,
    formula: {
      outputs: {
        maturity: 'principal * pow(1 + annualRate / 100, years)',
        gains: 'maturity - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity amount', format: 'currency' },
        { key: 'gains', label: 'Interest earned', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'principal',
        label: 'Principal',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '100000',
      },
      {
        key: 'annualRate',
        label: 'Rate (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '8',
      },
      { key: 'years', label: 'Years', fieldType: 'number', sortOrder: 2, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'ppf',
    name: 'PPF Calculator',
    description: 'Estimate Public Provident Fund maturity with annual deposits.',
    categoryId: finance.id,
    formula: {
      outputs: {
        maturity: 'annualDeposit * ((pow(1 + rate, years) - 1) / rate) * (1 + rate)',
        rate: 'interestRate / 100',
        invested: 'annualDeposit * years',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity value', format: 'currency' },
        { key: 'invested', label: 'Total deposited', format: 'currency' },
      ],
    },
    fields: [
      {
        key: 'annualDeposit',
        label: 'Annual deposit',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '150000',
      },
      {
        key: 'interestRate',
        label: 'Interest rate (% p.a.)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '7.1',
      },
      {
        key: 'years',
        label: 'Tenure (years)',
        fieldType: 'number',
        sortOrder: 2,
        defaultValue: '15',
      },
    ],
  });

  await upsertCalculator({
    slug: 'gratuity',
    name: 'Gratuity Calculator',
    description: 'Estimate gratuity payout for eligible employees in India.',
    categoryId: finance.id,
    formula: {
      outputs: {
        gratuity: 'lastDrawnSalary * yearsOfService * 15 / 26',
      },
    },
    resultTemplate: {
      cards: [{ key: 'gratuity', label: 'Estimated gratuity', format: 'currency' }],
    },
    fields: [
      {
        key: 'lastDrawnSalary',
        label: 'Last drawn basic + DA (monthly)',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '50000',
      },
      {
        key: 'yearsOfService',
        label: 'Years of service',
        fieldType: 'number',
        sortOrder: 1,
        defaultValue: '8',
      },
    ],
  });

  await upsertCalculator({
    slug: 'property-tax',
    name: 'Property Tax Estimator',
    description: 'Rough annual property tax estimate from assessed value.',
    categoryId: general.id,
    formula: {
      outputs: {
        annualTax: 'assessedValue * taxRate / 100',
      },
    },
    resultTemplate: {
      cards: [{ key: 'annualTax', label: 'Estimated annual tax', format: 'currency' }],
    },
    fields: [
      {
        key: 'assessedValue',
        label: 'Assessed property value',
        fieldType: 'currency',
        sortOrder: 0,
        defaultValue: '5000000',
      },
      {
        key: 'taxRate',
        label: 'Tax rate (% of AV)',
        fieldType: 'percentage',
        sortOrder: 1,
        defaultValue: '0.2',
      },
    ],
  });

  await seedExtendedCalculators(prisma, {
    finance: finance.id,
    construction: construction.id,
    automobile: automobile.id,
    general: general.id,
  });
  await seedEmiCalculators(prisma, {
    finance: finance.id,
    automobile: automobile.id,
  });
  await enrichExistingCalculators(prisma);
}
