'use client';

import { useMemo, useState } from 'react';
import { useLapDecision } from '@/components/loans/loan-against-property-decision-context';
import {
  evaluateLapSchemeRelevance,
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  schemeEligibilityStatusLabel,
  type LapGovernmentScheme,
  type LapSchemeEligibilityResult,
  type SchemeEligibilityStatus,
} from '@/lib/loan-against-property-schemes';

function ExternalPortalNote({ schemeName }: { schemeName: string }) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-[var(--lap-muted)]" role="note">
      You are leaving Varnarc and continuing on the official source. Varnarc does not administer{' '}
      {schemeName} and is not a regulator or lender.
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
    <p className="mt-3 rounded-[var(--lap-radius-md)] bg-amber-50 px-3 py-2 text-sm font-semibold leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
      This regulatory information may have changed. Verify the latest requirements on the official
      source.
    </p>
  );
}

function statusToneClass(status: SchemeEligibilityStatus): string {
  switch (status) {
    case 'potential_match':
      return 'bg-[var(--lap-navy)]/10 text-[var(--lap-navy)] ring-1 ring-[var(--lap-navy)]/15';
    case 'may_be_relevant':
      return 'bg-slate-200/80 text-slate-700 ring-1 ring-slate-300/60';
    case 'insufficient_information':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    case 'not_matched':
      return 'bg-slate-50 text-slate-500 ring-1 ring-slate-200';
  }
}

function SchemeCard({ result }: { result: LapSchemeEligibilityResult }) {
  const { scheme, status, explanation } = result;
  return (
    <article className="rounded-[var(--lap-radius-md)] bg-white p-5 ring-1 ring-[var(--lap-border)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[var(--lap-navy)]">{scheme.name}</h3>
          <p className="mt-1 text-sm text-[var(--lap-muted)]">
            Authority: {scheme.authorityName || scheme.ministryDepartment}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-semibold ${statusToneClass(status)}`}
        >
          {schemeEligibilityStatusLabel(status)}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{scheme.description}</p>
      <p className="mt-3 text-sm text-slate-600">
        <span className="font-semibold text-[var(--lap-navy)]">Why it may be relevant: </span>
        {explanation}
      </p>
      {scheme.keyRules?.length ? (
        <ul className="mt-3 space-y-1.5">
          {scheme.keyRules.slice(0, 4).map((r) => (
            <li key={r} className="text-sm text-slate-600">
              · {r}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-sm text-[var(--lap-muted)]">
        <span className="font-semibold text-slate-700">Official source: </span>
        {scheme.authorityName || scheme.ministryDepartment}
        <br />
        <span className="font-semibold text-slate-700">Last verified: </span>
        {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
      </p>
      <SchemeFreshnessBanner freshness={result.freshness} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {(scheme.officialGuidelinesUrl || scheme.officialSourceUrl) && (
          <a
            href={scheme.officialGuidelinesUrl || scheme.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white"
          >
            Open Official Source ↗<span className="sr-only"> — opens external site</span>
          </a>
        )}
      </div>
      <ExternalPortalNote schemeName={scheme.name} />
    </article>
  );
}

export function LapRegulatory({ schemes }: { schemes: LapGovernmentScheme[] }) {
  const { propertyValue, requiredLoan } = useLapDecision();
  const [checked, setChecked] = useState(false);
  const [locationIndia, setLocationIndia] = useState<boolean | null>(true);
  const [hasOwnedProperty, setHasOwnedProperty] = useState<boolean | null>(true);

  const results = useMemo(() => {
    if (!checked) return [];
    return schemes.map((scheme) =>
      evaluateLapSchemeRelevance(scheme, {
        locationIndia,
        hasOwnedProperty,
        propertyValueKnown: propertyValue > 0,
        requiredLoanInr: requiredLoan > 0 ? requiredLoan : null,
      }),
    );
  }, [checked, schemes, locationIndia, hasOwnedProperty, propertyValue, requiredLoan]);

  return (
    <section
      id="lap-regulatory"
      aria-labelledby="lap-regulatory-heading"
      className="full-bleed bg-[var(--lap-surface-2)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Regulatory Information</p>
        <h2 id="lap-regulatory-heading" className="lap-h2">
          LAP Rules &amp; Regulatory Information
        </h2>
        <p className="lap-lede">
          CMS/data-driven summaries with official sources. Varnarc does not invent numerical LTV
          caps. Confirm current requirements on the official source — Varnarc is not a regulator.
        </p>

        <div
          className="mt-8 rounded-[var(--lap-radius-md)] bg-white/90 p-4 ring-1 ring-[var(--lap-border)] sm:p-6"
          role="form"
          aria-label="Regulatory relevance pre-check"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Planning in India?</legend>
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
                    className={`min-h-11 flex-1 rounded-[var(--lap-radius-md)] px-3 text-sm font-semibold ${
                      locationIndia === v
                        ? 'bg-[var(--lap-navy)] text-white'
                        : 'bg-[var(--lap-surface-2)] text-[var(--lap-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Owned property available as security?</legend>
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
                    aria-pressed={hasOwnedProperty === v}
                    onClick={() => setHasOwnedProperty(v)}
                    className={`min-h-11 flex-1 rounded-[var(--lap-radius-md)] px-3 text-sm font-semibold ${
                      hasOwnedProperty === v
                        ? 'bg-[var(--lap-navy)] text-white'
                        : 'bg-[var(--lap-surface-2)] text-[var(--lap-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white"
          >
            Check Possible Relevance
          </button>
        </div>

        {checked ? (
          <div className="mt-10 grid gap-4">
            {results.map((r) => (
              <SchemeCard key={r.scheme.id} result={r} />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {schemes.map((scheme) => {
              const freshness = governmentSchemeFreshness(
                scheme.lastVerifiedAt,
                new Date(),
                scheme.status,
              );
              return (
                <article
                  key={scheme.id}
                  className="rounded-[var(--lap-radius-md)] bg-white/95 p-5 ring-1 ring-[var(--lap-border)]"
                >
                  <h3 className="text-base font-bold text-[var(--lap-navy)]">{scheme.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{scheme.description}</p>
                  <p className="mt-3 text-sm text-[var(--lap-muted)]">
                    Source: {scheme.authorityName || scheme.ministryDepartment}
                    <br />
                    Last verified: {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
                  </p>
                  <SchemeFreshnessBanner freshness={freshness} />
                  <a
                    href={scheme.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lap-navy)] underline-offset-2 hover:underline"
                  >
                    Official source ↗
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
