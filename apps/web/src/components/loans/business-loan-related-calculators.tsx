import Link from 'next/link';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import {
  BUSINESS_LOAN_RELATED_CALCULATORS,
  BUSINESS_LOAN_RELATED_SECONDARY,
} from '@/lib/business-loan-page';

function CalcCard({ link }: { link: ContextualLink }) {
  return (
    <li className="min-w-0">
      <Link
        href={link.href}
        className="flex h-full flex-col rounded-[var(--bl-radius-md)] bg-white p-4 ring-1 ring-[var(--bl-border)] transition hover:ring-[var(--bl-navy)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
      >
        <p className="text-sm font-bold text-[var(--bl-navy)]">{link.label}</p>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--bl-muted)]">
          Open calculator →
        </p>
      </Link>
    </li>
  );
}

export function BusinessLoanRelatedCalculators({
  primary = BUSINESS_LOAN_RELATED_CALCULATORS,
  secondary = BUSINESS_LOAN_RELATED_SECONDARY,
}: {
  primary?: ContextualLink[];
  secondary?: ContextualLink[];
}) {
  return (
    <section
      id="bl-related-calculators"
      aria-labelledby="bl-related-calculators-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <h2 id="bl-related-calculators-heading" className="bl-h2">
          Related Calculators
        </h2>
        <p className="bl-lede">Plan EMI, eligibility, DSCR and cash flow with dedicated tools.</p>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((link) => (
            <CalcCard key={link.href + link.label} link={link} />
          ))}
        </ul>
        {secondary.length ? (
          <>
            <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Also useful
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {secondary.map((link) => (
                <CalcCard key={link.href + link.label} link={link} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
