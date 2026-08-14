import Link from 'next/link';
import type { ReactNode } from 'react';
import type { FinanceCategory } from '@/services/finance';
import { ContextualLinkList } from '@/components/loans/contextual-link-list';
import { LoanSectionBand } from '@/components/loans/loan-section-band';
import { HubIcon } from '@/components/hub/hub-icons';
import {
  COMPARE_COST_CHECKS,
  ELIGIBILITY_STEPS,
  FEE_ROWS,
  INTEREST_FLOW,
  MISTAKE_ITEMS,
  PREPAY_ITEMS,
  RATE_FACTOR_CARDS,
  SECURED_ROWS,
  TENURE_COMPARE,
  mergeLoanEducationModules,
  type LoanEducationModuleBase,
  type LoanEducationModuleId,
  type LoanEducationModulesCms,
} from '@/lib/loan-hub-education';
import { contextualLinksForSection } from '@/lib/loan-contextual-links';
import { loanCategoryPath } from '@/lib/finance-routes';
import { loanCategoryIcon } from '@/lib/loan-category-icons';
import {
  Anchor,
  BadgeCheck,
  Briefcase,
  Calculator,
  CircleAlert,
  CreditCard,
  FileWarning,
  Landmark,
  Scale,
  Shield,
  Timer,
  Waves,
  type LucideIcon,
} from 'lucide-react';

const RATE_ICONS: LucideIcon[] = [CreditCard, Briefcase, Scale, Timer, Shield, Landmark];

const COMPARE_ICONS: LucideIcon[] = [
  Calculator,
  FileWarning,
  BadgeCheck,
  Timer,
  CircleAlert,
  Scale,
];

