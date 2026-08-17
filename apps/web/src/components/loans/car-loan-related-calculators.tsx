import Link from 'next/link';
import {
  Calculator,
  Car,
  GitCommitHorizontal,
  Percent,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { CAR_LOAN_RELATED_SECONDARY } from '@/lib/car-loan-page';

const CARD_META: Array<{
  match: RegExp;
  description: string;
  icon: LucideIcon;
}> = [
  {
    match: /car-loan|car.+emi/i,
    description: 'Estimate monthly EMI and total repayment for your car loan.',
    icon: Car,
  },
  {
    match: /affordability|snapshot/i,
    description: 'Estimate an illustrative vehicle budget from income and down payment.',
    icon: Car,
  },
  {
    match: /emi-rate-compare|interest rate/i,
    description: 'Compare how interest rate changes EMI and total cost.',
    icon: Percent,
  },
  {
    match: /eligibility/i,
    description: 'Estimate an indicative borrowing range from income and commitments.',
    icon: UserRound,
  },
  {
    match: /prepayment/i,
    description: 'See how an additional payment may affect interest or tenure.',
    icon: GitCommitHorizontal,
  },
  {
    match: /debt|dti/i,
    description: 'Evaluate your debt-to-income ratio and borrowing capacity.',
    icon: Percent,
  },
  {
    match: /down.?payment/i,
    description: 'See how down payment changes loan amount and EMI.',
    icon: Percent,
  },
];

function metaFor(href: string, label: string) {
  const haystack = `${href} ${label}`;
  return (
    CARD_META.find((m) => m.match.test(haystack)) ?? {
      description: 'Open this calculator for Car Loan planning.',
      icon: Calculator,
    }
  );
}

export function CarLoanRelatedCalculators({ links }: { links: ContextualLink[] }) {
  if (!links.length) return null;

  const primary = links.slice(0, 4);
  const secondaryFromLinks = links.slice(4);
  const secondary = secondaryFromLinks.length ? secondaryFromLinks : CAR_LOAN_RELATED_SECONDARY;

  return (
    <section id="car-loan-related-calculators" aria-labelledby="cl-related-calculators-heading">
      <h2 id="cl-related-calculators-heading" className="cl-h2">
        Related Calculators
      </h2>
      <p className="cl-lede">
        Prioritised tools for Car Loan EMI, eligibility and prepayment. Estimates only — not lender
        approvals.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((link) => {
          const meta = metaFor(link.href, link.label);
          const Icon = meta.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex h-full flex-col bg-[var(--cl-surface-2)] p-4 transition duration-150 hover:bg-[var(--cl-surface-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] motion-reduce:transition-none"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--cl-radius-sm)] bg-[var(--cl-navy)] text-white">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug text-[var(--cl-navy)]">
                  {link.label}
                </p>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--cl-muted)]">
                  {meta.description}
                </p>
                <span className="mt-3 text-sm font-semibold text-[var(--cl-navy)] transition duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--cl-orange)] motion-reduce:transform-none motion-reduce:transition-none">
                  Calculate →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {secondary.length ? (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {secondary.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
              >
                {link.label} →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
