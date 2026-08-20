import type { Metadata } from 'next';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubCalculatorSection } from '@/components/hub/hub-calculator-section';
import type { HubGridItem } from '@/components/hub/hub-icon-grid';
import {
  HubCompareTable,
  type HubCompareRow,
  type HubCompareTabGroup,
} from '@/components/hub/hub-compare-table';
import { HubRatesList } from '@/components/hub/hub-rates-list';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { HubProductSection } from '@/components/hub/hub-product-section';
import type { HubProductLink } from '@/components/hub/hub-product-links';
import {
  fetchFinanceCategories,
  fetchFinanceCreditCards,
  fetchFinanceFaqs,
  fetchFinanceGuides,
  fetchFinanceInsurance,
  fetchFinanceInvestments,
  fetchFinanceLoans,
  fetchFinanceRates,
  type FinanceCreditCard,
  type FinanceInsurance,
  type FinanceLoan,
  type FinanceCategory,
} from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';
import { hubCategoryLabel } from '@/lib/hub-category-label';
import { fetchCalculators } from '@/services/content';
import { getFinanceFeaturedImage, getFinanceGuideImage } from '@/lib/hub-images';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildFinancePageMetadata('hub');
  return {
    ...metadata,
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

const calculatorItems = [
  {
    label: 'Home Loan EMI',
    href: '/calculators/emi',
    description: 'Estimate monthly payments',
    icon: 'home',
  },
  {
    label: 'Personal Loan EMI',
    href: '/calculators/loan',
    description: 'Plan your loan',
    icon: 'wallet',
  },
  {
    label: 'Car Loan EMI',
    href: '/calculators/emi',
    description: 'Vehicle financing',
    icon: 'car',
  },
  {
    label: 'SIP Calculator',
    href: '/calculators/sip',
    description: 'Investment growth',
    icon: 'trending',
  },
  {
    label: 'FD Calculator',
    href: '/calculators/fd',
    description: 'Fixed deposit returns',
    icon: 'wallet',
  },
  {
    label: 'Income Tax Calculator',
    href: '/calculators/income-tax',
    description: 'Tax liability estimate',
    icon: 'receipt',
  },
  {
    label: 'Loan Eligibility Check',
    href: '/finance/eligibility',
    description: 'Check your eligibility',
    icon: 'check',
  },
  {
    label: 'Compare Loans',
    href: '/finance/compare',
    description: 'Side-by-side comparison',
    icon: 'scale',
  },
];

const FINANCE_CALCULATOR_SLUG_HINTS = [
  'emi',
  'sip',
  'income-tax',
  'gst',
  'loan',
  'retirement',
  'fd',
  'nps',
  'car-loan',
  'mutual-fund',
  'compound',
  'tax',
  'budget',
  'savings',
];

const extendedFinanceCalculatorItems: HubGridItem[] = [
  {
    label: 'GST Calculator',
    href: '/calculators/gst',
    description: 'GST on goods & services',
    icon: 'receipt',
  },
  {
    label: 'Retirement Calculator',
    href: '/calculators/retirement',
    description: 'Plan retirement savings',
    icon: 'piggy',
  },
  {
    label: 'Car Loan Calculator',
    href: '/calculators/car-loan',
    description: 'Vehicle loan planning',
    icon: 'car',
  },
  {
    label: 'Loan Calculator',
    href: '/calculators/loan',
    description: 'General loan EMI',
    icon: 'calculator',
  },
];

function mergeFinanceCalculatorItems(
  apiItems: Array<{ slug: string; name: string; description?: string | null }>,
  fallbacks: HubGridItem[],
): HubGridItem[] {
  const fallbackByHref = new Map(fallbacks.map((item) => [item.href, item]));

  const fromApi: HubGridItem[] = apiItems
    .filter((calc) => FINANCE_CALCULATOR_SLUG_HINTS.some((hint) => calc.slug.includes(hint)))
    .map((calc) => {
      const href = `/calculators/${calc.slug}`;
      const fallback = fallbackByHref.get(href);
      return {
        label: calc.name,
        description: calc.description ?? fallback?.description ?? 'Free calculator',
        href,
        icon: fallback?.icon ?? 'calculator',
      };
    });

  const seen = new Set(fromApi.map((item) => item.href));
  const merged: HubGridItem[] = [...fromApi];

  for (const item of fallbacks) {
    if (!seen.has(item.href)) {
      merged.push(item);
      seen.add(item.href);
    }
  }

  return merged;
}

const productLinks = [
  {
    label: 'Loans',
    href: '/finance/loans',
    description: 'Home, Personal, Car, Business & more',
    icon: 'bank',
  },
  {
    label: 'Credit Cards',
    href: '/finance/credit-cards',
    description: 'Rewards, Cashback, Travel & more',
    icon: 'card',
  },
  {
    label: 'Insurance',
    href: '/finance/insurance',
    description: 'Health, Life, Motor & more',
    icon: 'shield',
  },
  {
    label: 'Investments',
    href: '/finance/investments',
    description: 'Mutual Funds, Stocks, Bonds & more',
    icon: 'trending',
  },
  {
    label: 'Banking',
    href: '/finance/banks',
    description: 'Savings, Current, NRI Accounts',
    icon: 'building',
  },
  {
    label: 'Taxation',
    href: '/calculators/income-tax',
    description: 'Income Tax, GST, TDS & more',
    icon: 'receipt',
  },
  {
    label: 'Personal Finance',
    href: '/finance/goals',
    description: 'Budgeting, Savings, Retirement',
    icon: 'piggy',
  },
];

const extendedProductLinks: HubProductLink[] = [
  {
    label: 'Interest Rates',
    href: '/finance/rates',
    description: 'Latest loan & deposit rates',
    icon: 'percent',
  },
  {
    label: 'Compare Products',
    href: '/finance/compare',
    description: 'Side-by-side comparisons',
    icon: 'scale',
  },
  {
    label: 'Financial Guides',
    href: '/finance/guides',
    description: 'Expert articles & tips',
    icon: 'book',
  },
  {
    label: 'Credit Score',
    href: '/finance/credit-score',
    description: 'Monitor & improve score',
    icon: 'check',
  },
  {
    label: 'Loan Eligibility',
    href: '/finance/eligibility',
    description: 'Check approval odds',
    icon: 'calculator',
  },
  {
    label: 'Portfolio Tracker',
    href: '/finance/portfolio',
    description: 'Track your holdings',
    icon: 'trending',
  },
  {
    label: 'FAQs',
    href: '/finance/faqs',
    description: 'Common finance questions',
    icon: 'book',
  },
  {
    label: 'Glossary',
    href: '/finance/glossary',
    description: 'Finance terms explained',
    icon: 'book',
  },
];

function mergeFinanceProductItems(
  apiCategories: FinanceCategory[],
  primaryItems: HubProductLink[],
  extraItems: HubProductLink[],
): HubProductLink[] {
  const seen = new Set<string>();
  const merged: HubProductLink[] = [];

  const add = (item: HubProductLink) => {
    if (!seen.has(item.href)) {
      merged.push(item);
      seen.add(item.href);
    }
  };

  for (const item of primaryItems) add(item);
  for (const cat of apiCategories) {
    add({
      label: cat.name,
      description: cat.description ?? 'Browse category',
      href: `/finance/categories/${cat.slug}`,
      icon: 'grid',
    });
  }
  for (const item of extraItems) add(item);

  return merged;
}

const MOCK_COMPARE_ROWS: HubCompareRow[] = [
  { provider: 'SBI', rate: '8.40%', fee: '0.35%', tenure: '30 years', logoColor: 'bg-blue-600' },
  { provider: 'HDFC', rate: '8.50%', fee: '0.50%', tenure: '30 years', logoColor: 'bg-red-600' },
  {
    provider: 'ICICI',
    rate: '8.45%',
    fee: '0.50%',
    tenure: '30 years',
    logoColor: 'bg-orange-500',
  },
  { provider: 'Axis', rate: '8.55%', fee: '0.50%', tenure: '30 years', logoColor: 'bg-indigo-600' },
];

const MOCK_PERSONAL_LOAN_ROWS: HubCompareRow[] = [
  { provider: 'HDFC', rate: '10.49%', fee: '1.00%', tenure: '5 years', logoColor: 'bg-red-600' },
  {
    provider: 'ICICI',
    rate: '10.75%',
    fee: '0.99%',
    tenure: '5 years',
    logoColor: 'bg-orange-500',
  },
  {
    provider: 'Bajaj Finserv',
    rate: '11.00%',
    fee: '2.00%',
    tenure: '5 years',
    logoColor: 'bg-blue-600',
  },
  { provider: 'Axis', rate: '10.85%', fee: '1.50%', tenure: '5 years', logoColor: 'bg-indigo-600' },
];

const MOCK_CREDIT_CARD_ROWS: HubCompareRow[] = [
  {
    provider: 'HDFC Regalia',
    rate: '42% p.a.',
    fee: '₹2,500',
    tenure: 'Annual fee',
    logoColor: 'bg-red-600',
    href: '/finance/credit-cards',
  },
  {
    provider: 'SBI Card ELITE',
    rate: '42% p.a.',
    fee: '₹4,999',
    tenure: 'Annual fee',
    logoColor: 'bg-blue-600',
    href: '/finance/credit-cards',
  },
  {
    provider: 'ICICI Amazon Pay',
    rate: '42% p.a.',
    fee: 'Lifetime free',
    tenure: 'No annual fee',
    logoColor: 'bg-orange-500',
    href: '/finance/credit-cards',
  },
  {
    provider: 'Axis Magnus',
    rate: '42% p.a.',
    fee: '₹10,000',
    tenure: 'Annual fee',
    logoColor: 'bg-indigo-600',
    href: '/finance/credit-cards',
  },
];

const MOCK_INSURANCE_ROWS: HubCompareRow[] = [
  {
    provider: 'HDFC ERGO',
    rate: '₹8,200/yr',
    fee: '₹5L cover',
    tenure: '1 year',
    logoColor: 'bg-red-600',
    href: '/finance/insurance',
  },
  {
    provider: 'ICICI Lombard',
    rate: '₹7,500/yr',
    fee: '₹5L cover',
    tenure: '1 year',
    logoColor: 'bg-orange-500',
    href: '/finance/insurance',
  },
  {
    provider: 'Star Health',
    rate: '₹9,100/yr',
    fee: '₹10L cover',
    tenure: '1 year',
    logoColor: 'bg-blue-600',
    href: '/finance/insurance',
  },
  {
    provider: 'Max Life',
    rate: '₹12,000/yr',
    fee: '₹1L cover',
    tenure: '1 year',
    logoColor: 'bg-indigo-600',
    href: '/finance/insurance',
  },
];

const COMPARE_LOGO_COLORS = ['bg-blue-600', 'bg-red-600', 'bg-orange-500', 'bg-indigo-600'];

function loanToCompareRow(loan: FinanceLoan, index: number): HubCompareRow {
  return {
    provider: loan.bank?.name ?? loan.name,
    rate: loan.interestRate != null ? `${loan.interestRate}%` : '—',
    fee: loan.processingFee != null ? `${loan.processingFee}%` : '0.50%',
    tenure: loan.tenureMax != null ? `${Math.round(loan.tenureMax / 12)} years` : '30 years',
    href: `/finance/loans/${loan.id}`,
    logoColor: COMPARE_LOGO_COLORS[index % COMPARE_LOGO_COLORS.length],
  };
}

function cardToCompareRow(card: FinanceCreditCard, index: number): HubCompareRow {
  const annualFee = card.annualFee != null && card.annualFee !== '' ? `₹${card.annualFee}` : '—';
  const joining =
    card.joiningFee != null && card.joiningFee !== '' && Number(card.joiningFee) === 0
      ? 'Lifetime free'
      : card.joiningFee != null
        ? `₹${card.joiningFee}`
        : '—';

  return {
    provider: card.name,
    rate: card.cashback ? String(card.cashback) : 'Rewards',
    fee: annualFee,
    tenure: joining,
    href: `/finance/credit-cards/${card.id}`,
    logoColor: COMPARE_LOGO_COLORS[index % COMPARE_LOGO_COLORS.length],
  };
}

function insuranceToCompareRow(item: FinanceInsurance, index: number): HubCompareRow {
  return {
    provider: item.providerName,
    rate: item.premium != null ? `₹${item.premium}/yr` : '—',
    fee: item.coverage ?? '—',
    tenure: '1 year',
    href: `/finance/insurance/${item.id}`,
    logoColor: COMPARE_LOGO_COLORS[index % COMPARE_LOGO_COLORS.length],
  };
}

function compareRowsFromLoans(loans: FinanceLoan[], fallback: HubCompareRow[]): HubCompareRow[] {
  const rows = loans.slice(0, 4).map(loanToCompareRow);
  return rows.length >= 4 ? rows : fallback;
}

const MOCK_RATE_ITEMS = [
  {
    label: 'Home Loan',
    rateLabel: 'Starting from',
    value: '8.40% p.a.',
    icon: 'home',
    href: '/finance/rates',
  },
  {
    label: 'Personal Loan',
    rateLabel: 'Starting from',
    value: '10.49% p.a.',
    icon: 'wallet',
    href: '/finance/rates',
  },
  {
    label: 'Car Loan',
    rateLabel: 'Starting from',
    value: '8.75% p.a.',
    icon: 'car',
    href: '/finance/rates',
  },
  {
    label: 'Credit Card',
    rateLabel: 'Up to',
    value: '42% p.a.',
    icon: 'card',
    href: '/finance/credit-cards',
  },
  {
    label: 'Fixed Deposit',
    rateLabel: 'Up to',
    value: '7.10% p.a.',
    icon: 'wallet',
    href: '/finance/rates',
  },
];

const MOCK_FEATURED = [
  {
    id: 'hdfc-regalia',
    name: 'HDFC Regalia Credit Card',
    href: '/finance/credit-cards',
    imageUrl: getFinanceFeaturedImage('/finance/credit-cards/'),
    bullets: ['Joining Fee: ₹2,500', 'Reward points on spends'],
  },
  {
    id: 'sbi-home',
    name: 'SBI Home Loan',
    href: '/finance/loans',
    imageUrl: getFinanceFeaturedImage('/finance/loans/'),
    bullets: ['Interest: Starting 8.40% p.a.', 'Up to 30 years tenure'],
  },
  {
    id: 'term-plan',
    name: 'Term Plan Insurance',
    href: '/finance/insurance',
    imageUrl: getFinanceFeaturedImage('/finance/insurance/'),
    bullets: ['Premium: Starting ₹490/month', 'Life cover options'],
  },
];

const MOCK_GUIDES = [
  {
    slug: 'home-loan-guide',
    title: 'How to Choose the Right Home Loan in 2024',
    category: 'HOME LOANS',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: getFinanceGuideImage('loans', 'HOME LOANS'),
  },
  {
    slug: 'sip-beginners',
    title: "Understanding SIP Investments: A Beginner's Guide",
    category: 'INVESTMENTS',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: '/hub/finance/guide-sip-investment.png',
  },
  {
    slug: 'credit-card-rewards',
    title: 'Credit Card Rewards: Maximizing Your Benefits',
    category: 'CREDIT CARDS',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: getFinanceGuideImage('credit-cards', 'CREDIT CARDS'),
  },
  {
    slug: 'tax-saving',
    title: 'Tax-Saving Investment Options for FY 2024-25',
    category: 'TAXATION',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: getFinanceGuideImage('tax', 'TAXATION'),
  },
  {
    slug: 'loan-vs-card',
    title: 'Personal Loan vs Credit Card: Which is Better?',
    category: 'LOANS',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: '/hub/finance/guide-personal-loan.png',
  },
  {
    slug: 'health-insurance',
    title: 'Health Insurance: Coverage You Actually Need',
    category: 'INSURANCE',
    href: '/finance/guides',
    readMinutes: 5,
    imageUrl: getFinanceGuideImage('insurance', 'INSURANCE'),
  },
];

const MOCK_FAQS = [
  {
    id: 'faq-1',
    question: 'How do I calculate my home loan EMI?',
    answer:
      'Use our Home Loan EMI calculator with loan amount, interest rate, and tenure. The result shows monthly EMI, total interest, and repayment schedule.',
  },
  {
    id: 'faq-2',
    question: 'What is the difference between fixed and floating interest rates?',
    answer:
      'Fixed rates stay constant for the agreed period. Floating rates change with market benchmarks like repo rate, which can lower or raise your EMI over time.',
  },
  {
    id: 'faq-3',
    question: 'How can I improve my credit score?',
    answer:
      'Pay bills on time, keep credit utilization low, avoid multiple loan applications in short periods, and review your credit report for errors.',
  },
  {
    id: 'faq-4',
    question: 'What documents are required for a personal loan?',
    answer:
      'Typically ID proof, address proof, income proof (salary slips or ITR), bank statements, and employment details. Requirements vary by lender.',
  },
  {
    id: 'faq-5',
    question: 'How do SIP investments work?',
    answer:
      'A SIP invests a fixed amount at regular intervals in mutual funds, helping build discipline and benefit from long-term market growth.',
  },
  {
    id: 'faq-6',
    question: 'What is the maximum home loan tenure?',
    answer:
      'Most lenders offer home loans up to 30 years, subject to your age, income, and property value at the time of application.',
  },
];

function formatRatesDate() {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export default async function FinancePage() {
  const [
    page,
    categoriesRes,
    loansRes,
    cardsRes,
    insuranceRes,
    investmentsRes,
    ratesRes,
    guidesRes,
    faqsRes,
    calculatorsRes,
  ] = await Promise.all([
    getFinancePageContent('hub'),
    fetchFinanceCategories(),
    fetchFinanceLoans({ limit: 6 }),
    fetchFinanceCreditCards({ limit: 3 }),
    fetchFinanceInsurance({ limit: 2 }),
    fetchFinanceInvestments({ limit: 2 }),
    fetchFinanceRates({ limit: 6 }),
    fetchFinanceGuides(),
    fetchFinanceFaqs(),
    fetchCalculators(48),
  ]);

  const allFinanceCalculatorItems = mergeFinanceCalculatorItems(calculatorsRes.data ?? [], [
    ...calculatorItems,
    ...extendedFinanceCalculatorItems,
  ]);

  const calculatorPreview = allFinanceCalculatorItems.slice(0, 8);

  const allFinanceProductItems = mergeFinanceProductItems(
    categoriesRes.data ?? [],
    productLinks,
    extendedProductLinks,
  );

  const productPreview = allFinanceProductItems.slice(0, 7);

  const loans = loansRes.data ?? [];
  const cards = cardsRes.data ?? [];
  const insurance = insuranceRes.data ?? [];
  const rates = ratesRes.data ?? [];

  const homeLoans = loans.filter((l) => /home/i.test(l.loanType));
  const personalLoans = loans.filter((l) => /personal/i.test(l.loanType));

  const compareTabGroups: HubCompareTabGroup[] = [
    {
      label: 'Home Loans',
      href: '/finance/loans',
      rows: compareRowsFromLoans(homeLoans.length ? homeLoans : loans, MOCK_COMPARE_ROWS),
    },
    {
      label: 'Personal Loans',
      href: '/finance/loans',
      rows: compareRowsFromLoans(personalLoans, MOCK_PERSONAL_LOAN_ROWS),
    },
    {
      label: 'Credit Cards',
      href: '/finance/credit-cards',
      rows:
        cards.length >= 4
          ? cards.slice(0, 4).map(cardToCompareRow)
          : cards.length > 0
            ? [...cards.map(cardToCompareRow), ...MOCK_CREDIT_CARD_ROWS.slice(cards.length)].slice(
                0,
                4,
              )
            : MOCK_CREDIT_CARD_ROWS,
    },
    {
      label: 'Insurance',
      href: '/finance/insurance',
      rows:
        insurance.length >= 4
          ? insurance.slice(0, 4).map(insuranceToCompareRow)
          : insurance.length > 0
            ? [
                ...insurance.map(insuranceToCompareRow),
                ...MOCK_INSURANCE_ROWS.slice(insurance.length),
              ].slice(0, 4)
            : MOCK_INSURANCE_ROWS,
    },
  ];

  const apiFeatured = [
    ...loans.slice(0, 2).map((item) => {
      const href = `/finance/loans/${item.id}`;
      return {
        id: item.id,
        name: item.name,
        href,
        imageUrl: getFinanceFeaturedImage(href),
        bullets: [
          item.interestRate != null ? `Interest from ${item.interestRate}% p.a.` : 'Compare rates',
          item.tenureMax != null ? `Up to ${item.tenureMax} months tenure` : 'Flexible tenure',
        ],
      };
    }),
    ...cards.slice(0, 1).map((item) => {
      const href = `/finance/credit-cards/${item.id}`;
      return {
        id: item.id,
        name: item.name,
        href,
        imageUrl: getFinanceFeaturedImage(href),
        bullets: [item.bank?.name ?? 'Credit card', 'Rewards and benefits'],
      };
    }),
  ].slice(0, 3);

  const featuredItems = apiFeatured.length >= 3 ? apiFeatured : MOCK_FEATURED;

  const apiRateItems = rates.slice(0, 5).map((row) => ({
    label: row.productType || row.loan?.name || row.bank?.name || 'Rate',
    rateLabel: 'Starting from',
    value: `${row.rate}% p.a.`,
    href: '/finance/rates',
    icon: 'percent',
  }));

  const rateItems = apiRateItems.length >= 5 ? apiRateItems : MOCK_RATE_ITEMS;

  const apiGuides = (guidesRes.data ?? []).slice(0, 6).map((g) => ({
    slug: g.slug,
    title: g.title,
    category: hubCategoryLabel(g.category),
    summary: g.summary,
    href: `/finance/guides/${g.slug}`,
    readMinutes: 5,
    imageUrl: getFinanceGuideImage(g.slug, hubCategoryLabel(g.category)),
  }));

  const guides = (apiGuides.length >= 4 ? apiGuides : [...apiGuides, ...MOCK_GUIDES]).slice(0, 4);

  const apiFaqs = (faqsRes.data ?? []).slice(0, 6).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  const faqs = apiFaqs.length >= 6 ? apiFaqs : MOCK_FAQS;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: siteUrl },
          { name: 'Finance', url: `${siteUrl}/finance` },
        ])}
      />
      <ModuleHubShell
        moduleKey="finance"
        title={page.h1}
        description={page.intro}
        showAd={false}
        showIntentSelector
      >
        <HubCalculatorSection
          title="Popular finance calculators"
          previewItems={calculatorPreview}
          allItems={allFinanceCalculatorItems}
          previewCount={8}
        />

        <HubProductSection
          title="Explore financial products"
          previewItems={productPreview}
          allItems={allFinanceProductItems}
          previewCount={7}
        />

        <section aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="sr-only">
            Compare rates and products
          </h2>
          <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
            <HubCompareTable
              title="Compare financial products"
              variant="panel"
              tabGroups={compareTabGroups}
              activeTab="Home Loans"
              viewAllHref="/finance/compare"
              subtitle="Compare top products side by side and choose the best."
              headerLinkHref="/finance/compare"
              headerLinkLabel="Compare now →"
            />
            <HubRatesList
              title="Latest interest rates"
              items={rateItems}
              footer={`Rates updated on ${formatRatesDate()}`}
              viewAllHref="/finance/rates"
              variant="panel"
            />
            <HubFeaturedStack
              title="Featured financial products"
              items={featuredItems}
              viewAllHref="/finance/loans"
              variant="panel"
              layout="stack"
            />
          </div>
        </section>

        <HubGuideGrid items={guides} viewAllHref="/finance/guides" />

        <HubFaqSection faqs={faqs} viewAllHref="/finance/faqs" />
      </ModuleHubShell>
    </>
  );
}
