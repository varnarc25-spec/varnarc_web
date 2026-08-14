import Link from 'next/link';
import { ContextualLinkList } from '@/components/loans/contextual-link-list';
import { contextualLinksForSection } from '@/lib/loan-contextual-links';
import { financeCreditScorePath } from '@/lib/finance-routes';

const SCORE_BANDS = [
  {
    id: 'lower',
    label: 'Lower',
    hint: 'More limited options with many lenders',
    from: 300,
    to: 579,
    color: '#94a3b8',
  },
  {
    id: 'fair',
    label: 'Fair',
    hint: 'Mixed outcomes depending on the lender',
    from: 580,
    to: 669,
    color: '#f97316',
  },
  {
    id: 'good',
    label: 'Good',
    hint: 'Often stronger access for many products',
    from: 670,
    to: 749,
    color: '#0b1f3a',
  },
  {
    id: 'strong',
    label: 'Strong',
    hint: 'May support better pricing with some lenders',
    from: 750,
    to: 900,
    color: '#0b1f3a',
  },
] as const;

const POINTS = [
  'Lenders use credit scores differently — thresholds and weightings are product- and lender-specific.',
  'A stronger credit history may improve access or pricing for some applicants, but it is never a guarantee.',
  'Income stability and existing obligations (including other EMIs) also matter in underwriting.',
  'Loan applications and repayment behaviour can affect credit history over time.',
] as const;

function CreditScoreScale() {
  const min = 300;
  const max = 900;
  const span = max - min;

  return (
    <div
      className="rounded-xl bg-[#f8fafc] p-4 sm:p-5"
      role="img"
      aria-label="Generic credit score scale from 300 to 900 with bands labeled Lower, Fair, Good, and Strong. Bands are illustrative only and do not guarantee approval."
    >
      <div className="flex items-end justify-between text-xs font-bold tabular-nums text-[#0b1f3a]">
        <span>300</span>
        <span className="font-medium text-slate-500">Generic score scale</span>
        <span>900</span>
      </div>

      <div className="mt-2 flex h-3.5 overflow-hidden rounded-full" aria-hidden>
        {SCORE_BANDS.map((band) => {
          const exclusiveEnd = band.id === 'strong' ? band.to : band.to + 1;
          const w = ((exclusiveEnd - band.from) / span) * 100;
          return (
            <div
              key={band.id}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${w}%`,
                backgroundColor: band.color,
                opacity:
                  band.id === 'lower'
                    ? 0.45
                    : band.id === 'fair'
                      ? 0.85
                      : band.id === 'good'
                        ? 0.75
                        : 1,
              }}
              title={`${band.label}: ${band.from}–${band.to}`}
            />
          );
        })}
      </div>

      <div className="relative mt-1 h-3" aria-hidden>
        {[300, 580, 670, 750, 900].map((tick) => {
          const left = ((tick - min) / span) * 100;
          return (
            <span
              key={tick}
              className="absolute top-0 h-2 w-px -translate-x-1/2 bg-slate-300"
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
        {SCORE_BANDS.map((band) => (
          <li key={band.id} className="rounded-lg bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#0b1f3a]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
              {band.label}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
              {band.from}–{band.to}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-600">{band.hint}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Illustrative bands only. Bureau models and lender cut-offs differ — a score alone does not
        guarantee approval or a specific rate.
      </p>
    </div>
  );
}

export function LoanCreditScoreSection() {
  return (
    <section id="credit-score" aria-labelledby="credit-score-loans-heading">
      <div className="max-w-2xl">
        <h2
          id="credit-score-loans-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          Credit Score &amp; Loans
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Credit scores are one input among several. They do not promise approval or a fixed
          interest rate.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <CreditScoreScale />

        <div>
          <h3 className="text-sm font-bold text-[#0b1f3a]">What to keep in mind</h3>
          <ul className="mt-3 space-y-2">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]"
                  aria-hidden
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ContextualLinkList
          links={contextualLinksForSection('creditScore')}
          label="Related guides"
        />
        <Link
          href={financeCreditScorePath()}
          className="group inline-flex text-sm font-semibold text-[#0b1f3a] hover:text-[#f97316]"
        >
          Learn about credit scores
          <span
            className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
