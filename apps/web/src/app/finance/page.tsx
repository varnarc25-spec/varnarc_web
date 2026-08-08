import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubCompareTable } from '@/components/hub/hub-compare-table';
import { HubRatesList } from '@/components/hub/hub-rates-list';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import {
  fetchFinanceCategories,
  fetchFinanceCreditCards,
  fetchFinanceDashboard,
  fetchFinanceFaqs,
  fetchFinanceGuides,
  fetchFinanceInsurance,
  fetchFinanceInvestments,
  fetchFinanceLoans,
  fetchFinanceRates,
} from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';
import { hubCategoryLabel } from '@/lib/hub-category-label';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildFinancePageMetadata('hub');
  return {
    ...metadata,
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

const productLinks = [
  {
    label: 'Loans',
    href: '/finance/loans',
    description: 'Home, personal & business',
    icon: 'bank',
  },
  {
    label: 'Credit cards',
    href: '/finance/credit-cards',
    description: 'Rewards & cashback',
    icon: 'card',
  },
  {
    label: 'Insurance',
    href: '/finance/insurance',
    description: 'Health, life & motor',
    icon: 'shield',
  },
  {
    label: 'Investments',
    href: '/finance/investments',
    description: 'Funds, FDs & more',
    icon: 'trending',
  },
  { label: 'Banks', href: '/finance/banks', description: 'Partner banks', icon: 'building' },
  {
    label: 'Interest rates',
    href: '/finance/rates',
    description: 'Latest benchmarks',
    icon: 'percent',
  },
  { label: 'Compare', href: '/finance/compare', description: 'Side-by-side views', icon: 'scale' },
];

const toolLinks = [
  {
    label: 'Eligibility check',
    href: '/finance/eligibility',
    description: 'Loan estimate',
    icon: 'check',
  },
  {
    label: 'Credit score',
    href: '/finance/credit-score',
    description: 'Profile check',
    icon: 'star',
  },
  { label: 'Portfolio', href: '/finance/portfolio', description: 'Holdings', icon: 'wallet' },
  { label: 'Goals', href: '/finance/goals', description: 'Track targets', icon: 'piggy' },
];

const popularLinks = [
  { label: 'Home Loan EMI', href: '/calculators/emi' },
  { label: 'SIP Calculator', href: '/calculators/sip' },
  { label: 'Income Tax', href: '/calculators/income-tax' },
  { label: 'Credit Cards', href: '/finance/credit-cards' },
];

export default async function FinancePage() {
  const [
    page,
    dashboardRes,
    categoriesRes,
    loansRes,
    cardsRes,
    insuranceRes,
    investmentsRes,
    ratesRes,
    guidesRes,
    faqsRes,
  ] = await Promise.all([
    getFinancePageContent('hub'),
    fetchFinanceDashboard(),
    fetchFinanceCategories(),
    fetchFinanceLoans({ limit: 6 }),
    fetchFinanceCreditCards({ limit: 3 }),
    fetchFinanceInsurance({ limit: 2 }),
    fetchFinanceInvestments({ limit: 2 }),
    fetchFinanceRates({ limit: 6 }),
    fetchFinanceGuides(),
    fetchFinanceFaqs(),
  ]);

  const calculatorItems = dashboardRes.data?.relatedCalculators?.map((calc) => ({
    label: calc.name,
    description: 'Free calculator',
    href: `/calculators/${calc.slug}`,
    icon: 'calculator',
  })) ?? [
    {
      label: 'EMI Calculator',
      href: '/calculators/emi',
      description: 'Loan EMI',
      icon: 'calculator',
    },
    {
      label: 'SIP Calculator',
      href: '/calculators/sip',
      description: 'Investments',
      icon: 'trending',
    },
    {
      label: 'Income Tax',
      href: '/calculators/income-tax',
      description: 'Tax estimate',
      icon: 'receipt',
    },
    {
      label: 'GST Calculator',
      href: '/calculators/gst',
      description: 'GST breakdown',
      icon: 'percent',
    },
    {
      label: 'Loan Calculator',
      href: '/calculators/loan',
      description: 'Loan planning',
      icon: 'bank',
    },
    {
      label: 'Retirement',
      href: '/calculators/retirement',
      description: 'Retirement corpus',
      icon: 'piggy',
    },
    {
      label: 'FD Calculator',
      href: '/calculators/fd',
      description: 'Fixed deposit',
      icon: 'wallet',
    },
    {
      label: 'NPS Calculator',
      href: '/calculators/nps',
      description: 'NPS returns',
      icon: 'layers',
    },
  ];

  const categoryItems = categoriesRes.data?.length
    ? categoriesRes.data.map((cat) => ({
        label: cat.name,
        description: 'Browse category',
        href: `/finance/categories/${cat.slug}`,
        icon: 'grid',
      }))
    : productLinks;

  const loans = loansRes.data ?? [];
  const cards = cardsRes.data ?? [];
  const insurance = insuranceRes.data ?? [];
  const investments = investmentsRes.data ?? [];
  const rates = ratesRes.data ?? [];

  const featuredItems = [
    ...loans.slice(0, 2).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.bank?.name ? `${item.bank.name} · ${item.loanType}` : item.loanType,
      href: `/finance/loans/${item.id}`,
    })),
    ...cards.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.bank?.name ?? 'Credit card',
      href: `/finance/credit-cards/${item.id}`,
    })),
    ...insurance.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.providerName,
      href: `/finance/insurance/${item.id}`,
    })),
    ...investments.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.providerName,
      href: `/finance/investments/${item.id}`,
    })),
  ].slice(0, 3);

  const compareRows = loans.slice(0, 4).map((loan) => ({
    provider: loan.bank?.name ?? loan.name,
    rate: loan.interestRate != null ? `${loan.interestRate}%` : '—',
    fee: '—',
    tenure: loan.tenureMax != null ? `${loan.tenureMax} mo` : '—',
    href: `/finance/loans/${loan.id}`,
  }));

  const rateItems = rates.slice(0, 5).map((row) => ({
    label: row.productType || row.loan?.name || row.bank?.name || 'Rate',
    value: `${row.rate}%`,
    href: '/finance/rates',
  }));

  const guides = (guidesRes.data ?? []).slice(0, 6).map((g) => ({
    slug: g.slug,
    title: g.title,
    category: hubCategoryLabel(g.category),
    summary: g.summary,
    href: `/finance/guides/${g.slug}`,
    readMinutes: 5,
  }));

  const faqs = (faqsRes.data ?? []).slice(0, 8).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <ModuleHubShell
      moduleKey="finance"
      title={page.h1}
      description={page.intro}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Finance' }]}
      popularLinks={popularLinks}
      overviewTitle="Finance overview"
    >
      <section>
        <HubSectionHeader title="Popular finance calculators" viewAllHref="/calculators" />
        <HubIconGrid items={calculatorItems} columns={4} />
      </section>

      <section>
        <HubSectionHeader
          title="Explore financial products"
          viewAllHref="/finance/loans"
          viewAllLabel="View all products →"
        />
        <HubIconGrid items={categoryItems.length > 4 ? categoryItems : productLinks} columns={4} />
      </section>

      <section>
        <div className="grid gap-6 lg:grid-cols-3">
          {compareRows.length ? (
            <HubCompareTable
              title="Compare financial products"
              tabs={[
                { label: 'Home loans', href: '/finance/loans' },
                { label: 'Personal loans', href: '/finance/loans' },
                { label: 'Credit cards', href: '/finance/credit-cards' },
                { label: 'Insurance', href: '/finance/insurance' },
              ]}
              activeTab="Home loans"
              rows={compareRows}
              viewAllHref="/finance/compare"
            />
          ) : null}
          {rateItems.length ? (
            <HubRatesList
              title="Latest interest rates"
              items={rateItems}
              footer="Rates updated from published product data."
              viewAllHref="/finance/rates"
            />
          ) : null}
          {featuredItems.length ? (
            <HubFeaturedStack
              title="Featured financial products"
              items={featuredItems}
              viewAllHref="/finance/loans"
            />
          ) : null}
        </div>
      </section>

      <section>
        <HubSectionHeader title="Tools & planning" />
        <HubIconGrid items={toolLinks} columns={4} />
      </section>

      {guides?.length ? <HubGuideGrid items={guides} viewAllHref="/finance/guides" /> : null}

      <HubFaqSection faqs={faqs ?? []} viewAllHref="/finance/faqs" />
    </ModuleHubShell>
  );
}
