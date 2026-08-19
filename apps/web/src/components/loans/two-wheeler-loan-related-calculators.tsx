import Link from 'next/link';
import { Calculator, type LucideIcon } from 'lucide-react';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { TW_RELATED_SECONDARY } from '@/lib/two-wheeler-loan-page';

export function TwoWheelerLoanRelatedCalculators({ links }: { links: ContextualLink[] }) {
  if (!links.length) return null;

  const primary = links.slice(0, 4);
  const secondaryFromLinks = links.slice(4);
  const secondary = secondaryFromLinks.length ? secondaryFromLinks : TW_RELATED_SECONDARY;

  return (
    <section id="tw-related-calculators" aria-labelledby="tw-related-calculators-heading">
      <h2 id="tw-related-calculators-heading" className="cl-h2 text-[var(--tw-navy)]">
        Related Calculators
      </h2>
      <p className="cl-lede text-[var(--tw-muted)]">
        Tools for Two-Wheeler Loan EMI, eligibility and prepayment. Estimates only — not lender approvals.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex h-full flex-col bg-[var(--tw-surface-2)] p-4 transition duration-150 hover:bg-[var(--tw-surface-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] motion-reduce:transition-none"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--tw-radius-sm)] bg-[var(--tw-navy)] text-white">
                <Calculator className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <p className="mt-3 text-sm font-bold leading-snug text-[var(--tw-navy)]">
                {link.label}
              </p>
              <span className="mt-3 text-sm font-semibold text-[var(--tw-navy)] transition duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--tw-orange)] motion-reduce:transform-none motion-reduce:transition-none">
                Calculate →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {secondary.length ? (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {secondary.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-[var(--tw-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
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
