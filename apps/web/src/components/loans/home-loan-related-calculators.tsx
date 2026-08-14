import Link from 'next/link';
import {
  Calculator,
  GitCommitHorizontal,
  Home,
  IndianRupee,
  Percent,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { HOME_LOAN_RELATED_SECONDARY } from '@/lib/home-loan-page';

const CARD_META: Array<{
  match: RegExp;
  description: string;
  icon: LucideIcon;
}> = [
  {
    match: /home-loan-emi|emi/i,
    description: 'Estimate monthly EMI and total repayment for your home loan.',
    icon: Calculator,
  },
  {
    match: /afford/i,
    description: 'Estimate an indicative property budget from income and down payment.',
    icon: Wallet,
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
    match: /down.?payment/i,
    description: 'See how down payment changes loan amount and EMI.',
    icon: Percent,
  },
  {
    match: /ltv/i,
    description: 'Understand loan-to-value from property value and equity.',
    icon: Home,
  },
  {
    match: /balance.?transfer/i,
    description: 'Compare current and proposed rates for a possible transfer.',
    icon: IndianRupee,
  },
];

function metaFor(href: string, label: string) {
  const haystack = `${href} ${label}`;
  return (
    CARD_META.find((m) => m.match.test(haystack)) ?? {
      description: 'Open this calculator for Home Loan planning.',
      icon: Calculator,
    }
  );
}

/**
 * Compact visual calculator cards for the Home Loan decision page.
 */
export function HomeLoanRelatedCalculators({ links }: { links: ContextualLink[] }) {
  if (!links.length) return null;

  const primary = links.slice(0, 4);
  const secondaryFromLinks = links.slice(4);
  const secondary = secondaryFromLinks.length ? secondaryFromLinks : HOME_LOAN_RELATED_SECONDARY;

  return (
    <section id="home-loan-related-calculators" aria-labelledby="hl-related-calculators-heading">
      <h2 id="hl-related-calculators-heading" className="hl-h2">
        Related Calculators
      </h2>
      <p className="hl-lede">
        Prioritised tools for Home Loan EMI, affordability, eligibility and prepayment. Estimates
        only — not lender approvals.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((link) => {
          const meta = metaFor(link.href, link.label);
          const Icon = meta.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex h-full flex-col bg-[var(--hl-surface-2)] p-4 transition duration-150 hover:bg-[var(--hl-surface-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] motion-reduce:transition-none"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--hl-radius-sm)] bg-[var(--hl-navy)] text-white">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug text-[var(--hl-navy)]">
                  {link.label}
                </p>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--hl-muted)]">
                  {meta.description}
                </p>
                <span className="mt-3 text-sm font-semibold text-[var(--hl-navy)] transition duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--hl-orange)] motion-reduce:transform-none motion-reduce:transition-none">
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
                className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
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