function SectionShell({
  id,
  module,
  children,
}: {
  id: string;
  module: LoanEducationModuleBase;
  children: ReactNode;
}) {
  const related = contextualLinksForSection(module.id);

  return (
    <div id={id} aria-labelledby={`${id}-heading`} className="min-w-0">
      <div className="max-w-2xl">
        <h3
          id={`${id}-heading`}
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          {module.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{module.summary}</p>
      </div>
      <div className="mt-5">{children}</div>
      {module.guideHref || related.length ? (
        <div className="mt-4 space-y-2">
          {related.length ? (
            <ContextualLinkList links={related} label="Related tools & guides" />
          ) : null}
          {module.guideHref ? (
            <Link
              href={module.guideHref}
              className="group inline-flex text-sm font-semibold text-[#0b1f3a] hover:text-[#f97316]"
            >
              Read full guide
              <span
                className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden
              >
                →
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Compact icon grid — links into category landings. */
function TypesOfLoans({
  module,
  categories,
}: {
  module: LoanEducationModuleBase;
  categories: FinanceCategory[];
}) {
  const cards = categories.slice(0, 8);
  return (
    <SectionShell id="types-of-loans" module={module}>
      {cards.length ? (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((cat) => (
            <li key={cat.id}>
              <Link
                href={loanCategoryPath(cat.slug)}
                className="group flex h-full flex-col rounded-xl bg-white p-3.5 ring-1 ring-slate-200/80 transition hover:ring-[#0b1f3a]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8eef5] text-[#0b1f3a] transition group-hover:bg-[#0b1f3a] group-hover:text-white">
                  <HubIcon name={loanCategoryIcon(cat.slug)} className="h-4 w-4" />
                </span>
                <span className="mt-2.5 text-sm font-bold text-[#0b1f3a] group-hover:text-[#f97316]">
                  {cat.name}
                </span>
                <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                  {cat.shortDescription?.trim() || 'Explore products in this category.'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">Loan categories will appear here when published.</p>
      )}
    </SectionShell>
  );
}

/** Visual flow diagram. */
function HowInterestWorks({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="how-interest-works" module={module}>
      <ol
        className="relative flex flex-col gap-0 sm:flex-row sm:items-stretch sm:gap-0"
        aria-label="From loan inputs to repayment"
      >
        {INTEREST_FLOW.map((step, index) => {
          const isLast = index === INTEREST_FLOW.length - 1;
          return (
            <li key={step} className="relative flex flex-1 flex-col sm:items-center sm:px-1">
              <div
                className={`relative z-[1] flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold sm:w-full sm:flex-col sm:gap-2 sm:py-4 sm:text-center ${
                  isLast
                    ? 'bg-[#0b1f3a] text-white'
                    : 'bg-white text-[#0b1f3a] ring-1 ring-slate-200/80'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isLast ? 'bg-[#f97316] text-white' : 'bg-[#e8eef5] text-[#0b1f3a]'
                  }`}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
              {!isLast ? (
                <>
                  <span
                    className="mx-auto my-1 block h-4 w-px bg-slate-200 sm:hidden"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute left-[calc(50%+0.5rem)] top-1/2 hidden h-px w-[calc(100%-1rem)] -translate-y-1/2 bg-slate-200 sm:block"
                    aria-hidden
                  />
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-600">
        Illustrative reducing-balance pattern: early EMIs are interest-heavy; later EMIs repay more
        principal. Use the EMI calculator to model your own inputs.
      </p>
    </SectionShell>
  );
}

/** Icon cards. */
function RateFactors({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="what-affects-rate" module={module}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RATE_FACTOR_CARDS.map((card, index) => {
          const Icon = RATE_ICONS[index % RATE_ICONS.length]!;
          return (
            <li
              key={card.title}
              className="flex gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/80"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8eef5] text-[#0b1f3a]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0b1f3a]">{card.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{card.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

/** Compact definition table. */
function FeesAndCharges({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="loan-fees" module={module}>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
        <ul className="divide-y divide-slate-100 md:hidden">
          {FEE_ROWS.map((row) => (
            <li key={row.fee} className="px-4 py-3.5">
              <h4 className="text-sm font-bold text-[#0b1f3a]">{row.fee}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{row.meaning}</p>
            </li>
          ))}
        </ul>
        <table className="hidden w-full border-collapse text-left text-sm md:table">
          <caption className="sr-only">Common loan fees and what they mean</caption>
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Fee</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">What it means</th>
            </tr>
          </thead>
          <tbody>
            {FEE_ROWS.map((row) => (
              <tr key={row.fee} className="border-t border-slate-100">
                <td className="px-4 py-3 align-top font-semibold text-[#0b1f3a]">{row.fee}</td>
                <td className="px-4 py-3 align-top text-xs leading-relaxed text-slate-600">
                  {row.meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

/** Numbered horizontal stepper. */
function Eligibility({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="how-eligibility-works" module={module}>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ELIGIBILITY_STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-xl bg-[#f8fafc] p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white"
              aria-hidden
            >
              {index + 1}
            </span>
            <h4 className="mt-3 text-sm font-bold text-[#0b1f3a]">{step.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

/** Comparison table. */
function SecuredVsUnsecured({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="secured-vs-unsecured" module={module}>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
        <ul className="divide-y divide-slate-100 md:hidden">
          {SECURED_ROWS.map((row) => (
            <li key={row.label} className="px-4 py-3.5">
              <h4 className="text-sm font-bold text-[#0b1f3a]">{row.label}</h4>
              <dl className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] font-semibold text-[#f97316]">Secured</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{row.secured}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-slate-500">Unsecured</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{row.unsecured}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <table className="hidden w-full min-w-[32rem] border-collapse text-left text-sm md:table">
          <caption className="sr-only">Secured versus unsecured loan comparison</caption>
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Factor</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-[#f97316]">Secured</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Unsecured</th>
            </tr>
          </thead>
          <tbody>
            {SECURED_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-4 py-3 align-top font-semibold text-[#0b1f3a]">{row.label}</td>
                <td className="px-4 py-3 align-top text-xs leading-relaxed text-slate-600">
                  {row.secured}
                </td>
                <td className="px-4 py-3 align-top text-xs leading-relaxed text-slate-600">
                  {row.unsecured}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

/** Two-column comparison. */
function FixedVsFloating({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="fixed-vs-floating" module={module}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-xl bg-[#e8eef5]/50 p-5 ring-1 ring-slate-200/60">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0b1f3a] ring-1 ring-slate-200/80">
            <Anchor className="h-5 w-5" aria-hidden />
          </span>
          <h4 className="mt-3 text-base font-bold text-[#0b1f3a]">Fixed</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Rate stays set for the applicable period in the loan terms. Confirm how long that period
            lasts and what happens afterward.
          </p>
        </article>
        <article className="rounded-xl bg-[#fff7ed]/60 p-5 ring-1 ring-[#f97316]/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#f97316] ring-1 ring-[#f97316]/25">
            <Waves className="h-5 w-5" aria-hidden />
          </span>
          <h4 className="mt-3 text-base font-bold text-[#0b1f3a]">Floating</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Rate can move with benchmark or lender reset rules. EMI or tenure may change when the
            rate resets.
          </p>
        </article>
      </div>
    </SectionShell>
  );
}

/** Visual trade-off bars. */
function TenureAndCost({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="tenure-and-cost" module={module}>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Tenure versus EMI and interest trade-off"
      >
        {TENURE_COMPARE.map((col, index) => {
          const shorter = index === 0;
          return (
            <div key={col.label} className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
              <p className="text-sm font-bold text-[#0b1f3a]">{col.label}</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>EMI</span>
                    <span className="text-[#0b1f3a]">{col.emi}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0b1f3a]"
                      style={{ width: shorter ? '78%' : '42%' }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Total interest</span>
                    <span className="text-[#0b1f3a]">{col.interest}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#f97316]"
                      style={{ width: shorter ? '38%' : '82%' }}
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-slate-500">
        Bars are illustrative of the trade-off direction only — not product-specific figures.
      </p>
    </SectionShell>
  );
}

/** Checklist icon cards. */
function CompareTotalCost({ module }: { module: LoanEducationModuleBase }) {
  return (
    <SectionShell id="compare-total-cost" module={module}>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPARE_COST_CHECKS.map((item, index) => {
          const Icon = COMPARE_ICONS[index % COMPARE_ICONS.length]!;
          return (
            <li key={item.title} className="flex gap-3 rounded-xl bg-[#f8fafc] px-3.5 py-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0b1f3a] ring-1 ring-slate-200/80">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0b1f3a]">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

/** Accordion — large hit targets. */
function AccordionSection({
  id,
  module,
  items,
}: {
  id: string;
  module: LoanEducationModuleBase;
  items: ReadonlyArray<{ title: string; body: string }>;
}) {
  return (
    <SectionShell id={id} module={module}>
      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.title}
            className="group rounded-xl bg-white ring-1 ring-slate-200/80 open:ring-[#0b1f3a]/20"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 py-3.5 text-sm font-bold text-[#0b1f3a] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex w-full items-center justify-between gap-3">
                {item.title}
                <span
                  className="text-lg leading-none text-slate-400 transition group-open:rotate-45 motion-reduce:transition-none"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>
            <p className="max-w-prose border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
              {item.body}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

const SECTION_ORDER: LoanEducationModuleId[] = [
  'typesOfLoans',
  'howInterestWorks',
  'rateFactors',
  'feesAndCharges',
  'eligibility',
  'securedVsUnsecured',
  'fixedVsFloating',
  'tenureAndCost',
  'compareTotalCost',
  'prepayment',
  'mistakes',
];

export function LoanHubEducation({
  categories,
  educationModules,
}: {
  categories: FinanceCategory[];
  educationModules?: LoanEducationModulesCms | null;
}) {
  const modules = mergeLoanEducationModules(educationModules);

  return (
    <>
      {SECTION_ORDER.map((id, index) => {
        const module = modules[id];
        const tone = index % 2 === 0 ? 'muted' : 'white';
        let body: ReactNode = null;
        switch (id) {
          case 'typesOfLoans':
            body = <TypesOfLoans module={module} categories={categories} />;
            break;
          case 'howInterestWorks':
            body = <HowInterestWorks module={module} />;
            break;
          case 'rateFactors':
            body = <RateFactors module={module} />;
            break;
          case 'feesAndCharges':
            body = <FeesAndCharges module={module} />;
            break;
          case 'eligibility':
            body = <Eligibility module={module} />;
            break;
          case 'securedVsUnsecured':
            body = <SecuredVsUnsecured module={module} />;
            break;
          case 'fixedVsFloating':
            body = <FixedVsFloating module={module} />;
            break;
          case 'tenureAndCost':
            body = <TenureAndCost module={module} />;
            break;
          case 'compareTotalCost':
            body = <CompareTotalCost module={module} />;
            break;
          case 'prepayment':
            body = <AccordionSection id="prepayment" module={module} items={PREPAY_ITEMS} />;
            break;
          case 'mistakes':
            body = <AccordionSection id="loan-mistakes" module={module} items={MISTAKE_ITEMS} />;
            break;
          default:
            body = null;
        }
        if (!body) return null;
        return (
          <LoanSectionBand key={id} tone={tone} pad="compact">
            {index === 0 ? (
              <div className="mb-8 max-w-2xl" aria-labelledby="learn-before-heading">
                <h2
                  id="learn-before-heading"
                  className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
                >
                  Learn before you borrow
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Short explainers — informational only, not personalised advice. Open a full guide
                  for more depth.
                </p>
              </div>
            ) : null}
            {body}
          </LoanSectionBand>
        );
      })}
    </>
  );
}
