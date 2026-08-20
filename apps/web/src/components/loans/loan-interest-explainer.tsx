import Link from 'next/link';

const TERMS = [
  {
    term: 'Principal',
    definition:
      'The amount you borrow. This is the starting balance the lender expects you to repay.',
  },
  {
    term: 'Annual interest rate',
    definition:
      'The yearly cost of borrowing, shown as a percentage. Lenders usually convert this into a monthly rate for EMI math.',
  },
  {
    term: 'Tenure',
    definition:
      'How long you take to repay — in months or years. Longer tenures often lower EMI but can raise total interest.',
  },
  {
    term: 'EMI',
    definition:
      'Equated Monthly Instalment — the fixed (or scheduled) amount you pay each month toward the loan.',
  },
  {
    term: 'Total interest',
    definition:
      'What you pay above the principal over the full tenure. Compare this, not only the headline rate.',
  },
] as const;

const FLOW_STEPS = [
  'Loan amount',
  'Interest rate',
  'Loan tenure',
  'Monthly EMI',
  'Total repayment',
] as const;

/** Illustrative early → late EMI split for a typical amortizing (reducing-balance) loan. */
const AMORT_BARS = [
  { label: 'Early EMI', interest: 72, principal: 28 },
  { label: 'Mid tenure', interest: 48, principal: 52 },
  { label: 'Later EMI', interest: 22, principal: 78 },
] as const;

function FlowDiagram() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      role="group"
      aria-labelledby="interest-flow-heading"
    >
      <h3 id="interest-flow-heading" className="text-sm font-extrabold text-[#0b1f3a]">
        From loan inputs to repayment
      </h3>
      <p className="sr-only">
        Visual flow: Loan amount leads to Interest rate, then Loan tenure, then Monthly EMI, then
        Total repayment.
      </p>
      <ol className="mt-4 flex flex-col gap-0">
        {FLOW_STEPS.map((step, index) => {
          const isLast = index === FLOW_STEPS.length - 1;
          return (
            <li key={step} className="relative flex flex-col items-stretch">
              <div
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                  isLast
                    ? 'border-[#f97316]/40 bg-[#fff7ed] text-[#0b1f3a]'
                    : 'border-slate-200 bg-[#f8fafc] text-[#0b1f3a]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isLast ? 'bg-[#f97316] text-white' : 'bg-[#0b1f3a] text-white'
                  }`}
                  style={{ color: '#ffffff' }}
                  aria-hidden
                >
                  {index + 1}
                </span>
                {step}
              </div>
              {!isLast ? (
                <div className="flex justify-center py-1" aria-hidden>
                  <span className="text-sm font-bold text-slate-400">↓</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AmortizationIllustration() {
  return (
    <div
      className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      role="group"
      aria-labelledby="amort-illustration-heading"
    >
      <h3 id="amort-illustration-heading" className="text-sm font-extrabold text-[#0b1f3a]">
        How a typical EMI split can change
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        On many amortizing (reducing-balance) loans, early EMIs can contain a larger interest
        component; later payments typically shift more toward principal. Not every loan type works
        this way — flat-rate, bullet, and some specialty products differ.
      </p>

      <p className="sr-only">
        Illustrative chart for an amortizing loan. Early EMI: about 72 percent interest and 28
        percent principal. Mid tenure: about 48 percent interest and 52 percent principal. Later
        EMI: about 22 percent interest and 78 percent principal. Percentages are educational
        examples only.
      </p>

      <ul className="mt-4 space-y-3" aria-hidden>
        {AMORT_BARS.map((bar) => (
          <li key={bar.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{bar.label}</span>
              <span className="tabular-nums text-slate-500">
                {bar.interest}% interest · {bar.principal}% principal
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-[#f97316]"
                style={{ width: `${bar.interest}%` }}
                title={`Interest ${bar.interest}%`}
              />
              <div
                className="bg-[#0b1f3a]"
                style={{ width: `${bar.principal}%` }}
                title={`Principal ${bar.principal}%`}
              />
            </div>
          </li>
        ))}
      </ul>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600" aria-hidden>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
          Interest portion
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" />
          Principal portion
        </li>
      </ul>
    </div>
  );
}

export function LoanInterestExplainer() {
  return (
    <section
      id="how-interest-works"
      aria-labelledby="how-interest-works-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-[#f8fafc] via-white to-[#fff7ed]"
    >
      <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
        <div>
          <h2
            id="how-interest-works-heading"
            className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
          >
            How Loan Interest Works
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Interest is the price of borrowing. Understanding these building blocks helps you
            compare offers by total cost — not just the monthly number.
          </p>

          <dl className="mt-5 space-y-3.5">
            {TERMS.map((item) => (
              <div
                key={item.term}
                className="rounded-xl border border-slate-200/80 bg-white/80 p-3.5"
              >
                <dt className="text-sm font-extrabold text-[#0b1f3a]">{item.term}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-600">{item.definition}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5">
            <Link
              href="/calculators/emi"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Learn how EMI works →
            </Link>
          </p>
        </div>

        <div className="min-w-0">
          <FlowDiagram />
          <AmortizationIllustration />
        </div>
      </div>
    </section>
  );
}
