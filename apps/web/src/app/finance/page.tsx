import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { FinanceProductCard } from '@/components/finance/finance-product-card';
import { RelatedArticles } from '@/components/finance/related-articles';
import {
  fetchFinanceCategories,
  fetchFinanceCreditCards,
  fetchFinanceDashboard,
  fetchFinanceInsurance,
  fetchFinanceInvestments,
  fetchFinanceLoans,
} from '@/services/finance';

export const metadata: Metadata = {
  title: 'Finance',
  description: 'Compare loans, credit cards, insurance, investments, and interest rates.',
  alternates: { canonical: '/finance' },
};

export const revalidate = 60;

const productLinks = [
  { label: 'Loans', href: '/finance/loans', description: 'Home, personal, and business loans.' },
  { label: 'Credit cards', href: '/finance/credit-cards', description: 'Rewards, cashback, and premium cards.' },
  { label: 'Insurance', href: '/finance/insurance', description: 'Health, life, and motor coverage.' },
  { label: 'Investments', href: '/finance/investments', description: 'Mutual funds, FDs, and more.' },
  { label: 'Banks', href: '/finance/banks', description: 'Partner banks and their products.' },
  { label: 'Interest rates', href: '/finance/rates', description: 'Latest benchmark and product rates.' },
  { label: 'Compare products', href: '/finance/compare', description: 'Side-by-side finance comparisons.' },
];

const resourceLinks = [
  { label: 'Guides', href: '/finance/guides', description: 'Educational finance guides.' },
  { label: 'FAQs', href: '/finance/faqs', description: 'Common questions answered.' },
  { label: 'Glossary', href: '/finance/glossary', description: 'Financial terms explained.' },
];

const toolLinks = [
  { label: 'Eligibility check', href: '/finance/eligibility', description: 'Quick loan eligibility estimate.' },
  { label: 'Credit score', href: '/finance/credit-score', description: 'Check your credit profile.' },
  { label: 'Portfolio', href: '/finance/portfolio', description: 'View your holdings.' },
  { label: 'Goals', href: '/finance/goals', description: 'Plan and track financial goals.' },
];

const calculatorLinks = [
  { label: 'EMI Calculator', href: '/calculators/emi' },
  { label: 'SIP Calculator', href: '/calculators/sip' },
  { label: 'Income Tax', href: '/calculators/income-tax' },
  { label: 'GST Calculator', href: '/calculators/gst' },
];

export default async function FinancePage() {
  const [dashboardRes, categoriesRes, loansRes, cardsRes, insuranceRes, investmentsRes] = await Promise.all([
    fetchFinanceDashboard(),
    fetchFinanceCategories(),
    fetchFinanceLoans({ featured: true, limit: 4 }),
    fetchFinanceCreditCards({ featured: true, limit: 4 }),
    fetchFinanceInsurance({ featured: true, limit: 4 }),
    fetchFinanceInvestments({ featured: true, limit: 4 }),
  ]);

  const categories = categoriesRes.data ?? [];
  const featured = [
    ...loansRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/loans/${item.id}`,
      description: item.bank?.name ? `${item.bank.name} · ${item.loanType}` : item.loanType,
      featured: item.featured,
    })),
    ...cardsRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/credit-cards/${item.id}`,
      description: item.bank?.name ?? 'Credit card',
      featured: item.featured,
    })),
    ...insuranceRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/insurance/${item.id}`,
      description: item.providerName,
      featured: item.featured,
    })),
    ...investmentsRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/investments/${item.id}`,
      description: item.providerName,
      featured: item.featured,
    })),
  ];

  return (
    <ContentLayout
      title="Finance"
      description="Loans, EMI, interest, tax, and investment tools to plan smarter."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Finance' }]}
    >
      {dashboardRes.data ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Loans', value: dashboardRes.data.loansPublished, href: '/finance/loans' },
            { label: 'Credit cards', value: dashboardRes.data.creditCardsPublished, href: '/finance/credit-cards' },
            { label: 'Insurance', value: dashboardRes.data.insurancePublished, href: '/finance/insurance' },
            { label: 'Investments', value: dashboardRes.data.investmentsPublished, href: '/finance/investments' },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">{stat.value}</div>
            </Link>
          ))}
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Browse products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Guides &amp; resources</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {toolLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {categories.length ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-[#0b1f3a]"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Featured products</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <FinanceProductCard
                key={item.id}
                name={item.name}
                href={item.href}
                description={item.description}
                featured={item.featured}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Calculators</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {calculatorLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <RelatedArticles />
    </ContentLayout>
  );
}
