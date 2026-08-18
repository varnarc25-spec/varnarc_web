import Link from 'next/link';
import type { ContextualLink } from '@/lib/loan-contextual-links';

export function GoldLoanRelatedCalculators({
  primary,
  secondary,
}: {
  primary: ContextualLink[];
  secondary: ContextualLink[];
}) {
  return (
    <div className="full-bleed bg-[var(--gl-surface-1)]">
      <div className="site-container gl-section px-4">
        <h2 className="gl-h2">Related Calculators</h2>
        <p className="gl-lede">Tools that support gold-loan planning and repayment analysis.</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {primary.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-4 text-sm font-semibold !text-white"
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
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
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
