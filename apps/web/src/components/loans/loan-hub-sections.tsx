import Link from 'next/link';
import { Suspense } from 'react';
import type { FinanceCategory, FinanceGuide } from '@/services/finance';
import { financeCompareLoansPath, calculatorHref } from '@/lib/finance-routes';
import { getHubModuleAssets } from '@/lib/hub-images';
import { LoanCategoryCard, splitLoanCategories } from '@/components/loans/loan-category-card';
import { LoanEmiCalculator } from '@/components/loans/loan-emi-calculator';
import { LoanRelatedCalculators } from '@/components/loans/loan-related-calculators';
import { LoanApplicationProcess } from '@/components/loans/loan-application-process';
import { LoanDocumentsSection } from '@/components/loans/loan-documents-section';
import { LoanCreditScoreSection } from '@/components/loans/loan-credit-score-section';
import { LoanCostExampleSection } from '@/components/loans/loan-cost-example-section';
import { LoanHubEducation } from '@/components/loans/loan-hub-education';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import { LoanTrustMethodologySection } from '@/components/loans/loan-trust-methodology-section';
import { LoanSectionBand } from '@/components/loans/loan-section-band';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';
import { buildLoanGuideCards } from '@/lib/loan-guides';
import type { LoanEducationModulesCms } from '@/lib/loan-hub-education';
import type { ArticleListItem } from '@/services/content';
import { BadgeCheck, FileSearch, Scale } from 'lucide-react';

const LEARN_CARDS = [
  {
    id: 'verify-terms',
    title: 'Always verify terms',
    body: 'Rates and fees can change. Use source links and last-verified dates where shown, then confirm the offer with the lender before you decide.',
    icon: BadgeCheck,
    href: '/disclaimer',
    linkLabel: 'Read disclaimer',
  },
  {
    id: 'compare-carefully',
    title: 'Compare more than rate',
    body: 'Look at processing fees, tenure, prepayment rules and eligibility together — the lowest headline rate is not always the lowest cost.',
    icon: Scale,
    href: '/finance/loans/methodology',
    linkLabel: 'How comparison works',
  },
  {
    id: 'documents-ready',
    title: 'Keep documents ready',
    body: 'KYC, income proof and bank statements are commonly requested. Having them organised can make applications smoother once you shortlist.',
    icon: FileSearch,
    href: '/finance/loans#documents',
    linkLabel: 'Typical documents',
  },
] as const;

