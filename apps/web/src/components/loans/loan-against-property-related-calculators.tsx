import Link from 'next/link';
import type { ContextualLink } from '@/lib/loan-contextual-links';

export function LoanAgainstPropertyRelatedCalculators({
  primary,
  secondary,
}: {
  primary: ContextualLink[];
  secondary: ContextualLink[];
}) {
  return (
    <div className="full-bleed bg-[var(--lap-surface-1)]">
      <div className="site-container lap-section px-4">
        <h2 className="lap-h2">Related Calculators</h2>
        <p className="lap-lede">
          Tools that support loan-against-property planning, LTV and repayment analysis.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {primary.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        {secondary.length ? (
          <ul className="mt-4 flex flex-wrap gap-3">
            {secondary.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lap-navy)] underline-offset-2 hover:underline"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
