'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AFFORDABILITY_CALC_VERSION,
  calculateConstructionAffordability,
  type AffordabilityCostResult,
} from '@varnarc/validation';
import {
  CalculationBreakdown,
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import {
  categorizeConstructionResultRange,
  trackCalculatorCompleted,
  trackCalculatorError,
} from '@/lib/construction/analytics';
import {
  clearConstructionCalculationSave,
  publishConstructionCalculationSave,
} from '@/lib/construction/save-calculation/publish';
import { AFFORD_CALC_FAQS, AFFORD_CALC_RELATED, AFFORD_SEO_INTRO } from './content';

const STORAGE_KEY = 'varnarc.construction.affordability-calculator.v1';
const COST_CALC_STORAGE = 'varnarc.construction.cost-calculator.v1';
const CALC_TYPE = 'construction_affordability_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  estimatedProjectCost: string;
  availableSavings: string;
  expectedLoanAmount: string;
  monthlyIncome: string;
  monthlyEmi: string;
  constructionDurationMonths: string;
  contingencyReservePercent: string;
  contingencyAlreadyPercent: string;
  sourceLabel: string;
};

const DEFAULT_FORM: FormState = {
  estimatedProjectCost: '5000000',
  availableSavings: '2000000',
  expectedLoanAmount: '3000000',
  monthlyIncome: '',
  monthlyEmi: '',
  constructionDurationMonths: '18',
  contingencyReservePercent: '10',
  contingencyAlreadyPercent: '10',
  sourceLabel: '',
};

function parseInitial(params?: Record<string, string | undefined>): FormState {
  const next = { ...DEFAULT_FORM };
  if (!params) return next;
  const cost = params.projectCost || params.estimatedCost || params.cost || params.amount;
  if (cost) next.estimatedProjectCost = cost.replace(/[^\d.]/g, '');
  if (params.savings) next.availableSavings = params.savings.replace(/[^\d.]/g, '');
  if (params.loan) next.expectedLoanAmount = params.loan.replace(/[^\d.]/g, '');
  if (params.income) next.monthlyIncome = params.income.replace(/[^\d.]/g, '');
  if (params.emi) next.monthlyEmi = params.emi.replace(/[^\d.]/g, '');
  if (params.duration || params.months) {
    next.constructionDurationMonths = (params.duration || params.months)!;
  }
  if (params.contingency || params.contingencyReservePercent) {
    next.contingencyReservePercent = (params.contingencyReservePercent || params.contingency)!;
  }
  if (params.source) next.sourceLabel = params.source;
  return next;
}

