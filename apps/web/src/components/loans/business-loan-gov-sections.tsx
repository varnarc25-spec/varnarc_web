'use client';

import { useMemo, useState } from 'react';
import { useBusinessLoanDecision } from '@/components/loans/business-loan-decision-context';
import {
  evaluateBusinessSchemeEligibility,
  findBusinessSchemeBySlug,
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  schemeAllowsPublicNumericRules,
  schemeEligibilityStatusLabel,
  type BusinessGovernmentScheme,
  type BusinessSchemeEligibilityResult,
  type SchemeEligibilityStatus,
} from '@/lib/business-loan-schemes';
import { BUSINESS_FUNDING_PURPOSES } from '@/lib/business-loan-page';

function ExternalPortalNote({ schemeName }: { schemeName: string }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-[var(--bl-muted)]" role="note">
      You are leaving Varnarc and continuing on the official government portal. Varnarc does not
      submit {schemeName} applications unless a verified integration exists.
    </p>
  );
}

function SchemeFreshnessBanner({
  freshness,
}: {
  freshness: ReturnType<typeof governmentSchemeFreshness>;
}) {
  if (freshness !== 'review_required' && freshness !== 'archived') return null;
  return (
    <p className="mt-3 rounded-[var(--bl-radius-md)] bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
      Government scheme information may have changed. Verify the latest rules on the official
      source.
    </p>
  );
}

function statusToneClass(status: SchemeEligibilityStatus): string {
  switch (status) {
    case 'potential_match':
      return 'bg-[var(--bl-navy)]/10 text-[var(--bl-navy)] ring-1 ring-[var(--bl-navy)]/15';
    case 'may_be_relevant':
      return 'bg-slate-200/80 text-slate-700 ring-1 ring-slate-300/60';
    case 'insufficient_information':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    case 'not_matched':
      return 'bg-slate-50 text-slate-500 ring-1 ring-slate-200';
  }
}

