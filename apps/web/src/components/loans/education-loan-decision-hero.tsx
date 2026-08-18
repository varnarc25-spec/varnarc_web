'use client';

import { CmsMediaImage } from '@/components/cms/cms-media-image';
import { formatInr } from '@/components/loans/loan-format';
import { useEducationLoanDecision } from '@/components/loans/education-loan-decision-context';
import { EDUCATION_LOAN_ILLUSTRATIVE_RATE } from '@/lib/education-loan-page';

const chip =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] focus-visible:ring-offset-2';

function MoneyInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
      />
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-[var(--el-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function EducationLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const {
    studyLocation,
    setStudyLocation,
    tuition,
    setTuition,
    living,
    setLiving,
    books,
    setBooks,
    travel,
    setTravel,
    other,
    setOther,
    ownContribution,
    setOwnContribution,
    totalCost,
    loanRequired,
    courseYears,
    setCourseYears,
  } = useEducationLoanDecision();

  return (
    <header className="el-hero relative overflow-hidden">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="min-w-0">
          <p className="el-eyebrow">Education Financing Planner</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--el-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Education Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--el-muted)] sm:text-[0.9375rem]">
            Estimate your total study cost, funding gap, study-period interest and future EMI before
            comparing Education Loan options.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('el-snapshot')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
                Study destination
              </p>
              <div
                className="mt-2 inline-flex w-full flex-wrap rounded-full bg-[var(--el-surface-2)] p-1 sm:w-auto"
                role="group"
                aria-label="Study destination"
              >
                {(
                  [
                    ['india', 'Study in India'],
                    ['abroad', 'Study Abroad'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={studyLocation === key}
                    onClick={() => setStudyLocation(key)}
                    className={`${chip} flex-1 sm:flex-none ${
                      studyLocation === key
                        ? 'bg-[var(--el-navy)] text-white'
                        : 'bg-transparent text-[var(--el-navy)] hover:bg-white/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MoneyInput label="Tuition / Course Fees (₹)" value={tuition} onChange={setTuition} />
              <MoneyInput
                label="Living / Hostel Expenses (₹)"
                value={living}
                onChange={setLiving}
              />
              <MoneyInput label="Books / Equipment (₹)" value={books} onChange={setBooks} />
              <MoneyInput
                label={studyLocation === 'abroad' ? 'Travel (₹)' : 'Local Travel (₹)'}
                value={travel}
                onChange={setTravel}
                hint="May be considered depending on lender/product terms."
              />
              <MoneyInput
                label={
                  studyLocation === 'abroad'
                    ? 'Visa / Insurance / Institution Charges (₹)'
                    : 'Institution / Other Charges (₹)'
                }
                value={other}
                onChange={setOther}
                hint="May be considered depending on lender/product terms."
              />
              <MoneyInput
                label="Own Contribution / Savings (₹)"
                value={ownContribution}
                onChange={setOwnContribution}
              />
              <label className="block text-xs font-semibold text-slate-700">
                Course Duration (years)
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={courseYears}
                  onChange={(e) => setCourseYears(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
                />
              </label>
            </div>
            {studyLocation === 'abroad' ? (
              <p className="text-xs leading-relaxed text-[var(--el-muted)]">
                Abroad planning uses INR amounts. Live FX conversion is not wired on this page —
                convert foreign-currency estimates to INR before entering figures. Rates are never
                hardcoded here.
              </p>
            ) : null}

            <div className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-3)] p-4 sm:p-5">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="el-metric-label">Total Education Cost</dt>
                  <dd className="el-metric-value mt-1 text-xl sm:text-2xl">
                    {formatInr(totalCost)}
                  </dd>
                </div>
                <div>
                  <dt className="el-metric-label">Loan Required</dt>
                  <dd className="el-metric-value mt-1 text-xl sm:text-2xl">
                    {formatInr(loanRequired)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-5 text-sm font-semibold !text-white transition hover:bg-[var(--el-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
              >
                Plan My Education Loan
              </button>
              <a
                href="#el-government-support"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition hover:text-[var(--el-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]"
              >
                Check Government Support →
              </a>
            </div>
            <p className="text-xs text-[var(--el-muted)]">
              Illustrative planning only. EMI and interest snapshots use a labeled default of{' '}
              {EDUCATION_LOAN_ILLUSTRATIVE_RATE}% p.a. unless you adjust the rate. Government
              eligibility is never assumed from this planner alone.
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
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--el-orange-soft)] opacity-55"
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
