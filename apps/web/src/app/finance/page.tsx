import type { Metadata } from 'next';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
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
    description: 'Indicative eligibility check',
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

/** Show only real API data — no fabricated lender rates/fees as fallback. */

const COMPARE_LOGO_COLORS = ['bg-blue-600', 'bg-red-600', 'bg-orange-500', 'bg-indigo-600'];

function loanToCompareRow(loan: FinanceLoan, index: number): HubCompareRow {
  return {
    provider: loan.bank?.name ?? loan.name,
    rate: loan.interestRate != null ? `${loan.interestRate}%` : '—',
    fee: loan.processingFee != null ? `${loan.processingFee}%` : '—',
    tenure: loan.tenureMax != null ? `${Math.round(loan.tenureMax / 12)} years` : '—',
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

function compareRowsFromLoans(loans: FinanceLoan[]): HubCompareRow[] {
  return loans.slice(0, 4).map(loanToCompareRow);
}

const RATE_CATEGORY_HINTS = [
  {
    label: 'Home Loan',
    icon: 'home',
    href: '/finance/rates',
  },
  {
    label: 'Personal Loan',
    icon: 'wallet',
    href: '/finance/rates',
  },
  {
    label: 'Car Loan',
    icon: 'car',
    href: '/finance/rates',
  },
  {
    label: 'Credit Card',
    icon: 'card',
    href: '/finance/credit-cards',
  },
  {
    label: 'Fixed Deposit',
    icon: 'wallet',
    href: '/finance/rates',
  },
];

const FEATURED_CATEGORY_LINKS = [
  {
    id: 'loans',
    name: 'Explore Loans',
    href: '/finance/loans',
    imageUrl: getFinanceFeaturedImage('/finance/loans/'),
    bullets: ['Compare home, personal, car & more', 'EMI calculators available'],
  },
  {
    id: 'credit-cards',
    name: 'Explore Credit Cards',
    href: '/finance/credit-cards',
    imageUrl: getFinanceFeaturedImage('/finance/credit-cards/'),
    bullets: ['Rewards, cashback & travel cards', 'Side-by-side comparisons'],
  },
  {
    id: 'insurance',
    name: 'Explore Insurance',
    href: '/finance/insurance',
    imageUrl: getFinanceFeaturedImage('/finance/insurance/'),
    bullets: ['Health, life & motor options', 'Coverage comparison tools'],
  },
];

const FALLBACK_GUIDES = [
  {
    slug: 'home-loan-guide',
    title: 'How to Choose the Right Home Loan',
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
    title: 'Tax-Saving Investment Options',
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

const FALLBACK_FAQS = [
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

function formatRatesVerifiedOn(iso?: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export default async function FinancePage() {
  const [
    page,
    categoriesRes,
    loansRes,
    cardsRes,
    insuranceRes,
    _investmentsRes,
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
  const insurance = (insuranceRes.data ?? []).filter(
    (item) => !/varnarc/i.test(item.providerName ?? '') && !/varnarc/i.test(item.name ?? ''),
  );
  const rates = ratesRes.data ?? [];

  const homeLoans = loans.filter((l) => /home/i.test(l.loanType));
  const personalLoans = loans.filter((l) => /personal/i.test(l.loanType));

  const compareTabGroups: HubCompareTabGroup[] = [
    {
      label: 'Home Loans',
      href: '/finance/loans',
      rows: compareRowsFromLoans(homeLoans.length ? homeLoans : loans),
    },
    {
      label: 'Personal Loans',
      href: '/finance/loans',
      rows: compareRowsFromLoans(personalLoans),
    },
    {
      label: 'Credit Cards',
      href: '/finance/credit-cards',
      rows: cards.slice(0, 4).map(cardToCompareRow),
    },
    {
      label: 'Insurance',
      href: '/finance/insurance',
      rows: insurance.slice(0, 4).map(insuranceToCompareRow),
    },
  ].filter((group) => group.rows.length > 0);

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

  const featuredItems = apiFeatured.length >= 1 ? apiFeatured : FEATURED_CATEGORY_LINKS;

  const apiRateItems = rates.slice(0, 5).map((row) => ({
    label: row.productType || row.loan?.name || row.bank?.name || 'Rate',
    rateLabel: 'Starting from',
    value: `${row.rate}% p.a.`,
    href: '/finance/rates',
    icon: 'percent',
  }));

  const latestRateAt = rates.reduce<string | null>((latest, row) => {
    if (!row.effectiveFrom) return latest;
    if (!latest || new Date(row.effectiveFrom) > new Date(latest)) return row.effectiveFrom;
    return latest;
  }, null);
  const ratesFooter = formatRatesVerifiedOn(latestRateAt)
    ? `Last verified ${formatRatesVerifiedOn(latestRateAt)} from Admin → Finance → Interest rates`
    : 'No published rates yet. Add them in Admin → Finance → Interest rates.';

  const rateItems =
    apiRateItems.length > 0
      ? apiRateItems
      : RATE_CATEGORY_HINTS.map((h) => ({ ...h, rateLabel: 'View rates', value: 'See details' }));

  const apiGuides = (guidesRes.data ?? []).slice(0, 6).map((g) => ({
    slug: g.slug,
    title: g.title,
    category: hubCategoryLabel(g.category),
    summary: g.summary,
    href: `/finance/guides/${g.slug}`,
    readMinutes: 5,
    imageUrl: getFinanceGuideImage(g.slug, hubCategoryLabel(g.category)),
  }));

  const guides = (apiGuides.length >= 4 ? apiGuides : [...apiGuides, ...FALLBACK_GUIDES]).slice(
    0,
    4,
  );

  const apiFaqs = (faqsRes.data ?? []).slice(0, 6).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  const faqs = apiFaqs.length >= 6 ? apiFaqs : FALLBACK_FAQS;

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
              subtitle="Compare products side by side to find what suits you."
              headerLinkHref="/finance/compare"
              headerLinkLabel="Compare now →"
            />
            <HubRatesList
              title="Latest interest rates"
              items={rateItems}
              footer={ratesFooter}
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
