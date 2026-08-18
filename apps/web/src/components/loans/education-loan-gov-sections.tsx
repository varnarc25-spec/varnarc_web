'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useEducationLoanDecision } from '@/components/loans/education-loan-decision-context';
import { calculatorHref } from '@/lib/finance-routes';
import {
  EDUCATION_LOAN_DISBURSEMENT_STEPS,
  EDUCATION_LOAN_TIMELINE_STEPS,
  estimateEducationLoanPrepaymentImpact,
  type PrepaymentMode,
} from '@/lib/education-loan-page';
import {
  evaluateGovernmentSchemeEligibility,
  findEducationSchemeBySlug,
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  schemeAllowsPublicNumericRules,
  schemeEligibilityStatusLabel,
  type EducationGovernmentScheme,
  type SchemeEligibilityResult,
} from '@/lib/education-loan-schemes';

function ExternalPortalNote({ schemeName }: { schemeName: string }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-[var(--el-muted)]" role="note">
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
    <p className="mt-3 rounded-[var(--el-radius-md)] bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
      Government scheme information may have changed. Verify the latest rules on the official
      source.
    </p>
  );
}

function statusToneClass(status: SchemeEligibilityResult['status']): string {
  switch (status) {
    case 'potential_match':
      return 'bg-[var(--el-navy)]/10 text-[var(--el-navy)] ring-1 ring-[var(--el-navy)]/15';
    case 'may_be_relevant':
      return 'bg-slate-200/80 text-slate-700 ring-1 ring-slate-300/60';
    case 'insufficient_information':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    case 'not_matched':
      return 'bg-slate-50 text-slate-500 ring-1 ring-slate-200';
  }
}

