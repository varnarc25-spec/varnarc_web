'use client';

import { useMemo } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useEducationLoanDecision } from '@/components/loans/education-loan-decision-context';
import {
  estimateEmiAfterStudy,
  estimateStudyPeriodInterest,
  type EducationInterestMode,
} from '@/lib/education-loan-page';
function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
      />
    </label>
  );
}

export function EducationLoanCostBreakdown() {
  const { tuition, living, books, travel, other, totalCost, studyLocation } =
    useEducationLoanDecision();
  const rows = [
    { label: 'Tuition / Course Fee', value: tuition },
    { label: 'Hostel / Living Expenses', value: living },
    { label: 'Books / Equipment', value: books },
    {
      label: studyLocation === 'abroad' ? 'Travel' : 'Local Travel',
      value: travel,
    },
    {
      label:
        studyLocation === 'abroad'
          ? 'Visa / Insurance / Institution Charges'
          : 'Institution / Other Charges',
      value: other,
    },
  ].filter((r) => r.value > 0 || r.label.includes('Tuition') || r.label.includes('Living'));

  return (
    <section
      id="el-cost-breakdown"
      aria-labelledby="el-cost-breakdown-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Cost of Study</p>
        <h2 id="el-cost-breakdown-heading" className="el-h2">
          What Makes Up Your Education Cost?
        </h2>
        <p className="el-lede">
          May be considered depending on lender/product terms. Do not assume every expense is
          financed.
        </p>
        <ul className="mt-8 space-y-3">
          {rows.map((row) => {
            const pct = totalCost > 0 ? (row.value / totalCost) * 100 : 0;
            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--el-navy)]">{row.label}</span>
                  <span className="font-bold tabular-nums text-[var(--el-navy)]">
                    {formatInr(row.value)}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--el-surface-4)]"
                  role="img"
                  aria-label={`${row.label} ${pct.toFixed(0)} percent of total cost`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--el-navy)]"
                    style={{ width: `${Math.min(100, Math.max(pct, 0))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-sm font-bold text-[var(--el-navy)]">
          Total: {formatInr(totalCost)}
        </p>
      </div>
    </section>
  );
}

export function EducationLoanIndiaAbroad() {
  const { studyLocation, setStudyLocation } = useEducationLoanDecision();
  return (
    <section
      id="el-india-abroad"
      aria-labelledby="el-india-abroad-heading"
      className="full-bleed bg-[var(--el-surface-4)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">India vs Abroad</p>
        <h2 id="el-india-abroad-heading" className="el-h2">
          Domestic vs Overseas Study Costs
        </h2>
        <p className="el-lede">
          Cost structures and documentation needs differ. Final loan planning values stay in INR.
          Live FX conversion is deferred until a trusted rate service is wired — convert abroad
          costs to INR before planning. Rates are never hardcoded on this page.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(
            [
              {
                key: 'india' as const,
                title: 'Study in India',
                focus: 'University · Hostel · Books',
                points: [
                  'Tuition',
                  'Hostel / living',
                  'Books & equipment',
                  'Local travel',
                  'Institution fees',
                ],
              },
              {
                key: 'abroad' as const,
                title: 'Study Abroad',
                focus: 'University · Globe · Travel · Visa · Insurance',
                points: [
                  'Tuition',
                  'Accommodation & living',
                  'Travel',
                  'Visa & insurance',
                  'Books / equipment',
                  'Other academic costs',
                ],
              },
            ] as const
          ).map((panel) => (
            <button
              key={panel.key}
              type="button"
              aria-pressed={studyLocation === panel.key}
              onClick={() => setStudyLocation(panel.key)}
              className={`rounded-[var(--el-radius-md)] p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] ${
                studyLocation === panel.key
                  ? panel.key === 'abroad'
                    ? 'bg-white ring-2 ring-[var(--el-navy)]/25'
                    : 'bg-white ring-2 ring-[var(--el-navy)]/20'
                  : 'bg-[var(--el-surface-1)] hover:bg-white'
              }`}
            >
              <h3 className="text-lg font-bold text-[var(--el-navy)]">{panel.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
                {panel.focus}
              </p>
              <ul className="mt-3 space-y-2">
                {panel.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--el-orange)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EducationLoanFundingGap() {
  const {
    totalCost,
    ownContribution,
    setOwnContribution,
    scholarship,
    setScholarship,
    loanRequired,
  } = useEducationLoanDecision();
  const surplus = Math.max(0, ownContribution + scholarship - totalCost);
  const ownPct = totalCost > 0 ? Math.min(100, (ownContribution / totalCost) * 100) : 0;
  const schPct = totalCost > 0 ? Math.min(100, (scholarship / totalCost) * 100) : 0;
  const loanPct = totalCost > 0 ? (loanRequired / totalCost) * 100 : 0;

  return (
    <section
      id="el-funding-gap"
      aria-labelledby="el-funding-gap-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Funding Gap</p>
        <h2 id="el-funding-gap-heading" className="el-h2">
          How Much Education Loan Do You Need?
        </h2>
        <p className="el-lede">
          Total Education Cost − Own Contribution − Scholarship / Grant = Funding Gap / Loan
          Required. Scholarships default to ₹0 and are never assumed.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MoneyField
            label="Own Contribution (₹)"
            value={ownContribution}
            onChange={setOwnContribution}
          />
          <MoneyField
            label="Scholarship / Grant (₹) — optional, default ₹0"
            value={scholarship}
            onChange={setScholarship}
          />
        </div>
        <div className="mt-8 max-w-3xl bg-[var(--el-surface-2)] px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--el-muted)]">
            Total Cost {formatInr(totalCost)}
          </p>
          <div
            className="mt-4 flex h-12 overflow-hidden rounded-[var(--el-radius-sm)]"
            role="img"
            aria-label={`Own funds ${formatInr(ownContribution) ?? ''}. Scholarship ${formatInr(scholarship) ?? ''}. Loan required ${formatInr(loanRequired) ?? ''}.`}
          >
            <div
              className="flex items-center justify-center bg-[var(--el-orange)] px-1 text-xs font-semibold text-white"
              style={{ width: `${Math.max(ownPct, 0)}%`, minWidth: ownPct > 0 ? '2.5rem' : 0 }}
            >
              {ownPct >= 12 ? 'Own' : null}
            </div>
            <div
              className="flex items-center justify-center bg-[#94a3b8] px-1 text-xs font-semibold text-white"
              style={{ width: `${Math.max(schPct, 0)}%`, minWidth: schPct > 0 ? '2.5rem' : 0 }}
            >
              {schPct >= 12 ? 'Aid' : null}
            </div>
            <div
              className="flex flex-1 items-center justify-center bg-[var(--el-navy)] px-1 text-xs font-semibold text-white"
              style={{ minWidth: loanPct > 0 ? '2.5rem' : 0 }}
            >
              {loanPct >= 12 ? 'Loan' : null}
            </div>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--el-muted)]">Own Funds</dt>
              <dd className="font-bold tabular-nums text-[var(--el-navy)]">
                {formatInr(ownContribution)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--el-muted)]">Scholarship</dt>
              <dd className="font-bold tabular-nums text-[var(--el-navy)]">
                {formatInr(scholarship)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--el-muted)]">Loan Required</dt>
              <dd className="font-bold tabular-nums text-[var(--el-navy)]">
                {formatInr(loanRequired)}
              </dd>
            </div>
          </dl>
          {surplus > 0 ? (
            <p className="mt-4 text-sm font-semibold text-[var(--el-navy)]">
              Remaining surplus after covering cost: {formatInr(surplus)} (loan required is ₹0)
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function EducationLoanStudyInterest() {
  const {
    loanRequired,
    ratePercent,
    courseMonths,
    courseYears,
    setCourseYears,
    moratoriumMonths,
    setMoratoriumMonths,
    interestMode,
    setInterestMode,
    studyInterest,
    repaymentYears,
    setRepaymentYears,
    emiAfterStudy,
  } = useEducationLoanDecision();

  return (
    <section
      id="el-study-interest"
      aria-labelledby="el-study-interest-heading"
      className="full-bleed bg-[var(--el-surface-1)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Study-Period Interest</p>
        <h2 id="el-study-interest-heading" className="el-h2">
          What Happens to Interest While You Study?
        </h2>
        <p className="el-lede">
          One of the strongest Education Loan planning questions. Models are illustrative — lender
          capitalization methods may differ.
        </p>

        <div className="mt-5">
          <p className="el-metric-label">Interest treatment</p>
          <div
            className="mt-2 inline-flex w-full flex-wrap rounded-full bg-[var(--el-surface-2)] p-1 sm:w-auto"
            role="group"
            aria-label="Interest during study"
          >
            {(
              [
                ['pay-during-study', 'Pay Interest During Study'],
                ['capitalize', 'Allow Interest to Accumulate'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={interestMode === key}
                onClick={() => setInterestMode(key as EducationInterestMode)}
                className={`min-h-11 flex-1 rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)] sm:flex-none ${
                  interestMode === key
                    ? 'bg-[var(--el-navy)] text-white'
                    : 'bg-transparent text-[var(--el-navy)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">
            Course duration (years)
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.5}
              value={courseYears}
              onChange={(e) => setCourseYears(Math.max(0.5, Number(e.target.value) || 0.5))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
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
          <label className="block text-xs font-semibold text-slate-700">
            Repayment tenure (years)
            <input
              type="number"
              min={1}
              max={20}
              value={repaymentYears}
              onChange={(e) => setRepaymentYears(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--el-radius-md)] border border-[var(--el-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--el-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--el-orange)]/30"
            />
          </label>
          <div className="rounded-[var(--el-radius-md)] bg-[var(--el-surface-2)] p-4 text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
            Loan {formatInr(loanRequired)} · Rate {ratePercent}% · Course {courseMonths} mo +
            moratorium {moratoriumMonths} mo
          </div>
        </div>

        {studyInterest ? (
          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="el-metric-label">Interest During Study</dt>
              <dd className="el-metric-value mt-1.5 text-2xl sm:text-3xl">
                {formatInr(Math.round(studyInterest.interestDuringStudy))}
              </dd>
            </div>
            <div>
              <dt className="el-metric-label">Cash Outflow During Study</dt>
              <dd className="el-metric-value mt-1.5 text-2xl sm:text-3xl">
                {formatInr(Math.round(studyInterest.cashOutflowDuringStudy))}
              </dd>
            </div>
            <div>
              <dt className="el-metric-label">Balance at Repayment Start</dt>
              <dd className="el-metric-value mt-1.5 text-2xl sm:text-3xl">
                {formatInr(Math.round(studyInterest.balanceAtRepaymentStart))}
              </dd>
            </div>
            <div>
              <dt className="el-metric-label">Est. EMI After Study</dt>
              <dd className="el-metric-value mt-1.5 text-2xl sm:text-3xl">
                {emiAfterStudy ? formatInr(Math.round(emiAfterStudy.monthlyEmi)) : '—'}
                <span className="ml-1 text-base font-semibold text-[var(--el-muted)]">/mo</span>
              </dd>
            </div>
          </dl>
        ) : null}

        {studyInterest ? (
          <p className="mt-5 text-xs leading-relaxed text-[var(--el-muted)]">
            {studyInterest.calculationBasis}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function EducationLoanPayVsCapitalize() {
  const { loanRequired, ratePercent, courseMonths, moratoriumMonths, repaymentYears } =
    useEducationLoanDecision();

  const compare = useMemo(() => {
    const pay = estimateStudyPeriodInterest({
      loanAmount: loanRequired,
      annualRatePercent: ratePercent,
      courseMonths,
      moratoriumMonths,
      mode: 'pay-during-study',
    });
    const cap = estimateStudyPeriodInterest({
      loanAmount: loanRequired,
      annualRatePercent: ratePercent,
      courseMonths,
      moratoriumMonths,
      mode: 'capitalize',
    });
    const payEmi = pay
      ? estimateEmiAfterStudy({
          balanceAtRepaymentStart: pay.balanceAtRepaymentStart,
          annualRatePercent: ratePercent,
          repaymentYears,
        })
      : null;
    const capEmi = cap
      ? estimateEmiAfterStudy({
          balanceAtRepaymentStart: cap.balanceAtRepaymentStart,
          annualRatePercent: ratePercent,
          repaymentYears,
        })
      : null;
    const balanceDiff =
      pay && cap ? cap.balanceAtRepaymentStart - pay.balanceAtRepaymentStart : null;
    const totalDiff =
      payEmi && capEmi
        ? capEmi.totalRepayment +
          (cap?.cashOutflowDuringStudy ?? 0) -
          (payEmi.totalRepayment + (pay?.cashOutflowDuringStudy ?? 0))
        : null;
    const monthlyDuringPay =
      pay && courseMonths + moratoriumMonths > 0
        ? pay.cashOutflowDuringStudy / (courseMonths + moratoriumMonths)
        : 0;
    return { pay, cap, payEmi, capEmi, balanceDiff, totalDiff, monthlyDuringPay };
  }, [loanRequired, ratePercent, courseMonths, moratoriumMonths, repaymentYears]);

  return (
    <section
      id="el-pay-vs-capitalize"
      aria-labelledby="el-pay-vs-capitalize-heading"
      className="full-bleed bg-[var(--el-surface-3)]"
    >
      <div className="site-container el-section px-4">
        <p className="el-eyebrow">Study-Period Interest</p>
        <h2 id="el-pay-vs-capitalize-heading" className="el-h2">
          What Happens to Interest While You Study?
        </h2>
        <p className="el-lede">
          Side-by-side comparison using the planner engine. Paying interest during study is not
          always better — cash flow during study matters. Lenders may calculate study-period
          interest differently.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="bg-[var(--el-surface-1)] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--el-muted)]">
              Option A
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--el-navy)]">
              Pay Interest During Study
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">During-study monthly payment</dt>
                <dd className="font-bold tabular-nums">
                  {compare.pay ? formatInr(Math.round(compare.monthlyDuringPay)) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Balance at repayment start</dt>
                <dd className="font-bold tabular-nums">
                  {compare.pay ? formatInr(Math.round(compare.pay.balanceAtRepaymentStart)) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Estimated EMI after study</dt>
                <dd className="font-bold tabular-nums">
                  {compare.payEmi ? formatInr(Math.round(compare.payEmi.monthlyEmi)) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Total repayment (incl. study cash)</dt>
                <dd className="font-bold tabular-nums">
                  {compare.pay && compare.payEmi
                    ? formatInr(
                        Math.round(
                          compare.pay.cashOutflowDuringStudy + compare.payEmi.totalRepayment,
                        ),
                      )
                    : '—'}
                </dd>
              </div>
            </dl>
            <ol
              className="mt-5 space-y-1 text-xs text-[var(--el-muted)]"
              aria-label="Option A balance path"
            >
              <li>Original Loan {formatInr(loanRequired)}</li>
              <li>↓ Interest serviced during study</li>
              <li>
                Balance When EMI Starts{' '}
                {compare.pay ? formatInr(Math.round(compare.pay.balanceAtRepaymentStart)) : '—'}
              </li>
            </ol>
          </article>

          <article className="bg-[var(--el-surface-2)] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--el-muted)]">
              Option B
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--el-navy)]">
              Allow Interest to Accumulate
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">During-study monthly payment</dt>
                <dd className="font-bold tabular-nums">₹0</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Balance at repayment start</dt>
                <dd className="font-bold tabular-nums">
                  {compare.cap ? formatInr(Math.round(compare.cap.balanceAtRepaymentStart)) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Estimated EMI after study</dt>
                <dd className="font-bold tabular-nums">
                  {compare.capEmi ? formatInr(Math.round(compare.capEmi.monthlyEmi)) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--el-muted)]">Total repayment</dt>
                <dd className="font-bold tabular-nums">
                  {compare.capEmi ? formatInr(Math.round(compare.capEmi.totalRepayment)) : '—'}
                </dd>
              </div>
            </dl>
            <ol
              className="mt-5 space-y-1 text-xs text-[var(--el-muted)]"
              aria-label="Option B balance path"
            >
              <li>Original Loan {formatInr(loanRequired)}</li>
              <li>
                ↓ Study Period Interest +
                {compare.cap ? formatInr(Math.round(compare.cap.interestDuringStudy)) : '—'}
              </li>
              <li>
                Balance When EMI Starts{' '}
                {compare.cap ? formatInr(Math.round(compare.cap.balanceAtRepaymentStart)) : '—'}
              </li>
            </ol>
          </article>
        </div>

        {(compare.balanceDiff != null || compare.totalDiff != null) && (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--el-radius-md)] bg-[var(--el-navy)] p-5 text-white">
              <dt className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Difference at Repayment Start
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">
                {formatInr(Math.round(Math.abs(compare.balanceDiff ?? 0)))}
              </dd>
            </div>
            <div className="rounded-[var(--el-radius-md)] bg-white p-5 ring-1 ring-[var(--el-border)]">
              <dt className="el-metric-label">Difference in Total Repayment</dt>
              <dd className="el-metric-value mt-1 text-2xl">
                {formatInr(Math.round(Math.abs(compare.totalDiff ?? 0)))}
              </dd>
            </div>
          </dl>
        )}

        <p className="mt-5 text-xs leading-relaxed text-[var(--el-muted)]">
          Illustrative assumption: simple interest accrues during the selected study/moratorium
          period (principal × rate × months / 1200) and, when not paid, is added to the
          repayment-start balance. This is not how every lender capitalizes interest.
        </p>
      </div>
    </section>
  );
}
