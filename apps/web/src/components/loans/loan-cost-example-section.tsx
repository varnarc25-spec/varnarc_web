import Link from 'next/link';
import { calculateEmi } from '@/lib/emi';

/** Illustrative demo inputs — results always come from `calculateEmi`. */
const EXAMPLE = {
  principal: 5_00_000,
  annualRatePercent: 10.5,
  tenureYears: 5,
} as const;

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function LoanCostExampleSection() {
  const tenureMonths = EXAMPLE.tenureYears * 12;
  const result = calculateEmi({
    principal: EXAMPLE.principal,
    annualRatePercent: EXAMPLE.annualRatePercent,
    tenureMonths,
  });

  if (!result) return null;

  const principalPct = (result.principal / result.totalRepayment) * 100;
  const interestPct = (result.totalInterest / result.totalRepayment) * 100;

  return (
    <section id="what-loan-costs" aria-labelledby="what-loan-costs-heading">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="what-loan-costs-heading"
            className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
          >
            What Does a Loan Actually Cost?
          </h2>
          <span className="rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-xs font-semibold text-[#ea580c] ring-1 ring-[#f97316]/25">
            Illustrative
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Same reducing-balance EMI formula used elsewhere on Varnarc. Not an offer or approval.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h3 className="text-xs font-semibold text-slate-500">Example inputs</h3>
          <dl className="mt-2.5 space-y-2.5 rounded-xl bg-[#f8fafc] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-slate-600">Loan amount</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0b1f3a]">
                {formatInr(EXAMPLE.principal)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-slate-600">Interest rate</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0b1f3a]">
                {EXAMPLE.annualRatePercent}% p.a.
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-slate-600">Tenure</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0b1f3a]">
                {EXAMPLE.tenureYears} years ({tenureMonths} months)
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500">Calculated results</h3>
          <dl className="mt-2.5 space-y-2.5">
            <div className="rounded-xl bg-white px-4 py-3.5 ring-1 ring-slate-200/70">
              <dt className="text-xs font-medium text-slate-500">Monthly EMI</dt>
              <dd className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
                {formatInr(result.monthlyEmi)}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <dt className="text-xs font-medium text-slate-500">Total interest</dt>
                <dd className="mt-0.5 text-base font-bold tabular-nums text-[#0b1f3a]">
                  {formatInr(result.totalInterest)}
                </dd>
              </div>
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <dt className="text-xs font-medium text-slate-500">Total repayment</dt>
                <dd className="mt-0.5 text-base font-bold tabular-nums text-[#0b1f3a]">
                  {formatInr(result.totalRepayment)}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs font-semibold text-[#0b1f3a]">Principal vs interest</p>
            <div
              className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`Of total repayment, principal is about ${principalPct.toFixed(0)} percent and interest is about ${interestPct.toFixed(0)} percent.`}
            >
              <div
                className="bg-[#0b1f3a]"
                style={{ width: `${principalPct}%` }}
                title={`Principal ${formatInr(result.principal)}`}
              />
              <div
                className="bg-[#f97316]"
                style={{ width: `${interestPct}%` }}
                title={`Interest ${formatInr(result.totalInterest)}`}
              />
            </div>
            <ul className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
              <li className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" aria-hidden />
                Principal {formatInr(result.principal)} ({principalPct.toFixed(0)}%)
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" aria-hidden />
                Interest {formatInr(result.totalInterest)} ({interestPct.toFixed(0)}%)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Link
        href="#loan-emi-calculator-heading"
        className="group mt-4 inline-flex text-sm font-semibold text-[#0b1f3a] hover:text-[#f97316]"
      >
        Calculate with your own numbers
        <span
          className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          aria-hidden
        >
          →
        </span>
      </Link>
    </section>
  );
}