export function EducationLoanMoratorium() {
  const {
    courseYears,
    setCourseYears,
    moratoriumMonths,
    setMoratoriumMonths,
    studyInterest,
    emiAfterStudy,
    loanRequired,
  } = useEducationLoanDecision();

  const courseBar = Math.max(1, Math.round(courseYears * 4));
  const moratoriumBar = Math.max(1, Math.round(moratoriumMonths / 3));
  const emiBar = 10;

  return (
    <section
      id="el-moratorium"
      aria-labelledby="el-moratorium-heading"
      className="full-bleed bg-[var(--el-surface-4)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Moratorium</p>
        <h2 id="el-moratorium-heading" className="el-h2">
          How the Education Loan Moratorium Works
        </h2>
        <p className="el-lede">
          Illustrative planner timeline. Do not assume a universal “course + 12 months” rule —
          adjust course and moratorium durations below. Government or lender-specific moratorium
          rules may differ.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 max-w-xl">
          <label className="block text-sm font-semibold text-slate-700">
            Course duration (years)
            <input
              type="number"
              min={0.5}
              max={8}
              step={0.5}
              value={courseYears}
              onChange={(e) => setCourseYears(Math.max(0.5, Number(e.target.value) || 0.5))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Moratorium after course (months)
            <input
              type="number"
              min={0}
              max={36}
              value={moratoriumMonths}
              onChange={(e) => setMoratoriumMonths(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
        </div>

        <ol
          className="mt-8 space-y-5"
          aria-label="Moratorium timeline: admission, course period, moratorium, repayment start, EMI period"
        >
          {[
            { label: 'Admission', detail: 'Course Begins', bar: 0 },
            {
              label: 'Course Period',
              detail: `About ${courseYears} years · Course Ends`,
              bar: courseBar,
            },
            {
              label: 'Moratorium',
              detail: `${moratoriumMonths} months (planner) · Moratorium Ends`,
              bar: moratoriumBar,
            },
            { label: 'Repayment Starts', detail: 'EMI Begins', bar: 0 },
            {
              label: 'EMI Period',
              detail: 'Repayment phase continues per product tenure',
              bar: emiBar,
            },
          ].map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--el-navy)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                {i < 4 ? (
                  <span
                    className="mt-1 h-full min-h-[1.25rem] w-px flex-1 bg-[var(--el-navy)]/25"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-bold text-[var(--el-navy)]">{step.label}</p>
                <p className="text-sm text-[var(--el-muted)]">{step.detail}</p>
                {step.bar > 0 ? (
                  <div
                    className="mt-2 h-2.5 max-w-md rounded-sm bg-[var(--el-navy)]/80"
                    style={{ width: `${Math.min(100, step.bar * 8)}%` }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)]">
            <dt className="el-metric-label">Interest During Study</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--el-navy)]">
              {studyInterest ? formatInr(Math.round(studyInterest.interestDuringStudy)) : '—'}
            </dd>
          </div>
          <div className="rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)]">
            <dt className="el-metric-label">Balance at Repayment Start</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--el-navy)]">
              {studyInterest
                ? formatInr(Math.round(studyInterest.balanceAtRepaymentStart))
                : formatInr(loanRequired)}
            </dd>
          </div>
          <div className="rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)]">
            <dt className="el-metric-label">EMI After Study</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--el-navy)]">
              {emiAfterStudy ? `${formatInr(Math.round(emiAfterStudy.monthlyEmi))}/mo` : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function EducationLoanSecuredUnsecured() {
  return (
    <section
      id="el-secured-unsecured"
      aria-labelledby="el-secured-unsecured-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Security Structure</p>
        <h2 id="el-secured-unsecured-heading" className="el-h2">
          Secured vs Unsecured Education Loan
        </h2>
        <p className="el-lede">
          Balanced comparison. Neither option is universally better — amount, pricing and
          documentation vary by product.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="bg-[var(--el-surface-2)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--el-navy)]">Secured</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Collateral</dt>
                <dd>May be required</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Documentation</dt>
                <dd>More asset-related documentation may apply</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Loan structure</dt>
                <dd>Varies by lender/product</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Key consideration</dt>
                <dd>
                  A pledged asset may be exposed to lender enforcement if obligations are not met
                </dd>
              </div>
            </dl>
          </article>
          <article className="bg-[var(--el-surface-3)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--el-navy)]">Unsecured</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Collateral</dt>
                <dd>No pledged security</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Assessment</dt>
                <dd>Greater reliance on student / co-applicant / course / institution profile</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Loan structure</dt>
                <dd>Varies by lender/product</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--el-navy)]">Documentation</dt>
                <dd>Identity, income and academic documents still apply</dd>
              </div>
            </dl>
          </article>
        </div>
        <p className="mt-5 text-xs text-[var(--el-muted)]">
          Do not infer secured/unsecured from missing product data. Confirm on the offer letter.
        </p>
      </div>
    </section>
  );
}

export function EducationLoanCollateral() {
  return (
    <section
      id="el-collateral"
      aria-labelledby="el-collateral-heading"
      className="full-bleed bg-[var(--el-surface-2)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Collateral</p>
        <h2 id="el-collateral-heading" className="el-h2">
          When Might Collateral Be Relevant?
        </h2>
        <p className="el-lede">
          Collateral requirements depend on lender, loan amount, institution, course,
          applicant/co-applicant profile and product terms. There is no universal threshold on this
          page.
        </p>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">
          Where verified product data exists, product-specific collateral requirements appear in
          offer results. Government scheme summaries may describe collateral-free or
          guarantee-linked arrangements for defined cases — always confirm with the financing bank
          and official guidelines.
        </p>
      </div>
    </section>
  );
}

export function EducationLoanEligibility() {
  const profiles = [
    {
      title: 'Student Profile',
      items: ['Admission status', 'Academic record', 'Course', 'Institution', 'Domestic / Abroad'],
    },
    {
      title: 'Co-applicant Profile',
      items: [
        'Income',
        'Credit profile',
        'Existing obligations',
        'Employment / business stability',
        'Relationship if product rules require it',
      ],
    },
    {
      title: 'Loan Profile',
      items: ['Loan requirement', 'Course duration', 'Moratorium', 'Repayment tenure'],
    },
    {
      title: 'Security Profile',
      items: ['Secured / Unsecured', 'Collateral where applicable'],
    },
  ];

  return (
    <section
      id="el-eligibility"
      aria-labelledby="el-eligibility-heading"
      className="full-bleed bg-[var(--el-surface-4)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Eligibility</p>
        <h2 id="el-eligibility-heading" className="el-h2">
          Education Loan Eligibility
        </h2>
        <p className="el-lede">
          Lenders typically weigh student, co-applicant, loan and security factors together. This
          page does not calculate an approval percentage.
        </p>

        {/* Mobile: vertical groups */}
        <ol className="mt-8 space-y-4 lg:hidden" aria-label="Eligibility assessment flow">
          {profiles.map((block) => (
            <li key={block.title}>
              <article className="bg-[var(--el-surface-1)] p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                  {block.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--el-orange)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <p
                className="py-2 text-center text-xs font-semibold text-[var(--el-muted)]"
                aria-hidden
              >
                ↓
              </p>
            </li>
          ))}
          <li>
            <p className="rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 py-3 text-center text-sm font-bold text-white">
              Lender Assessment
            </p>
          </li>
        </ol>

        {/* Desktop: hierarchy with connectors */}
        <div className="mt-8 hidden lg:block" aria-hidden={false}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
            <article className="w-full max-w-sm bg-[var(--el-surface-1)] p-5 text-center ring-1 ring-[var(--el-border)]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Student
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Institution · Course · Admission · Domestic / Abroad
              </p>
            </article>
            <span className="text-[var(--el-muted)]" aria-hidden>
              ↓
            </span>
            <article className="w-full max-w-sm bg-[var(--el-surface-1)] p-5 text-center ring-1 ring-[var(--el-border)]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Co-applicant
              </h3>
              <p className="mt-2 text-sm text-slate-600">Income · Credit · Obligations</p>
            </article>
            <span className="text-[var(--el-muted)]" aria-hidden>
              ↓
            </span>
            <article className="w-full max-w-sm bg-[var(--el-surface-1)] p-5 text-center ring-1 ring-[var(--el-border)]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Loan Profile
              </h3>
              <p className="mt-2 text-sm text-slate-600">Amount · Tenure · Moratorium</p>
            </article>
            <span className="text-[var(--el-muted)]" aria-hidden>
              ↓
            </span>
            <article className="w-full max-w-sm bg-[var(--el-surface-1)] p-5 text-center ring-1 ring-[var(--el-border)]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Security Profile
              </h3>
              <p className="mt-2 text-sm text-slate-600">Secured / Unsecured · Collateral</p>
            </article>
            <span className="text-[var(--el-muted)]" aria-hidden>
              ↓
            </span>
            <p className="w-full max-w-sm rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 py-3 text-center text-sm font-bold text-white">
              Lender Assessment
            </p>
          </div>
          <div className="sr-only">
            Eligibility flows from Student Profile through Co-applicant, Loan Profile and Security
            Profile into Lender Assessment. No approval percentage is calculated.
          </div>
        </div>

        <Link
          href="/finance/eligibility"
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
        >
          Check Education Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function EducationLoanCoapplicant() {
  return (
    <section
      id="el-coapplicant"
      aria-labelledby="el-coapplicant-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Co-applicant</p>
        <h2 id="el-coapplicant-heading" className="el-h2">
          Why the Co-applicant Matters
        </h2>
        <p className="el-lede">
          A lender may consider the co-applicant&apos;s income, obligations, credit profile and
          relationship according to its product rules. Relationship rules are not universal.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
          <article className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-2)] p-5 sm:p-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-[var(--el-navy)]">
              Student
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Academic / course profile — admission, institution, course and study destination.
            </p>
          </article>
          <div
            className="flex items-center justify-center text-sm font-bold text-[var(--el-muted)]"
            aria-hidden
          >
            +
          </div>
          <article className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-3)] p-5 sm:p-6">
            <h3 className="text-base font-bold uppercase tracking-wide text-[var(--el-navy)]">
              Co-applicant
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Financial / credit profile — income, obligations, employment stability and credit
              history.
            </p>
          </article>
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-[var(--el-muted)]" aria-hidden>
          ↓
        </p>
        <p className="mx-auto max-w-md rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 py-3 text-center text-sm font-bold text-white">
          Lender Assessment
        </p>
      </div>
    </section>
  );
}

