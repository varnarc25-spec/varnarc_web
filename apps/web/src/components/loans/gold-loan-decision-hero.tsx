'use client';

import { CmsMediaImage } from '@/components/cms/cms-media-image';
import { useGoldLoanDecision } from '@/components/loans/gold-loan-decision-context';
import {
  GOLD_LOAN_ILLUSTRATIVE_RATE,
  GOLD_PURITY_PRESETS,
  type GoldRepaymentMode,
} from '@/lib/gold-loan-page';

const chip =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)] focus-visible:ring-offset-2';

export function GoldLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const {
    requiredLoan,
    setRequiredLoan,
    weightG,
    setWeightG,
    karat,
    setKarat,
    purityPreset,
    setPurityPreset,
    tenureMonths,
    setTenureMonths,
    repaymentMode,
    setRepaymentMode,
  } = useGoldLoanDecision();

  return (
    <header className="gl-hero relative overflow-hidden">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="min-w-0">
          <p className="gl-eyebrow">Finance · Loans · Gold Loan</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--gl-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan &amp; Compare Gold Loans
          </h1>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-[var(--gl-muted)]">
            Estimate borrowing capacity using gold weight, purity and indicative valuation, then
            explore repayment costs, eligibility and available lender offers.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('gl-snapshot')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <label className="block text-sm font-semibold text-slate-700">
              Required loan amount (₹)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={requiredLoan}
                onChange={(e) => setRequiredLoan(Number(e.target.value))}
                className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-lg font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
              />
            </label>

            <div>
              <p className="text-sm font-bold text-[var(--gl-navy)]">Gold purity</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Gold purity">
                {GOLD_PURITY_PRESETS.map((p) => (
                  <button
                    key={String(p.id)}
                    type="button"
                    aria-pressed={purityPreset === p.id}
                    onClick={() => setPurityPreset(p.id)}
                    className={`${chip} ${
                      purityPreset === p.id
                        ? 'bg-[var(--gl-navy)] text-white'
                        : 'bg-[var(--gl-surface-2)] text-[var(--gl-navy)] hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {purityPreset === 'custom' ? (
                <label className="mt-3 block max-w-xs text-sm font-semibold text-slate-700">
                  Custom karat
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.1}
                    value={karat}
                    onChange={(e) => setKarat(Number(e.target.value))}
                    className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
                  />
                </label>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Gold weight (g)
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={weightG}
                  onChange={(e) => setWeightG(Number(e.target.value))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Preferred tenure (months)
                <input
                  type="number"
                  min={1}
                  max={84}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
                />
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">Repayment preference</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['emi', 'EMI'],
                    ['interest_only', 'Periodic interest'],
                    ['bullet', 'Bullet-style'],
                  ] as Array<[GoldRepaymentMode, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={repaymentMode === key}
                    onClick={() => setRepaymentMode(key)}
                    className={`${chip} ${
                      repaymentMode === key
                        ? 'bg-[var(--gl-navy)] text-white'
                        : 'bg-[var(--gl-surface-2)] text-[var(--gl-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-[var(--gl-muted)]">
                Common repayment structures may include these options — availability varies by
                lender.
              </p>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-5 text-sm font-semibold !text-white hover:bg-[var(--gl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]"
              >
                Estimate Gold Loan
              </button>
              <a
                href="#gl-offers"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 hover:text-[var(--gl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]"
              >
                Compare Offers
              </a>
              <a
                href="#gl-valuation"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
              >
                How gold valuation works →
              </a>
            </div>
            <p className="text-sm text-[var(--gl-muted)]">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {GOLD_LOAN_ILLUSTRATIVE_RATE}% p.a. unless adjusted. Not a guaranteed valuation, LTV,
              approval or rate.
            </p>
          </form>

          <div className="relative mx-auto mt-6 w-full max-w-sm lg:hidden" aria-hidden>
            <div className="relative mx-auto aspect-[16/9] w-[80%] max-h-[150px]">
              <CmsMediaImage
                src={illustrationSrc}
                alt=""
                width={480}
                height={270}
                sizes="280px"
                objectFit="contain"
                loading="lazy"
                imgClassName="max-h-[150px]"
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl justify-self-end lg:block">
          <div
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--gl-orange-soft)] opacity-55"
            aria-hidden
          />
          <div className="relative aspect-[16/9] w-full max-h-[380px]">
            <CmsMediaImage
              src={illustrationSrc}
              alt={illustrationAlt}
              width={640}
              height={360}
              sizes="(max-width: 1024px) 0px, 580px"
              objectFit="contain"
              loading="eager"
              fetchPriority="high"
              imgClassName="max-h-[380px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
