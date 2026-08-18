'use client';

import Link from 'next/link';
import { CmsMediaImage } from '@/components/cms/cms-media-image';
import { useBusinessLoanDecision } from '@/components/loans/business-loan-decision-context';
import {
  BUSINESS_FUNDING_PURPOSES,
  BUSINESS_LOAN_ILLUSTRATIVE_RATE,
  formatCompactFundingInr,
  type BusinessEntityType,
  type BusinessFundingPurpose,
} from '@/lib/business-loan-page';

const chip =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] focus-visible:ring-offset-2';

const ENTITY_OPTIONS: Array<{ id: BusinessEntityType; label: string }> = [
  { id: 'proprietorship', label: 'Proprietorship' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'llp', label: 'LLP' },
  { id: 'private_limited', label: 'Private Limited' },
  { id: 'other', label: 'Other' },
];

function MoneyInput({
  label,
  value,
  onChange,
  hint,
  dominant,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  dominant?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30 ${
          dominant ? 'text-lg sm:text-xl' : 'text-sm'
        }`}
      />
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-[var(--bl-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function BusinessLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const {
    purpose,
    setPurpose,
    fundingRequired,
    setFundingRequired,
    tenureYears,
    setTenureYears,
    entityType,
    setEntityType,
    vintageYears,
    setVintageYears,
  } = useBusinessLoanDecision();

  const purposeLabel =
    BUSINESS_FUNDING_PURPOSES.find((p) => p.id === purpose)?.label ?? 'Selected purpose';

  return (
    <header className="bl-hero relative overflow-hidden">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="min-w-0">
          <p className="bl-eyebrow">Business Financing Planner</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--bl-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Business Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--bl-muted)] sm:text-[0.9375rem]">
            Start with what your business needs funding for, then estimate repayment capacity before
            comparing Business Loan options.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('bl-snapshot')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                What does your business need funding for?
              </p>
              <div
                className="mt-2.5 flex flex-wrap gap-2"
                role="group"
                aria-label="Funding purpose"
              >
                {BUSINESS_FUNDING_PURPOSES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={purpose === p.id}
                    onClick={() => setPurpose(p.id as BusinessFundingPurpose)}
                    className={`${chip} ${
                      purpose === p.id
                        ? 'bg-[var(--bl-navy)] text-white'
                        : 'bg-[var(--bl-surface-2)] text-[var(--bl-navy)] hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MoneyInput
                  label="Required Funding (₹)"
                  value={fundingRequired}
                  onChange={setFundingRequired}
                  dominant
                />
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Preferred Tenure (years)
                <input
                  type="number"
                  min={1}
                  max={15}
                  step={1}
                  value={tenureYears}
                  onChange={(e) =>
                    setTenureYears(Math.max(1, Math.min(15, Number(e.target.value) || 1)))
                  }
                  className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Business Type
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as BusinessEntityType)}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
                >
                  {ENTITY_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2 sm:max-w-xs">
                Business Vintage (years)
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={vintageYears}
                  onChange={(e) => setVintageYears(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
                />
              </label>
            </div>

            <p className="bl-micro-summary text-sm text-[var(--bl-muted)]" aria-live="polite">
              <span className="font-semibold tabular-nums text-[var(--bl-navy)]">
                {formatCompactFundingInr(fundingRequired)} required
              </span>
              <span className="mx-2 text-[var(--bl-border)]" aria-hidden>
                •
              </span>
              <span className="font-semibold text-[var(--bl-navy)]">{tenureYears}-year tenure</span>
              <span className="mx-2 text-[var(--bl-border)]" aria-hidden>
                •
              </span>
              <span className="font-semibold text-[var(--bl-navy)]">{purposeLabel}</span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-5 text-sm font-semibold !text-white transition hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
              >
                Plan My Business Loan
              </button>
              <Link
                href="/finance/eligibility"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition hover:text-[var(--bl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
              >
                Check Business Eligibility →
              </Link>
            </div>
            <p className="text-xs leading-relaxed text-[var(--bl-muted)] sm:text-sm">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {BUSINESS_LOAN_ILLUSTRATIVE_RATE}% p.a. unless you adjust the rate. This page does not
              approve loans or government scheme benefits.
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
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--bl-orange-soft)] opacity-55"
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
