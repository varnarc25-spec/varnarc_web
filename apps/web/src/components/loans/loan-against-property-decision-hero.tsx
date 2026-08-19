'use client';

import Link from 'next/link';
import { CmsMediaImage } from '@/components/cms/cms-media-image';
import { useLapDecision } from '@/components/loans/loan-against-property-decision-context';
import {
  LAP_APPLICANT_TYPES,
  LAP_ILLUSTRATIVE_RATE,
  LAP_OWNERSHIP_OPTIONS,
  LAP_PROPERTY_TYPES,
  parseLapMoneyInput,
} from '@/lib/loan-against-property-page';

const chip =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)] focus-visible:ring-offset-2';

function LapHeroIllustration({
  src,
  alt,
  sizes,
  loading,
  fetchPriority,
}: {
  src: string;
  alt: string;
  sizes: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  return (
    <div className="lap-hero-visual__panel">
      <div className="lap-hero-visual__art">
        <CmsMediaImage
          src={src}
          alt={alt}
          width={880}
          height={580}
          sizes={sizes}
          objectFit="contain"
          loading={loading ?? 'lazy'}
          fetchPriority={fetchPriority}
          className="block w-full"
          imgClassName="!h-auto !w-full"
        />
      </div>
    </div>
  );
}

export function LoanAgainstPropertyDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const {
    propertyValue,
    setPropertyValue,
    requiredLoan,
    setRequiredLoan,
    tenureYears,
    setTenureYears,
    propertyType,
    setPropertyType,
    applicantType,
    setApplicantType,
    ownership,
    setOwnership,
  } = useLapDecision();

  return (
    <header className="lap-hero">
      <div className="lap-hero-grid">
        <div className="lap-hero-copy min-w-0">
          <p className="lap-eyebrow">LOAN AGAINST PROPERTY</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--lap-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Loans Against Property
          </h1>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-[var(--lap-muted)]">
            Estimate indicative borrowing capacity from owned property value and LTV, check
            repayment capacity, then explore available LAP options.
          </p>

          <div className="lap-hero-visual lap-hero-visual--mobile mt-5 md:hidden">
            <LapHeroIllustration
              src={illustrationSrc}
              alt=""
              sizes="(max-width: 429px) 260px, 300px"
              loading="lazy"
            />
          </div>

          <form
            id="lap-hero-planner"
            className="lap-hero-planner mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('lap-snapshot')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <label className="block text-sm font-semibold text-slate-700">
              Property value (₹)
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={Number.isFinite(propertyValue) ? String(propertyValue) : '0'}
                onChange={(e) => setPropertyValue(parseLapMoneyInput(e.target.value))}
                className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-lg font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
              />
            </label>

            <div>
              <p className="text-sm font-bold text-[var(--lap-navy)]">Property type</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Property type">
                {LAP_PROPERTY_TYPES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={propertyType === p.id}
                    onClick={() => setPropertyType(p.id)}
                    className={`${chip} ${
                      propertyType === p.id
                        ? 'bg-[var(--lap-navy)] text-white'
                        : 'bg-[var(--lap-surface-2)] text-[var(--lap-navy)] hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Loan required (₹)
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={Number.isFinite(requiredLoan) ? String(requiredLoan) : '0'}
                  onChange={(e) => setRequiredLoan(parseLapMoneyInput(e.target.value))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Preferred tenure (years)
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--lap-navy)]">Applicant type</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Applicant type">
                {LAP_APPLICANT_TYPES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={applicantType === p.id}
                    onClick={() => setApplicantType(p.id)}
                    className={`${chip} ${
                      applicantType === p.id
                        ? 'bg-[var(--lap-navy)] text-white'
                        : 'bg-[var(--lap-surface-2)] text-[var(--lap-navy)] hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--lap-navy)]">Ownership</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Ownership">
                {LAP_OWNERSHIP_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={ownership === p.id}
                    onClick={() => setOwnership(p.id)}
                    className={`${chip} ${
                      ownership === p.id
                        ? 'bg-[var(--lap-navy)] text-white'
                        : 'bg-[var(--lap-surface-2)] text-[var(--lap-navy)] hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-5 text-sm font-semibold !text-white hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]"
              >
                Estimate LAP Capacity
              </button>
              <Link
                href="/finance/eligibility"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 hover:text-[var(--lap-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]"
              >
                Check Eligibility →
              </Link>
            </div>
            <p className="text-sm text-[var(--lap-muted)]">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {LAP_ILLUSTRATIVE_RATE}% p.a. unless adjusted. Not a guaranteed valuation, LTV,
              approval or rate.
            </p>
          </form>
        </div>

        <aside
          className="lap-hero-visual lap-hero-visual--desktop hidden md:block"
          aria-label={illustrationAlt}
        >
          <LapHeroIllustration
            src={illustrationSrc}
            alt={illustrationAlt}
            sizes="(min-width: 1440px) 515px, (min-width: 1280px) 480px, (min-width: 1024px) 420px, 360px"
            loading="eager"
            fetchPriority="high"
          />
        </aside>
      </div>
    </header>
  );
}
