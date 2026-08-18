'use client';

import { formatInr } from '@/components/loans/loan-format';
import { useEducationLoanDecision } from '@/components/loans/education-loan-decision-context';

export function EducationLoanSnapshot() {
  const {
    totalCost,
    loanRequired,
    ownContribution,
    scholarship,
    courseYears,
    moratoriumMonths,
    repaymentYears,
    ratePercent,
    setRatePercent,
    studyInterest,
    emiAfterStudy,
  } = useEducationLoanDecision();

  return (
    <section
      id="el-snapshot"
      aria-labelledby="el-snapshot-heading"
      className="full-bleed bg-[var(--el-surface-3)]"
    >
      <div className="site-container el-section px-4">
        <h2 id="el-snapshot-heading" className="el-h2">
          Your Education Funding Snapshot
        </h2>
        <p className="el-lede">
          Planning outputs from your cost inputs and illustrative rate. Not a lender offer or
          government approval.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="el-metric-label">Total Education Cost</p>
            <p className="el-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
              {formatInr(totalCost)}
            </p>
          </div>
          <div>
            <p className="el-metric-label">Loan Required</p>
            <p className="el-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
              {formatInr(loanRequired)}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--el-border)] pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: 'Own Contribution', value: formatInr(ownContribution) },
            {
              label: 'Scholarship / Grant',
              value: scholarship > 0 ? formatInr(scholarship) : '—',
            },
            { label: 'Course Duration', value: `${courseYears} years` },
            {
              label: 'Moratorium (planner)',
              value: `${moratoriumMonths} months`,
            },
            {
              label: 'Est. Study-Period Interest',
              value: studyInterest ? formatInr(Math.round(studyInterest.interestDuringStudy)) : '—',
            },
            {
              label: 'Balance at EMI Start',
              value: studyInterest
                ? formatInr(Math.round(studyInterest.balanceAtRepaymentStart))
                : '—',
            },
            {
              label: 'Est. EMI After Study',
              value: emiAfterStudy ? `${formatInr(Math.round(emiAfterStudy.monthlyEmi))}/mo` : '—',
            },
            { label: 'Repayment Period', value: `${repaymentYears} years` },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--el-muted)]">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-[var(--el-navy)]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 max-w-xs">
          <label className="block text-xs font-semibold text-slate-700">
            Illustrative interest rate (% p.a.)
            <input
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={ratePercent}
              onChange={(e) => setRatePercent(Number(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
        </div>

        <p className="mt-5 text-xs text-[var(--el-muted)]">
          Government Support Status appears only after you use the Government Support Finder — never
          claimed as approved from this snapshot alone.
        </p>

        <div className="mt-6 border-t border-[var(--el-border)] pt-5">
          <a
            href="#el-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-5 text-sm font-semibold !text-white transition hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
          >
            Compare Education Loan Offers →
          </a>
        </div>
      </div>
    </section>
  );
}