function SchemeCard({ result }: { result: SchemeEligibilityResult }) {
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
    <article className="rounded-[var(--el-radius-md)] bg-white p-5 ring-1 ring-[var(--el-border)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--el-navy)]">{scheme.name}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusToneClass(status)}`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-[var(--el-navy)]">Why: </span>
        {explanation}
      </p>
      {keyConditions.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
            Key conditions
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {keyConditions.map((c) => (
              <li key={c} className="text-sm leading-relaxed text-slate-600">
                · {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-4 text-sm text-[var(--el-muted)]">
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
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
          >
            Check Official Eligibility →
            <span className="sr-only"> — opens external government site</span>
          </a>
        ) : null}
        {(scheme.officialGuidelinesUrl || scheme.officialSourceUrl) && (
          <a
            href={scheme.officialGuidelinesUrl || scheme.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--el-navy)] underline-offset-2 hover:text-[var(--el-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
          >
            View Official Guidelines →<span className="sr-only"> — opens external site</span>
          </a>
        )}
      </div>
      <ExternalPortalNote schemeName={scheme.name} />
      <p className="mt-2 text-xs text-[var(--el-muted)]">
        Varnarc does not make the final eligibility decision.
      </p>
    </article>
  );
}

export function EducationLoanGovernmentSupport({
  schemes,
}: {
  schemes: EducationGovernmentScheme[];
}) {
  const {
    studyLocation,
    setStudyLocation,
    loanRequired,
    familyIncome,
    setFamilyIncome,
    meritBasedAdmission,
    setMeritBasedAdmission,
    qheiEligible,
    setQheiEligible,
  } = useEducationLoanDecision();
  const [checked, setChecked] = useState(false);
  const [scholarshipReceived, setScholarshipReceived] = useState<boolean | null>(null);

  const results = useMemo(() => {
    if (!checked) return [];
    return schemes.map((scheme) =>
      evaluateGovernmentSchemeEligibility(scheme, {
        studyLocation,
        annualFamilyIncomeInr: familyIncome > 0 ? familyIncome : null,
        loanAmountInr: loanRequired > 0 ? loanRequired : null,
        meritBasedAdmission,
        qheiEligible,
        scholarshipAlreadyReceived: scholarshipReceived,
      }),
    );
  }, [
    checked,
    schemes,
    studyLocation,
    familyIncome,
    loanRequired,
    meritBasedAdmission,
    qheiEligible,
    scholarshipReceived,
  ]);

  return (
    <section
      id="el-government-support"
      aria-labelledby="el-government-support-heading"
      className="full-bleed el-gov-surface"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Government Support Finder</p>
        <h2 id="el-government-support-heading" className="el-h2">
          Government Education Loan & Subsidy Support
        </h2>
        <p className="el-lede">
          Explore government schemes that may be relevant based on your study plan, institution,
          family income and loan requirement. Results show potential relevance — never approval.
        </p>

        <div
          className="mt-8 rounded-[var(--el-radius-md)] bg-white/90 p-4 ring-1 ring-[var(--el-border)] sm:p-6"
          role="form"
          aria-label="Government support pre-check"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Study location</legend>
              <div className="mt-1.5 flex gap-2">
                {(
                  [
                    ['india', 'India'],
                    ['abroad', 'Abroad'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={studyLocation === key}
                    onClick={() => setStudyLocation(key)}
                    className={`min-h-11 flex-1 rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] ${
                      studyLocation === key
                        ? 'bg-[var(--el-navy)] text-white'
                        : 'bg-[var(--el-surface-2)] text-[var(--el-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Admission type</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(
                  [
                    [true, 'Merit-based'],
                    [false, 'Other'],
                    [null, 'Not sure'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={meritBasedAdmission === v}
                    onClick={() => setMeritBasedAdmission(v)}
                    className={`min-h-11 flex-1 rounded-full px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] sm:text-sm ${
                      meritBasedAdmission === v
                        ? 'bg-[var(--el-navy)] text-white'
                        : 'bg-[var(--el-surface-2)] text-[var(--el-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Institution on official eligible list?</legend>
              <div className="mt-1.5 flex gap-2">
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
                    aria-pressed={qheiEligible === v}
                    onClick={() => setQheiEligible(v)}
                    className={`min-h-11 flex-1 rounded-full px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] sm:text-sm ${
                      qheiEligible === v
                        ? 'bg-[var(--el-navy)] text-white'
                        : 'bg-[var(--el-surface-2)] text-[var(--el-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs font-normal text-[var(--el-muted)]">
                Check the official eligible-institution list → — Varnarc does not fabricate
                institution eligibility.
              </p>
            </fieldset>

            <label className="block text-sm font-semibold text-slate-700">
              Annual family income (₹)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={familyIncome || ''}
                placeholder="Enter amount"
                onChange={(e) => setFamilyIncome(Number(e.target.value) || 0)}
                className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Loan requirement (₹)
              <input
                type="number"
                min={0}
                readOnly
                value={loanRequired || ''}
                aria-describedby="el-gov-loan-hint"
                className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-[var(--el-surface-2)] px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)]"
              />
              <span
                id="el-gov-loan-hint"
                className="mt-1 block text-xs font-normal text-[var(--el-muted)]"
              >
                From funding-gap planner above
              </span>
            </label>

            <fieldset className="text-sm font-semibold text-slate-700">
              <legend>Scholarship / subsidy already received? (optional)</legend>
              <div className="mt-1.5 flex gap-2">
                {(
                  [
                    [true, 'Yes'],
                    [false, 'No'],
                    [null, 'Skip'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={scholarshipReceived === v}
                    onClick={() => setScholarshipReceived(v)}
                    className={`min-h-11 flex-1 rounded-full px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] sm:text-sm ${
                      scholarshipReceived === v
                        ? 'bg-[var(--el-navy)] text-white'
                        : 'bg-[var(--el-surface-2)] text-[var(--el-navy)]'
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
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] sm:w-auto"
          >
            Check Possible Support
          </button>
        </div>

        {checked ? (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-[var(--el-navy)]">Possible Government Support</h3>
            <p className="mt-1 text-sm text-[var(--el-muted)]">
              Official verification required. Statuses never mean approved or rejected by Varnarc.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {results.map((r) => (
                <SchemeCard key={r.scheme.id} result={r} />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--el-muted)]">
            Enter what you know, then check. Prefer wording like “potential match” or “may be
            relevant” — never “you are eligible”.
          </p>
        )}
      </div>
    </section>
  );
}

export function EducationLoanPmVidyalaxmi({ schemes }: { schemes: EducationGovernmentScheme[] }) {
  const scheme = findEducationSchemeBySlug(schemes, 'pm-vidyalaxmi');
  if (!scheme) return null;
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, new Date(), scheme.status);
  const showNumbers = schemeAllowsPublicNumericRules(freshness);

  return (
    <section
      id="el-pm-vidyalaxmi"
      aria-labelledby="el-pm-vidyalaxmi-heading"
      className="full-bleed el-gov-surface"
    >
      <div className="site-container el-section px-4">
        <div className="rounded-[var(--el-radius-md)] bg-white/95 p-5 ring-1 ring-[var(--el-border)] sm:p-8">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-surface-4)] text-[var(--el-navy)]"
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
                <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="el-eyebrow">Official Information Module</p>
              <h2 id="el-pm-vidyalaxmi-heading" className="el-h2">
                PM-Vidyalaxmi
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--el-muted)]">
                Authority: {scheme.authorityName || scheme.ministryDepartment}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                What it is
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{scheme.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                What support may be available
              </h3>
              {showNumbers && scheme.benefitSummary ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {scheme.benefitSummary}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Latest eligibility details are currently being reviewed. Check the official source
                  →
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Who may be relevant
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {scheme.eligibilitySummary}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Institution requirement
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {scheme.eligibleInstitutionRule ||
                  'Confirm institute eligibility on the official eligible-institution list.'}
              </p>
            </div>
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Income / loan rules
              </h3>
              {showNumbers && scheme.subventionPeriodSummary ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {scheme.subventionPeriodSummary}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Latest eligibility details are currently being reviewed. Check the official source
                  →
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 text-sm text-[var(--el-muted)]">
            <span className="font-semibold text-slate-700">Last verified: </span>
            {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
            <br />
            <span className="font-semibold text-slate-700">Source: </span>
            Official source — {scheme.ministryDepartment}
          </p>
          <SchemeFreshnessBanner freshness={freshness} />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {scheme.portalUrl ? (
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
              >
                Check PM-Vidyalaxmi Eligibility
                <span className="sr-only">
                  {' '}
                  — opens PM-Vidyalaxmi official portal, external site
                </span>
              </a>
            ) : null}
            <a
              href={scheme.eligibleInstitutionSourceUrl || scheme.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--el-navy)] underline-offset-2 hover:text-[var(--el-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
            >
              View Eligible Institutions →
              <span className="sr-only"> — opens external government site</span>
            </a>
            {scheme.portalUrl ? (
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 hover:text-[var(--el-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
              >
                Open Official Portal ↗<span className="sr-only"> — opens external site</span>
              </a>
            ) : null}
          </div>
          <ExternalPortalNote schemeName="PM-Vidyalaxmi" />
        </div>
      </div>
    </section>
  );
}

export function EducationLoanPmUspCsis({ schemes }: { schemes: EducationGovernmentScheme[] }) {
  const scheme = findEducationSchemeBySlug(schemes, 'pm-usp-csis');
  if (!scheme) return null;
  const freshness = governmentSchemeFreshness(scheme.lastVerifiedAt, new Date(), scheme.status);
  const showNumbers = schemeAllowsPublicNumericRules(freshness);

  return (
    <section
      id="el-pm-usp-csis"
      aria-labelledby="el-pm-usp-csis-heading"
      className="full-bleed bg-[var(--el-surface-4)]"
    >
      <div className="site-container el-section px-4">
        <div className="rounded-[var(--el-radius-md)] bg-white p-5 ring-1 ring-[var(--el-border)] sm:p-8">
          <p className="el-eyebrow">Interest Subsidy · Distinct Scheme</p>
          <h2 id="el-pm-usp-csis-heading" className="el-h2">
            PM-USP Central Sector Interest Subsidy
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--el-muted)]">
            Kept separate from PM-Vidyalaxmi — do not merge as one generic subsidy.
          </p>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                What the scheme provides
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {showNumbers
                  ? scheme.benefitSummary || scheme.description
                  : 'Latest eligibility details are currently being reviewed. Check the official source →'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Who it may apply to
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {scheme.eligibilitySummary}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Study / course conditions
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {scheme.courseRule || 'As defined in current official guidelines.'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Income conditions
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {showNumbers
                  ? 'Annual parental/family income criterion applies per current Ministry guidelines — confirm exact figures on the official source.'
                  : 'Latest eligibility details are currently being reviewed. Check the official source →'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Loan / subvention conditions
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {showNumbers
                  ? scheme.subventionPeriodSummary ||
                    'Confirm loan and subvention ceilings on official guidelines.'
                  : 'Latest eligibility details are currently being reviewed. Check the official source →'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--el-navy)]">
                Moratorium-related benefit
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                Interest subsidy during the moratorium for eligible borrowers, subject to current
                guidelines.
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-sm text-[var(--el-muted)]">
            <span className="font-semibold text-slate-700">Official source: </span>
            {scheme.ministryDepartment}
            <br />
            <span className="font-semibold text-slate-700">Last verified: </span>
            {formatSchemeVerifiedDate(scheme.lastVerifiedAt)}
          </p>
          <SchemeFreshnessBanner freshness={freshness} />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#el-government-support"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
            >
              Check Whether This Scheme May Apply
            </a>
            {(scheme.officialGuidelinesUrl || scheme.officialSourceUrl) && (
              <a
                href={scheme.officialGuidelinesUrl || scheme.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--el-navy)] underline-offset-2 hover:text-[var(--el-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
              >
                View Official Guidelines →
                <span className="sr-only"> — opens external government site</span>
              </a>
            )}
          </div>
          <ExternalPortalNote schemeName="PM-USP CSIS" />
        </div>
      </div>
    </section>
  );
}

export function EducationLoanOtherSupport() {
  return (
    <section
      id="el-other-support"
      aria-labelledby="el-other-support-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Other Support</p>
        <h2 id="el-other-support-heading" className="el-h2">
          Other Education Funding Support
        </h2>
        <p className="el-lede">
          Loan, interest subvention, scholarship and government credit guarantee are different
          mechanisms. This is not an unsourced scholarship directory.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Scholarships',
            'Interest Subsidies',
            'Government Loan Schemes',
            'State-level Schemes',
            'Institutional Aid',
          ].map((item) => (
            <li
              key={item}
              className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-2)] px-4 py-3 text-sm font-semibold text-[var(--el-navy)]"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--el-muted)]">
          Prefer official ministry, state education department and institution sources.
        </p>
      </div>
    </section>
  );
}

export function EducationLoanEmiAfterStudy() {
  const { loanRequired, studyInterest, emiAfterStudy, repaymentYears, ratePercent } =
    useEducationLoanDecision();
  const interestDuring =
    studyInterest != null ? Math.max(0, studyInterest.balanceAtRepaymentStart - loanRequired) : 0;
  const balance = studyInterest?.balanceAtRepaymentStart ?? loanRequired;

  return (
    <section
      id="el-emi-after-study"
      aria-labelledby="el-emi-after-study-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">EMI After Study</p>
        <h2 id="el-emi-after-study-heading" className="el-h2">
          What Could Your EMI Be After Graduation?
        </h2>
        <p className="el-lede">
          Repayment may start from the <strong>Balance at Repayment Start</strong> — not necessarily
          the original loan amount.
        </p>

        <ol className="mt-8 max-w-lg space-y-3" aria-label="Balance buildup before EMI">
          <li className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-2)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
              Original Loan
            </p>
            <p className="text-xl font-bold tabular-nums text-[var(--el-navy)]">
              {formatInr(loanRequired)}
            </p>
          </li>
          <li className="pl-2 text-sm font-semibold text-[var(--el-muted)]" aria-hidden>
            ↓
          </li>
          <li className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-3)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
              Study / Moratorium Interest
            </p>
            <p className="text-xl font-bold tabular-nums text-[var(--el-navy)]">
              {studyInterest ? `+ ${formatInr(Math.round(interestDuring))}` : '—'}
            </p>
          </li>
          <li className="pl-2 text-sm font-semibold text-[var(--el-muted)]" aria-hidden>
            ↓
          </li>
          <li className="rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Balance When EMI Starts
            </p>
            <p className="text-2xl font-bold tabular-nums text-white">
              {formatInr(Math.round(balance))}
            </p>
          </li>
        </ol>

        <dl className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="el-metric-label">Repayment Tenure</dt>
            <dd className="el-metric-value mt-1.5 text-2xl">{repaymentYears} years</dd>
          </div>
          <div>
            <dt className="el-metric-label">Estimated EMI</dt>
            <dd className="el-metric-value mt-1.5 text-2xl">
              {emiAfterStudy ? `${formatInr(Math.round(emiAfterStudy.monthlyEmi))}/month` : '—'}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[var(--el-muted)]">
          Illustrative at {ratePercent}% p.a. over {repaymentYears} years using shared
          reducing-balance EMI on the balance at repayment start.
        </p>
        <Link
          href={calculatorHref('education-loan-emi')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--el-navy)] underline-offset-2 hover:text-[var(--el-orange)] hover:underline"
        >
          Open Education Loan EMI Calculator →
        </Link>
      </div>
    </section>
  );
}

export function EducationLoanPrepayment() {
  const { studyInterest, loanRequired, ratePercent, repaymentYears } = useEducationLoanDecision();
  const outstanding = Math.round(studyInterest?.balanceAtRepaymentStart ?? loanRequired);
  const [prepay, setPrepay] = useState(Math.round(outstanding * 0.1));
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');

  const impact = useMemo(
    () =>
      estimateEducationLoanPrepaymentImpact({
        outstanding,
        annualRatePercent: ratePercent,
        remainingMonths: repaymentYears * 12,
        prepaymentAmount: prepay,
        mode,
      }),
    [outstanding, ratePercent, repaymentYears, prepay, mode],
  );

  return (
    <section
      id="el-prepayment"
      aria-labelledby="el-prepayment-heading"
      className="full-bleed bg-[var(--el-surface-2)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Early Repayment</p>
        <h2 id="el-prepayment-heading" className="el-h2">
          Could Early Repayment Reduce Your Education Loan Cost?
        </h2>
        <p className="el-lede">
          Illustrative interest impact. Prepayment charges are not fabricated — confirm with the
          lender.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Prepayment amount (₹)
            <input
              type="number"
              min={0}
              value={prepay}
              onChange={(e) => setPrepay(Number(e.target.value) || 0)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-700">Strategy</p>
            <div className="mt-1.5 flex gap-2">
              {(
                [
                  ['reduce-tenure', 'Reduce Tenure'],
                  ['reduce-emi', 'Reduce EMI'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={mode === key}
                  onClick={() => setMode(key)}
                  className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] ${
                    mode === key
                      ? 'bg-[var(--el-navy)] text-white'
                      : 'bg-[var(--el-surface-4)] text-[var(--el-navy)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {impact ? (
          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="el-metric-label">Potential Interest Saved (gross)</dt>
              <dd className="el-metric-value mt-1.5 text-3xl">
                {formatInr(Math.round(impact.interestSaved))}
              </dd>
            </div>
            {impact.mode === 'reduce-tenure' ? (
              <div>
                <dt className="el-metric-label">Potential Time Saved</dt>
                <dd className="el-metric-value mt-1.5 text-3xl">{impact.monthsSaved} months</dd>
              </div>
            ) : (
              <div>
                <dt className="el-metric-label">Revised EMI</dt>
                <dd className="el-metric-value mt-1.5 text-3xl">
                  {formatInr(Math.round(impact.revised.monthlyEmi))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-6 text-sm text-[var(--el-muted)]">
            Enter a prepayment amount less than outstanding to see illustrative savings.
          </p>
        )}
        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--el-navy)] underline-offset-2 hover:text-[var(--el-orange)] hover:underline"
        >
          Open Prepayment Calculator →
        </Link>
      </div>
    </section>
  );
}

export function EducationLoanDocuments() {
  const groups = [
    {
      title: 'Student Documents',
      items: ['Identity', 'Address proof', 'Academic records'],
    },
    {
      title: 'Academic / Admission',
      items: ['Admission letter', 'Course details', 'Fee structure'],
    },
    {
      title: 'Co-applicant',
      items: ['Identity', 'Address', 'Income', 'Banking / financial documents'],
    },
    {
      title: 'Financial',
      items: ['Bank statements', 'ITR / income proofs where applicable'],
    },
    {
      title: 'Study Abroad',
      items: [
        'Passport',
        'Visa where applicable',
        'Foreign institution documents',
        'Cost estimates',
      ],
    },
    {
      title: 'Collateral — If Applicable',
      items: ['Security documents as required by the product'],
    },
  ];

  return (
    <section
      id="el-documents"
      aria-labelledby="el-documents-heading"
      className="full-bleed bg-[var(--el-surface-2)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Documents</p>
        <h2 id="el-documents-heading" className="el-h2">
          Application Readiness Checklist
        </h2>
        <p className="el-lede">
          Exact requirements vary by lender, course, institution, study destination and loan
          structure.
        </p>

        {/* Mobile: accordions */}
        <div className="mt-8 space-y-2 sm:hidden">
          {groups.map((g) => (
            <details
              key={g.title}
              className="group rounded-[var(--el-radius-md)] bg-white ring-1 ring-[var(--el-border)] open:ring-[var(--el-navy)]/20"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]">
                {g.title}
                <span className="text-[var(--el-muted)] group-open:rotate-180" aria-hidden>
                  ▾
                </span>
              </summary>
              <ul className="space-y-2 border-t border-[var(--el-border)] px-4 py-3">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden>☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <article key={g.title} className="bg-white p-5 ring-1 ring-[var(--el-border)]">
              <h3 className="text-sm font-bold text-[var(--el-navy)]">{g.title}</h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden>☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EducationLoanDisbursement() {
  return (
    <section
      id="el-disbursement"
      aria-labelledby="el-disbursement-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Disbursement</p>
        <h2 id="el-disbursement-heading" className="el-h2">
          How Education Loan Disbursement May Work
        </h2>
        <p className="el-lede">
          Education loans may be remitted to institutions and can be staged depending on
          lender/product. Exact process is not identical across banks.
        </p>
        <ol className="mt-8 space-y-0">
          {EDUCATION_LOAN_DISBURSEMENT_STEPS.map((step, i) => {
            const isLast = i === EDUCATION_LOAN_DISBURSEMENT_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--el-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--el-navy)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="pt-1 text-sm font-semibold text-[var(--el-navy)]">{step}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function EducationLoanApplicationJourney() {
  return (
    <section
      id="el-application-journey"
      aria-labelledby="el-application-journey-heading"
      className="full-bleed bg-[var(--el-surface-4)]"
    >
      <div className="site-container el-section px-4">
        <h2 id="el-application-journey-heading" className="el-h2">
          How an Education Loan Typically Progresses
        </h2>
        <p className="el-lede">
          From cost estimate through course period, moratorium and repayment. Steps may vary by
          lender and scheme.
        </p>

        {/* Desktop: multi-row connected timeline */}
        <ol
          className="mt-8 hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4"
          aria-label="Application journey"
        >
          {EDUCATION_LOAN_TIMELINE_STEPS.map((step, index) => (
            <li
              key={step}
              className="relative rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--el-navy)]">{step}</p>
              {index < EDUCATION_LOAN_TIMELINE_STEPS.length - 1 ? (
                <span
                  className="absolute -right-2 top-1/2 hidden text-[var(--el-muted)] lg:inline"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        {/* Mobile: vertical */}
        <ol className="relative mt-8 space-y-0 md:hidden">
          {EDUCATION_LOAN_TIMELINE_STEPS.map((step, index) => {
            const isLast = index === EDUCATION_LOAN_TIMELINE_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--el-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--el-navy)]/20 bg-white text-xs font-bold text-[var(--el-navy)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--el-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
