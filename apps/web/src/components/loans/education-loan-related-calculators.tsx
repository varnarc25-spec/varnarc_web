import Link from 'next/link';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import {
  EDUCATION_LOAN_RELATED_CALCULATORS,
  EDUCATION_LOAN_RELATED_SECONDARY,
} from '@/lib/education-loan-page';

function CalcCard({ link }: { link: ContextualLink }) {
  return (
    <li className="min-w-0">
      <Link
        href={link.href}
        className="flex h-full flex-col rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)] transition hover:ring-[var(--el-navy)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
      >
        <p className="text-sm font-bold text-[var(--el-navy)]">{link.label}</p>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--el-muted)]">
          Open calculator →
        </p>
      </Link>
    </li>
  );
}

export function EducationLoanRelatedCalculators({
  primary = EDUCATION_LOAN_RELATED_CALCULATORS,
  secondary = EDUCATION_LOAN_RELATED_SECONDARY,
}: {
  primary?: ContextualLink[];
  secondary?: ContextualLink[];
}) {
  return (
    <section
      id="el-related-calculators"
      aria-labelledby="el-related-calculators-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <h2 id="el-related-calculators-heading" className="el-h2">
          Related Calculators
        </h2>
        <p className="el-lede">Plan EMI, eligibility and prepayment with dedicated tools.</p>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {primary.map((link) => (
            <CalcCard key={link.href + link.label} link={link} />
          ))}
        </ul>
        {secondary.length ? (
          <>
            <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
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