export function LoanHubSections({
  categories,
  guides,
  articles = [],
  emiInitialAmount,
  emiInitialRate,
  emiInitialTenure,
  emiInitialTenureUnit,
  emiInitialTenureMonths,
  educationModules,
}: {
  categories: FinanceCategory[];
  guides: FinanceGuide[];
  articles?: ArticleListItem[];
  emiInitialAmount?: number;
  emiInitialRate?: number;
  emiInitialTenure?: number;
  emiInitialTenureUnit?: 'months' | 'years';
  /** @deprecated Prefer emiInitialTenure + emiInitialTenureUnit */
  emiInitialTenureMonths?: number;
  educationModules?: LoanEducationModulesCms | null;
}) {
  const assets = getHubModuleAssets('finance');
  const { primary, secondary } = splitLoanCategories(categories);
  const loanGuides = buildLoanGuideCards(articles, guides, 6);

  return (
    <>
      <LoanSectionBand tone="white" aria-labelledby="popular-categories-heading">
        <LoanSectionHeader
          id="popular-categories-heading"
          eyebrow="Popular loan categories"
          title="Explore loans by purpose"
          description="Compare financing options for personal expenses, homes, vehicles, education and more."
          action={{ href: '#types-of-loans', label: 'View all loan types →' }}
        />

        {primary.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {primary.map((cat) => (
              <LoanCategoryCard key={cat.id} category={cat} variant="primary" />
            ))}
          </div>
        ) : null}

        {secondary.length ? (
          <div
            className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${primary.length ? 'mt-4' : ''}`}
          >
            {secondary.map((cat) => (
              <LoanCategoryCard key={cat.id} category={cat} variant="secondary" />
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid items-center gap-5 rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-slate-200/70 sm:p-6 lg:grid-cols-[1fr_200px]">
          <div>
            <h3
              id="compare-popular-heading"
              className="text-lg font-extrabold tracking-tight text-[#0b1f3a] sm:text-xl"
            >
              Compare loans side by side
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Use Compare on product cards, then review interest ranges, fees, tenure and
              eligibility together.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={financeCompareLoansPath()}
                className="inline-flex min-h-10 items-center rounded-xl bg-[#0b1f3a] px-4 text-sm font-semibold hover:bg-[#122b4a]"
                style={{ color: '#ffffff' }}
              >
                Open comparison tool
              </Link>
              <Link
                href={calculatorHref('emi')}
                className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b1f3a] hover:border-[#0b1f3a]/35"
              >
                Estimate EMI first
              </Link>
            </div>
          </div>
          <img
            src={assets.overviewVisual}
            alt=""
            width={200}
            height={112}
            className="mx-auto hidden h-auto w-full max-w-[200px] opacity-90 lg:block"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </div>
      </LoanSectionBand>

      <LoanSectionBand tone="navy">
        <Suspense
          fallback={
            <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-500 ring-1 ring-slate-200/80">
              Loading EMI calculator…
            </div>
          }
        >
          <LoanEmiCalculator
            initialAmount={emiInitialAmount}
            initialRate={emiInitialRate}
            initialTenure={emiInitialTenure}
            initialTenureUnit={emiInitialTenureUnit}
            initialTenureMonths={emiInitialTenureMonths}
          />
        </Suspense>
      </LoanSectionBand>

      <LoanHubEducation categories={categories} educationModules={educationModules} />

      <LoanSectionBand tone="white" pad="compact">
        <div className="space-y-10">
          <LoanApplicationProcess />
          <LoanDocumentsSection />
        </div>
      </LoanSectionBand>

      <LoanSectionBand tone="muted" pad="compact">
        <div className="space-y-10">
          <LoanCreditScoreSection />
          <LoanCostExampleSection />
          <div aria-labelledby="learn-loans-heading">
            <LoanSectionHeader
              id="learn-loans-heading"
              title="Understand loans before you apply"
              description="Practical guidance — informational only, not personalised financial advice."
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {LEARN_CARDS.map((card) => (
                <article
                  key={card.id}
                  id={card.id}
                  className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/80"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8eef5] text-[#0b1f3a]">
                    <card.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-[#0b1f3a]">{card.title}</h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600">
                    {card.body}
                  </p>
                  <Link
                    href={card.href}
                    className="group mt-3 inline-flex items-center text-xs font-semibold text-[#0b1f3a] hover:text-[#f97316]"
                  >
                    {card.linkLabel}
                    <span
                      className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </LoanSectionBand>

      <LoanSectionBand tone="white">
        <LoanGuidesSection guides={loanGuides} />
      </LoanSectionBand>

      <LoanSectionBand tone="muted">
        <div className="space-y-10">
          <LoanRelatedCalculators />
          <LoanTrustMethodologySection />
          <nav aria-label="Related finance links">
            <h2 className="text-sm font-bold text-[#0b1f3a]">Explore more in Finance</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {[
                { href: '/finance', label: 'Finance hub' },
                { href: '/finance/rates', label: 'Interest rates' },
                { href: '/finance/banks', label: 'Banks & lenders' },
                { href: '/finance/eligibility', label: 'Eligibility' },
                { href: '/finance/credit-score', label: 'Credit score' },
                { href: '/finance/guides', label: 'Guides' },
                { href: '/finance/faqs', label: 'Finance FAQs' },
                { href: '/calculators', label: 'All calculators' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1f3a] ring-1 ring-slate-200/80 hover:text-[#f97316]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </LoanSectionBand>
    </>
  );
}