function tryImportFromCostCalculator(): Partial<FormState> | null {
  try {
    const raw = localStorage.getItem(COST_CALC_STORAGE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as {
      form?: { builtUpArea?: string; location?: string; quality?: string };
      lastTotal?: number;
    };
    // Prefer an explicit lastTotal if a future save writes it; else leave blank
    if (typeof saved.lastTotal === 'number' && saved.lastTotal > 0) {
      const loc = saved.form?.location ?? 'Varnarc cost calculator';
      const quality = saved.form?.quality ?? '';
      return {
        estimatedProjectCost: String(Math.round(saved.lastTotal)),
        sourceLabel: `Linked: ${loc}${quality ? ` (${quality})` : ''}`,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function AffordabilityCalculatorClient({
  initialParams,
}: {
  initialParams?: Record<string, string | undefined>;
}) {
  const [form, setForm] = useState<FormState>(() => parseInitial(initialParams));
  const [result, setResult] = useState<AffordabilityCostResult | null>(null);
  const [compare, setCompare] = useState<AffordabilityCostResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialParams?.projectCost && !initialParams?.cost) {
        const saved = JSON.parse(raw) as { form?: FormState };
        if (saved.form) setForm({ ...DEFAULT_FORM, ...saved.form });
      } else if (!initialParams?.projectCost && !initialParams?.cost) {
        const imported = tryImportFromCostCalculator();
        if (imported) setForm((prev) => ({ ...prev, ...imported }));
      }
    } catch {
      /* ignore */
    }
  }, [initialParams]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function runCalculate() {
    setError(null);
    setActionMsg(null);
    try {
      const cost = Number(form.estimatedProjectCost);
      if (!cost || cost <= 0) {
        setError('Enter an estimated project cost (or link a Varnarc calculation).');
        return;
      }
      const payload = {
        estimatedProjectCost: cost,
        availableSavings: Number(form.availableSavings) || 0,
        expectedLoanAmount: Number(form.expectedLoanAmount) || 0,
        monthlyIncome: form.monthlyIncome.trim() ? Number(form.monthlyIncome) : null,
        monthlyEmi: form.monthlyEmi.trim() ? Number(form.monthlyEmi) : null,
        constructionDurationMonths: Math.max(
          1,
          Math.round(Number(form.constructionDurationMonths) || 18),
        ),
        contingencyReservePercent: Number(form.contingencyReservePercent) || 0,
        contingencyAlreadyPercent: Number(form.contingencyAlreadyPercent) || 10,
        sourceLabel: form.sourceLabel.trim() || null,
      };
      const next = calculateConstructionAffordability(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'affordability-calculator',
        methodologyVersionLabel: next.version ?? AFFORDABILITY_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/affordability-calculator',
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, savedAt: Date.now() }));
      } catch {
        /* ignore */
      }
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        result_range_category: categorizeConstructionResultRange(next.totalFundingNeed),
        logged_in: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setResult(null);
      clearConstructionCalculationSave();
      trackCalculatorError({
        calculator_type: CALC_TYPE,
        error_code: 'calc_failed',
        logged_in: false,
      });
    }
  }

  const statusLabel =
    result?.status === 'surplus'
      ? 'Funding surplus'
      : result?.status === 'gap'
        ? 'Funding gap'
        : 'Roughly balanced';

  const statusHint =
    result?.status === 'surplus'
      ? 'Available funds exceed the project cost plus your contingency reserve (indicative).'
      : result?.status === 'gap'
        ? 'Available funds fall short of the total funding need — consider scope, quality or funding changes.'
        : 'Available funds are close to the total funding need (within a small planning tolerance).';

  const breakdownRows = useMemo(() => {
    if (!result) return [];
    return [
      {
        id: 'cost',
        label: 'Estimated project cost',
        value: formatInr(result.estimatedProjectCost),
      },
      {
        id: 'reserve',
        label: `Contingency reserve (${result.contingencyReservePercent}%)`,
        value: formatInr(result.contingencyReserveAmount),
      },
      { id: 'need', label: 'Total funding need', value: formatInr(result.totalFundingNeed) },
      { id: 'savings', label: 'Available savings', value: formatInr(result.availableSavings) },
      { id: 'loan', label: 'Expected loan', value: formatInr(result.expectedLoanAmount) },
      { id: 'funds', label: 'Available funds', value: formatInr(result.availableFunds) },
      {
        id: 'diff',
        label: statusLabel,
        value: formatInr(Math.abs(result.fundingDifference)),
      },
    ];
  }, [result, statusLabel]);

  const qualityHref = '/construction/cost-calculator?quality=basic';
  const reduceAreaHref = '/construction/cost-calculator?builtUpArea=1200&quality=standard';

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={(e) => {
        e.preventDefault();
        runCalculate();
      }}
      onReset={() => {
        setForm(DEFAULT_FORM);
        setResult(null);
        setCompare(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Check affordability"
    >
      <CalculatorInput
        id="project-cost"
        label="Estimated project cost (₹)"
        required
        type="number"
        min={1}
        value={form.estimatedProjectCost}
        onChange={(e) => setField('estimatedProjectCost', e.target.value)}
        hint="Paste a total from the cost calculator, or enter manually"
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
          Open cost calculator
        </Link>
        <Link href="/construction/projects" className={cx.secondaryBtn}>
          Link saved project
        </Link>
        <button
          type="button"
          className={cx.secondaryBtn}
          onClick={() => {
            const imported = tryImportFromCostCalculator();
            if (imported?.estimatedProjectCost) {
              setForm((prev) => ({ ...prev, ...imported }));
              setActionMsg('Imported the last saved cost-calculator total if available.');
            } else {
              setActionMsg(
                'No linked total found. Calculate on the Cost Calculator first, or paste the amount.',
              );
            }
          }}
        >
          Import linked calculation
        </button>
      </div>

      {form.sourceLabel ? (
        <p className="sm:col-span-2 text-xs text-slate-500">Source: {form.sourceLabel}</p>
      ) : null}

      <CalculatorInput
        id="savings"
        label="Available savings (₹)"
        type="number"
        min={0}
        value={form.availableSavings}
        onChange={(e) => setField('availableSavings', e.target.value)}
      />
      <CalculatorInput
        id="loan"
        label="Expected loan amount (₹)"
        type="number"
        min={0}
        value={form.expectedLoanAmount}
        onChange={(e) => setField('expectedLoanAmount', e.target.value)}
      />
      <CalculatorInput
        id="duration"
        label="Construction duration (months)"
        type="number"
        min={1}
        max={120}
        value={form.constructionDurationMonths}
        onChange={(e) => setField('constructionDurationMonths', e.target.value)}
      />
      <CalculatorInput
        id="reserve"
        label="Contingency reserve (%)"
        type="number"
        min={0}
        max={40}
        value={form.contingencyReservePercent}
        onChange={(e) => setField('contingencyReservePercent', e.target.value)}
        hint="Extra buffer held on top of the project cost"
      />
      <CalculatorInput
        id="already"
        label="Contingency already in estimate (%)"
        type="number"
        min={0}
        max={40}
        value={form.contingencyAlreadyPercent}
        onChange={(e) => setField('contingencyAlreadyPercent', e.target.value)}
        hint="For assumptions only"
      />

      <fieldset className="sm:col-span-2">
        <legend className={cx.label}>Optional financing (informational)</legend>
        <p className={cx.helper}>
          EMI and income are used only to show an EMI-to-income ratio — not eligibility or advice.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <CalculatorInput
            id="income"
            label="Monthly income (₹)"
            type="number"
            min={0}
            value={form.monthlyIncome}
            onChange={(e) => setField('monthlyIncome', e.target.value)}
          />
          <CalculatorInput
            id="emi"
            label="Monthly EMI (₹)"
            type="number"
            min={0}
            value={form.monthlyEmi}
            onChange={(e) => setField('monthlyEmi', e.target.value)}
          />
        </div>
      </fieldset>

      {error ? (
        <p className="sm:col-span-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {actionMsg ? <p className="sm:col-span-2 text-xs text-slate-600">{actionMsg}</p> : null}
    </CalculatorForm>
  );

  const resultNode = result ? (
    <div className="space-y-4 print:space-y-3">
      <CalculationResult
        label={statusLabel}
        value={formatInr(Math.abs(result.fundingDifference))}
        hint={statusHint}
        metrics={[
          {
            id: 'cost',
            label: 'Estimated project cost',
            value: formatInr(result.estimatedProjectCost),
          },
          { id: 'funds', label: 'Available funds', value: formatInr(result.availableFunds) },
          {
            id: 'need',
            label: 'Total funding need',
            value: formatInr(result.totalFundingNeed),
          },
          {
            id: 'rec',
            label: 'Recommended contingency',
            value: `${formatInr(result.recommendedContingencyAmount)} (${result.recommendedContingencyPercent}%)`,
          },
          {
            id: 'monthly',
            label: 'Indicative monthly cash',
            value: formatInr(result.monthlyCashRequirement),
          },
          {
            id: 'peak',
            label: 'Peak estimated cash',
            value: formatInr(result.peakCashRequirement),
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx.secondaryBtn} onClick={() => window.print()}>
              Print
            </button>
            <button
              type="button"
              className={cx.secondaryBtn}
              onClick={() => {
                setCompare(result);
                setActionMsg('Scenario A saved — change inputs and recalculate to compare.');
              }}
            >
              Compare project scenarios
            </button>
          </div>
        }
      />

      <div
        className={cn(
          cx.card,
          'p-4 sm:p-5',
          result.status === 'gap' && 'border border-amber-200 bg-amber-50/50',
          result.status === 'surplus' && 'border border-emerald-200 bg-emerald-50/40',
        )}
      >
        <p className="text-sm leading-relaxed text-slate-700">
          <strong className="text-[#0b1f3a]">Planning note:</strong> This is not personalized
          financial advice. Loan disbursement schedules, interest, fees and lender eligibility are
          not included.
        </p>
      </div>

      {result.financing ? (
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Financing burden (informational)</h3>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Monthly EMI</dt>
              <dd className="font-semibold tabular-nums">
                {formatInr(result.financing.monthlyEmi)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Monthly income</dt>
              <dd className="font-semibold tabular-nums">
                {formatInr(result.financing.monthlyIncome)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">EMI / income</dt>
              <dd className="font-semibold tabular-nums">{result.financing.emiToIncomePercent}%</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Income after EMI</dt>
              <dd className="font-semibold tabular-nums">
                {formatInr(result.financing.residualIncomeAfterEmi)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.financing.note}</p>
        </div>
      ) : null}

      {compare && compare !== result ? (
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Scenario comparison</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scenario A
              </p>
              <p className="mt-1 font-extrabold text-[#0b1f3a]">
                {compare.status} · {formatInr(Math.abs(compare.fundingDifference))}
              </p>
              <p className="text-xs text-slate-500">Need {formatInr(compare.totalFundingNeed)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current (B)
              </p>
              <p className="mt-1 font-extrabold text-[#0b1f3a]">
                {result.status} · {formatInr(Math.abs(result.fundingDifference))}
              </p>
              <p className="text-xs text-slate-500">Need {formatInr(result.totalFundingNeed)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div id="cost-optimization" className={cn(cx.card, 'space-y-3 p-4 sm:p-5 print:hidden')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Adjust scope & optimize</h3>
        <p className="text-xs text-slate-500">
          Explore lower cost without treating any option as financial advice.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={qualityHref} className={cx.secondaryBtn}>
            Change build quality
          </Link>
          <Link href={reduceAreaHref} className={cx.secondaryBtn}>
            Reduce project area
          </Link>
          <Link href="/construction/cost-optimization" className={cx.secondaryBtn}>
            Open cost optimization
          </Link>
          <Link href="/construction/renovation-cost-calculator" className={cx.secondaryBtn}>
            Switch to renovation scope
          </Link>
          <Link href="/construction/projects" className={cx.secondaryBtn}>
            Saved construction project
          </Link>
        </div>
      </div>

      <CalculationBreakdown title="Funding breakdown" rows={breakdownRows} />

      <aside className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5')} aria-labelledby="afford-assumptions">
        <h3 id="afford-assumptions" className="text-sm font-bold text-[#0b1f3a]">
          Assumptions
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.disclaimer}</p>
      </aside>

      <MethodologyPanel
        title={result.methodology.title}
        formula="surplus/gap = (savings + loan) − (project cost + contingency reserve)"
        steps={result.methodology.steps}
      />
    </div>
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Affordability calculator' },
        ]}
        title="Construction affordability calculator"
        description="See whether your planned construction budget fits available savings and expected loan — with contingency, cash-flow hints and clear disclaimers. Not personalized financial advice."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 sm:text-sm">
              available_funds = savings + expected_loan
              <br />
              funding_need = project_cost + contingency_reserve
              <br />
              difference = available_funds − funding_need
            </p>
            <p>
              Monthly cash spreads the funding need across the construction duration. Peak cash
              applies an indicative uplift for early-phase intensity. EMI / income is shown only
              when both optional fields are filled.
            </p>
          </div>
        }
        methodology={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Use this after a Varnarc cost or renovation estimate (or any contractor ballpark) to
              stress-test funding — not to decide loan eligibility.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{AFFORD_SEO_INTRO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">What to do if there is a gap</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Lower finish quality or postpone premium interiors</li>
              <li>Reduce built-up area or phase the build</li>
              <li>Re-estimate with the cost or renovation calculators</li>
              <li>Review savings, loan expectation and contingency with professionals</li>
            </ul>
            <h3 className="text-base font-bold text-[#0b1f3a]">Example</h3>
            <p>
              A ₹50 lakh project with 10% extra contingency needs ₹55 lakh. With ₹20 lakh savings
              and a ₹35 lakh expected loan, funds match the need (balanced). Shorten the duration
              and the monthly cash figure rises; add EMI and income to see an informational
              repayment ratio.
            </p>
          </div>
        }
        faqs={AFFORD_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Check affordability', onClick: () => runCalculate() },
          secondary: { label: 'Cost calculator', href: '/construction/cost-calculator' },
        }}
      />

      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={AFFORD_CALC_RELATED} />
      </div>
    </>
  );
}