function SchemeCard({ result }: { result: BusinessSchemeEligibilityResult }) {
  const { scheme, status, explanation, matchedConditions, unmetConditions, unknownConditions } =
    result;
  const freshness = result.freshness;
  const statusLabel = schemeEligibilityStatusLabel(status);
  const keyConditions = [
    ...matchedConditions.slice(0, 2),
    ...unmetConditions.slice(0, 2),
    ...unknownConditions.slice(0, 2),
  ].slice(0, 4);

  return (
    <article className="rounded-[var(--bl-radius-md)] bg-white p-5 ring-1 ring-[var(--bl-border)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--bl-navy)]">{scheme.name}</h3>
          <p className="mt-1 text-sm text-[var(--bl-muted)]">
            Authority: {scheme.authorityName || scheme.ministryDepartment}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:text-sm ${statusToneClass(status)}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
        <p>
          <span className="font-semibold text-[var(--bl-navy)]">What it may provide: </span>
          {scheme.benefitSummary ||
            'Confirm current benefits on the official source — summaries can change.'}
        </p>
        <p>
          <span className="font-semibold text-[var(--bl-navy)]">Who it may be relevant for: </span>
          {explanation}
        </p>
        {keyConditions.length ? (
          <div>
            <p className="font-semibold text-[var(--bl-navy)]">Important conditions</p>
            <ul className="mt-1.5 space-y-1.5">
              {keyConditions.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-[var(--bl-muted)]">
        <span className="font-semibold text-slate-700">Official source: </span>
        {scheme.authorityName || scheme.ministryDepartment}
        <br />
        <span className="font-semibold text-slate-700">Last verified: </span>
        {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
      </p>
      <SchemeFreshnessBanner freshness={freshness} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {scheme.portalUrl ? (
          <a
            href={scheme.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
          >
            Check Possible Relevance →
            <span className="sr-only"> — opens external government site</span>
          </a>
        ) : null}
        {(scheme.officialGuidelinesUrl || scheme.officialSourceUrl) && (
          <a
            href={scheme.officialGuidelinesUrl || scheme.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
          >
            Open Official Source ↗<span className="sr-only"> — opens external site</span>
          </a>
        )}
      </div>
      <ExternalPortalNote schemeName={scheme.name} />
      <p className="mt-2 text-xs text-[var(--bl-muted)] sm:text-sm">
        Varnarc informational content only — not an official government portal, scheme
        administrator, or government-approved lender.
      </p>
    </article>
  );
}

function SchemeDetailPanel({
  scheme,
  sectionId,
  headingId,
  title,
}: {
  scheme: BusinessGovernmentScheme;
  sectionId: string;
  headingId: string;
  title: string;
}) {
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, new Date(), scheme.status);
  const showNumbers = schemeAllowsPublicNumericRules(freshness);

  return (
    <section id={sectionId} aria-labelledby={headingId} className="full-bleed bl-gov-surface">
      <div className="site-container bl-section px-4">
        <div className="rounded-[var(--bl-radius-md)] bg-white/95 p-5 ring-1 ring-[var(--bl-border)] sm:p-8">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-4)] text-[var(--bl-navy)]"
              aria-hidden
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M4 19h16M6 19V9l6-4 6 4v10M9 19v-5h6v5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="bl-eyebrow">Official Information Module</p>
              <h2 id={headingId} className="bl-h2">
                {title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--bl-muted)]">
                Authority: {scheme.authorityName || scheme.ministryDepartment}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                What it is
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{scheme.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                What support may be available
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {scheme.benefitSummary ||
                  'Confirm current benefits on the official source — summaries can change.'}
              </p>
            </div>
          </div>

          {scheme.keyRules?.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                Key points (summarised)
              </h3>
              <ul className="mt-2 space-y-2">
                {scheme.keyRules.map((rule) => (
                  <li key={rule} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showNumbers && scheme.loanLimitForSubventionInr != null ? (
            <p className="mt-4 text-sm text-slate-600">
              Summarised ceiling reference:{' '}
              <span className="font-semibold text-[var(--bl-navy)]">
                ₹{scheme.loanLimitForSubventionInr.toLocaleString('en-IN')}
              </span>{' '}
              — confirm on the official source.
            </p>
          ) : null}

          <p className="mt-4 text-xs text-[var(--bl-muted)]">
            Last verified: {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
          </p>
          <SchemeFreshnessBanner freshness={freshness} />

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {scheme.portalUrl ? (
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
              >
                Open Official Portal →
              </a>
            ) : null}
            {(scheme.officialGuidelinesUrl || scheme.officialSourceUrl) && (
              <a
                href={scheme.officialGuidelinesUrl || scheme.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline"
              >
                View Official Guidelines →
              </a>
            )}
          </div>
          <ExternalPortalNote schemeName={scheme.name} />
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanMsmeSupport() {
  return (
    <section
      id="bl-msme-support"
      aria-labelledby="bl-msme-support-heading"
      className="full-bleed bl-gov-surface"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">MSME Context</p>
        <h2 id="bl-msme-support-heading" className="bl-h2">
          Government & MSME Financing Support
        </h2>
        <p className="bl-lede">
          Varnarc summarises verified scheme records for planning. Soft statuses like “potential
          match” or “may be relevant” never mean approval or a guaranteed loan. Confirm rules on
          official sources — Varnarc is not a government portal or scheme administrator.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Registration pathways',
              body: 'Udyam and related frameworks classify enterprises — benefits depend on linked schemes.',
            },
            {
              title: 'Credit-guarantee concepts',
              body: 'Frameworks such as CGTMSE describe guarantee-backed lending concepts via member institutions.',
            },
            {
              title: 'Official verification',
              body: 'Rules are change-sensitive. Always confirm on the official portal or with the financing bank.',
            },
          ].map((card) => (
            <li
              key={card.title}
              className="rounded-[var(--bl-radius-md)] bg-white/90 p-5 ring-1 ring-[var(--bl-border)]"
            >
              <h3 className="text-sm font-bold text-[var(--bl-navy)]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
                {card.body}
              </p>
            </li>
          ))}
        </ul>
        <a
          href="#bl-government-support"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
        >
          Explore Government / MSME Financing Support →
        </a>
      </div>
    </section>
  );
}

export function BusinessLoanGovernmentFinder({ schemes }: { schemes: BusinessGovernmentScheme[] }) {
  const { purpose, fundingRequired, vintageYears, entityType } = useBusinessLoanDecision();
  const [checked, setChecked] = useState(false);
  const [enterpriseCategory, setEnterpriseCategory] = useState<
    'micro' | 'small' | 'medium' | 'not_sure' | null
  >('not_sure');
  const [locationIndia, setLocationIndia] = useState<boolean | null>(true);

  const results = useMemo(() => {
    if (!checked) return [];
    return schemes.map((scheme) =>
      evaluateBusinessSchemeEligibility(scheme, {
        fundingPurpose: purpose,
        loanAmountInr: fundingRequired > 0 ? fundingRequired : null,
        businessVintageYears: vintageYears,
        enterpriseCategory,
        locationIndia,
      }),
    );
  }, [checked, schemes, purpose, fundingRequired, vintageYears, enterpriseCategory, locationIndia]);

  return (
    <section
      id="bl-government-support"
      aria-labelledby="bl-government-support-heading"
      className="full-bleed bl-gov-surface"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Government Support Finder</p>
        <h2 id="bl-government-support-heading" className="bl-h2">
          Explore Government / MSME Financing Support
        </h2>
        <p className="bl-lede">
          Explore summarised schemes based on purpose, enterprise category and funding need. Results
          show potential relevance — never Eligible, Approved or Guaranteed Loan.
        </p>

        <div
          className="mt-8 rounded-[var(--bl-radius-md)] bg-white/90 p-4 ring-1 ring-[var(--bl-border)] sm:p-6"
          role="form"
          aria-label="Government support pre-check"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Enterprise in India?</legend>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                {(
                  [
                    [true, 'Yes'],
                    [false, 'No'],
                    [null, 'Not sure'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={locationIndia === v}
                    onClick={() => setLocationIndia(v)}
                    className={`min-h-11 flex-1 rounded-[var(--bl-radius-md)] px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] ${
                      locationIndia === v
                        ? 'bg-[var(--bl-navy)] text-white'
                        : 'bg-[var(--bl-surface-2)] text-[var(--bl-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Enterprise / MSME Classification</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    ['micro', 'Micro'],
                    ['small', 'Small'],
                    ['medium', 'Medium'],
                    ['not_sure', 'Not sure'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={enterpriseCategory === key}
                    onClick={() => setEnterpriseCategory(key)}
                    className={`min-h-11 rounded-[var(--bl-radius-md)] px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] ${
                      enterpriseCategory === key
                        ? 'bg-[var(--bl-navy)] text-white'
                        : 'bg-[var(--bl-surface-2)] text-[var(--bl-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold text-slate-700">
              Business Type (from planner)
              <input
                type="text"
                readOnly
                value={entityType.replace(/_/g, ' ')}
                className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-[var(--bl-surface-2)] px-3 text-sm font-semibold capitalize text-[var(--bl-navy)]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Funding Purpose (from planner)
              <input
                type="text"
                readOnly
                value={BUSINESS_FUNDING_PURPOSES.find((p) => p.id === purpose)?.label ?? purpose}
                className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-[var(--bl-surface-2)] px-3 text-sm font-semibold text-[var(--bl-navy)]"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Loan Requirement (₹)
              <input
                type="number"
                min={0}
                readOnly
                value={fundingRequired || ''}
                aria-describedby="bl-gov-loan-hint"
                className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-[var(--bl-surface-2)] px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)]"
              />
              <span
                id="bl-gov-loan-hint"
                className="mt-1 block text-xs font-normal text-[var(--bl-muted)] sm:text-sm"
              >
                From funding planner above
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Business Vintage (years)
              <input
                type="number"
                min={0}
                readOnly
                value={vintageYears}
                className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-[var(--bl-surface-2)] px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setChecked(true)}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] sm:w-auto"
          >
            Check Possible Relevance
          </button>
        </div>

        {checked ? (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-[var(--bl-navy)]">Possible Government Support</h3>
            <p className="mt-1 text-sm text-[var(--bl-muted)]">
              Official verification required. Statuses never mean approved or rejected by Varnarc.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-1 xl:grid-cols-2">
              {results.map((r) => (
                <SchemeCard key={r.scheme.id} result={r} />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--bl-muted)]">
            Enter what you know, then check. Prefer wording like “potential match” or “may be
            relevant” — never “you are eligible”.
          </p>
        )}
      </div>
    </section>
  );
}

export function BusinessLoanUdyamPanel({ schemes }: { schemes: BusinessGovernmentScheme[] }) {
  const scheme = findBusinessSchemeBySlug(schemes, 'udyam-registration');
  if (!scheme) return null;
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, new Date(), scheme.status);

  return (
    <section id="bl-udyam" aria-labelledby="bl-udyam-heading" className="full-bleed bl-gov-surface">
      <div className="site-container bl-section px-4">
        <div className="rounded-[var(--bl-radius-md)] bg-white/95 p-5 ring-1 ring-[var(--bl-border)] sm:p-8">
          <p className="bl-eyebrow">Official Information Module</p>
          <h2 id="bl-udyam-heading" className="bl-h2">
            Understanding Udyam Registration
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
            Udyam is the Government of India MSME registration framework. MSME classification can
            matter for certain financing pathways, but eligibility under any scheme depends on that
            scheme&apos;s actual rules. Varnarc does not register businesses.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{scheme.description}</p>
          <p className="mt-4 text-sm text-[var(--bl-muted)]">
            <span className="font-semibold text-slate-700">Official source: </span>
            {scheme.authorityName || scheme.ministryDepartment}
            <br />
            <span className="font-semibold text-slate-700">Last verified: </span>
            {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
          </p>
          <SchemeFreshnessBanner freshness={freshness} />
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {scheme.portalUrl ? (
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
              >
                Open Official Udyam Portal ↗
                <span className="sr-only"> — external government website</span>
              </a>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--bl-muted)]">
            External government website
          </p>
          <ExternalPortalNote schemeName={scheme.name} />
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanCgtmsePanel({ schemes }: { schemes: BusinessGovernmentScheme[] }) {
  const scheme = findBusinessSchemeBySlug(schemes, 'cgtmse');
  if (!scheme) return null;
  return (
    <SchemeDetailPanel
      scheme={scheme}
      sectionId="bl-cgtmse"
      headingId="bl-cgtmse-heading"
      title="CGTMSE"
    />
  );
}
