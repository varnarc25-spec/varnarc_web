import Link from 'next/link';
import {
  Calculator,
  CalendarDays,
  GitCommitHorizontal,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ContextualLink } from '@/lib/loan-contextual-links';

const CARD_META: Array<{
  match: RegExp;
  description: string;
  icon: LucideIcon;
}> = [
  {
    match: /personal-loan-emi|emi/i,
    description: 'Estimate monthly EMI and total repayment.',
    icon: CalendarDays,
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
];

function metaFor(href: string, label: string) {
  const haystack = `${href} ${label}`;
  return (
    CARD_META.find((m) => m.match.test(haystack)) ?? {
      description: 'Open this calculator for Personal Loan planning.',
      icon: Calculator,
    }
  );
}

/**
 * Compact visual calculator cards for the Personal Loan decision page.
 */
export function PersonalLoanRelatedCalculators({ links }: { links: ContextualLink[] }) {
  if (!links.length) return null;

  const primary = links.slice(0, 3);
  const secondary = links.slice(3);

  return (
    <section id="related-calculators" aria-labelledby="pl-related-calculators-heading">
      <h2 id="pl-related-calculators-heading" className="pl-h2">
        Related Calculators
      </h2>
      <p className="pl-lede">
        Prioritised tools for Personal Loan EMI, eligibility and prepayment. Estimates only — not
        lender approvals.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {primary.map((link) => {
          const meta = metaFor(link.href, link.label);
          const Icon = meta.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex h-full flex-col rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-2)] p-4 transition hover:bg-white hover:shadow-[0_1px_0_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--pl-radius-sm)] bg-[var(--pl-navy)] text-white">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug text-[var(--pl-navy)]">
                  {link.label}
                </p>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--pl-muted)]">
                  {meta.description}
                </p>
                <span className="mt-3 text-sm font-semibold text-[var(--pl-navy)] transition group-hover:text-[var(--pl-orange)] group-hover:translate-x-0.5 motion-reduce:transform-none">
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
                className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-[var(--pl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
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
