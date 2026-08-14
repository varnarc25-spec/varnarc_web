import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Car,
  Home,
  Percent,
  Scale,
  UserCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { calculatorHref, financeGuidesPath, type KnownCalculatorSlug } from '@/lib/finance-routes';

const PRIMARY: Array<{
  id: string;
  name: string;
  description: string;
  slug: KnownCalculatorSlug;
  icon: LucideIcon;
}> = [
  {
    id: 'emi',
    name: 'EMI Calculator',
    description: 'Estimate monthly repayment.',
    slug: 'emi',
    icon: Calculator,
  },
  {
    id: 'loan-eligibility',
    name: 'Loan Eligibility Calculator',
    description: 'Estimate an indicative borrowing range based on income and commitments.',
    slug: 'loan-eligibility',
    icon: UserCheck,
  },
  {
    id: 'loan-prepayment',
    name: 'Loan Prepayment Calculator',
    description: 'Estimate potential interest or tenure savings.',
    slug: 'loan-prepayment',
    icon: Percent,
  },
];

const SECONDARY: Array<{
  id: string;
  name: string;
  slug: KnownCalculatorSlug;
  icon: LucideIcon;
}> = [
  {
    id: 'personal-loan-emi',
    name: 'Personal Loan EMI',
    slug: 'personal-loan-emi',
    icon: Wallet,
  },
  {
    id: 'home-loan-emi',
    name: 'Home Loan EMI',
    slug: 'home-loan-emi',
    icon: Home,
  },
  {
    id: 'car-loan-emi',
    name: 'Car Loan EMI',
    slug: 'car-loan',
    icon: Car,
  },
  {
    id: 'education-loan-emi',
    name: 'Education Loan EMI',
    slug: 'education-loan-emi',
    icon: BookOpen,
  },
  {
    id: 'debt-planner',
    name: 'Debt Planner',
    slug: 'debt-planner',
    icon: Scale,
  },
];

export function LoanRelatedCalculators() {
  return (
    <section
      id="related-calculators"
      aria-labelledby="related-calculators-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 bg-linear-to-br from-[#f8fafc] via-white to-[#fff7ed] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="related-calculators-heading"
              className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
            >
              Related Calculators
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Illustrative estimates only — not official lender decisions or approvals.
            </p>
          </div>
          <Link href="/calculators" className="text-sm font-semibold text-blue-700 hover:underline">
            Browse all calculators →
          </Link>
        </div>
      </div>

      <ul className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {PRIMARY.map((calc) => (
          <li key={calc.id}>
            <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-[#f8fafc]/70 p-4 transition hover:border-[#f97316]/50 hover:bg-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8eef5] text-[#0b1f3a]">
                <calc.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-[#0b1f3a]">{calc.name}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600">
                {calc.description}
              </p>
              <Link
                href={calculatorHref(calc.slug)}
                className="mt-4 inline-flex min-h-11 w-fit items-center rounded-lg bg-[#0b1f3a] px-3.5 text-xs font-semibold hover:bg-[#122b4a]"
                style={{ color: '#ffffff' }}
              >
                Calculate →
              </Link>
            </article>
          </li>
        ))}
      </ul>

      <nav
        aria-label="More loan calculators"
        className="border-t border-slate-100 px-5 py-4 sm:px-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">More tools</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY.map((calc) => (
            <li key={calc.id}>
              <Link
                href={calculatorHref(calc.slug)}
                className="group flex min-h-11 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0b1f3a] transition hover:border-[#f97316]/50 hover:text-[#f97316]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4eb] text-[#f97316]">
                  <calc.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 leading-snug">{calc.name}</span>
                <span className="text-xs text-slate-400 group-hover:text-[#f97316]" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Looking for planning tips?{' '}
          <Link href={financeGuidesPath()} className="font-semibold text-blue-700 hover:underline">
            Browse loan guides
          </Link>
          .
        </p>
      </nav>
    </section>
  );
}
