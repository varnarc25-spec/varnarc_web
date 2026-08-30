'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  analyseConstructionCostOptimization,
  applyCostOptimizationLevers,
  encodeScenarioSharePayload,
  suggestLeversForTarget,
  type CostOptimizationInput,
  type CostOptimizationResult,
  type OptimizationLever,
  type ConstructionCostQuality,
  type ConstructionCostInterior,
} from '@varnarc/validation';
import {
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { COST_OPT_FAQS, COST_OPT_RELATED, COST_OPT_SEO } from './content';

const COST_CALC_STORAGE = 'varnarc.construction.cost-calculator.v1';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  location: string;
  builtUpArea: string;
  floors: string;
  quality: ConstructionCostQuality;
  interiorLevel: ConstructionCostInterior;
  contingencyPercent: string;
  targetReductionInr: string;
  statedCurrentEstimateInr: string;
};

const DEFAULT_FORM: FormState = {
  location: 'Hyderabad',
  builtUpArea: '1500',
  floors: '2',
  quality: 'premium',
  interiorLevel: 'standard',
  contingencyPercent: '10',
  targetReductionInr: '500000',
  statedCurrentEstimateInr: '',
};

function toInput(form: FormState): CostOptimizationInput {
  return {
    location: form.location.trim() || 'Hyderabad',
    builtUpArea: Number(form.builtUpArea) || 1500,
    areaUnit: 'sqft',
    floors: Math.max(1, Math.round(Number(form.floors) || 2)),
    quality: form.quality,
    interiorLevel: form.interiorLevel,
    contingencyPercent: Number(form.contingencyPercent) || 10,
    targetReductionInr: Number(form.targetReductionInr) || 1,
    statedCurrentEstimateInr: form.statedCurrentEstimateInr.trim()
      ? Number(form.statedCurrentEstimateInr)
      : null,
  };
}

function LeverList({
  title,
  description,
  levers,
  selected,
  onToggle,
  accent,
}: {
  title: string;
  description: string;
  levers: OptimizationLever[];
  selected: Set<string>;
  onToggle: (id: string, on: boolean) => void;
  accent: string;
}) {
  if (!levers.length) return null;
  return (
    <section className={cn(cx.card, 'p-4 sm:p-5')}>
      <h3 className={cn('text-sm font-bold', accent)}>{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <ul className="mt-3 space-y-2">
        {levers.map((lever) => (
          <li key={lever.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <label className="flex gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#f97316] focus:ring-[#f97316]"
                checked={selected.has(lever.id)}
                disabled={!lever.selectable}
                onChange={(e) => onToggle(lever.id, e.target.checked)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-[#0b1f3a]">{lever.label}</span>
                  <span className="font-bold tabular-nums text-emerald-700">
                    ≈ {formatInr(lever.potentialSavingsInr)}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Category: {lever.category}
                  {!lever.selectable ? ' · Advisory only (not auto-applied)' : ''}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                  Trade-off: {lever.tradeOff}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CostOptimizationClient({
  initialParams,
}: {
  initialParams?: Record<string, string | undefined>;
}) {
  const [form, setForm] = useState<FormState>(() => {
    const next = { ...DEFAULT_FORM };
    if (initialParams?.builtUpArea) next.builtUpArea = initialParams.builtUpArea;
    if (initialParams?.location) next.location = initialParams.location;
    if (initialParams?.quality) {
      next.quality = initialParams.quality as ConstructionCostQuality;
    }
    if (initialParams?.targetReduction || initialParams?.target) {
      next.targetReductionInr = (initialParams.targetReduction || initialParams.target)!;
    }
    if (initialParams?.projectCost || initialParams?.estimatedCost) {
      next.statedCurrentEstimateInr = (initialParams.projectCost || initialParams.estimatedCost)!;
    }
    return next;
  });
  const [analysis, setAnalysis] = useState<CostOptimizationResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COST_CALC_STORAGE);
      if (!raw || initialParams?.builtUpArea || initialParams?.projectCost) return;
      const saved = JSON.parse(raw) as {
        form?: { builtUpArea?: string; location?: string; quality?: string };
        lastTotal?: number;
      };
      if (saved.form?.builtUpArea) {
        setForm((prev) => ({
          ...prev,
          builtUpArea: saved.form!.builtUpArea!,
          location: saved.form!.location || prev.location,
          quality: (saved.form!.quality as ConstructionCostQuality) || prev.quality,
          statedCurrentEstimateInr:
            typeof saved.lastTotal === 'number'
              ? String(Math.round(saved.lastTotal))
              : prev.statedCurrentEstimateInr,
        }));
      }
    } catch {
      /* ignore */
    }
  }, [initialParams]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applied = useMemo(() => {
    if (!analysis) return null;
    try {
      return applyCostOptimizationLevers(toInput(form), [...selected]);
    } catch {
      return null;
    }
  }, [analysis, form, selected]);

  function runAnalyse(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const input = toInput(form);
      if (!input.targetReductionInr) {
        setError('Enter a target budget reduction in rupees.');
        return;
      }
      const next = analyseConstructionCostOptimization(input);
      setAnalysis(next);
      const suggested = suggestLeversForTarget(input);
      setSelected(new Set(suggested));
      setActionMsg(
        `Suggested ${suggested.length} safe planning / finish levers toward your ₹ target.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAnalysis(null);
    }
  }

  function toggleLever(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) {
        if (id === 'area_trim_5') next.delete('area_trim_10');
        if (id === 'area_trim_10') next.delete('area_trim_5');
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function openComparison() {
    if (!applied) return;
    const encoded = encodeScenarioSharePayload(applied.comparisonScenarios);
    window.location.href = `/construction/scenario-compare?s=${encoded}`;
  }

  const formNode = (
    <CalculatorForm
      onSubmit={runAnalyse}
      onReset={() => {
        setForm(DEFAULT_FORM);
        setAnalysis(null);
        setSelected(new Set());
        setError(null);
        setActionMsg(null);
      }}
      submitLabel="Analyse savings options"
    >
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
          Load from cost calculator
        </Link>
        <button
          type="button"
          className={cx.secondaryBtn}
          onClick={() => {
            try {
              const raw = localStorage.getItem(COST_CALC_STORAGE);
              if (!raw) {
                setActionMsg('No saved cost-calculator estimate found in this browser.');
                return;
              }
              const saved = JSON.parse(raw) as {
                form?: { builtUpArea?: string; location?: string; quality?: string };
                lastTotal?: number;
              };
              setForm((prev) => ({
                ...prev,
                builtUpArea: saved.form?.builtUpArea || prev.builtUpArea,
                location: saved.form?.location || prev.location,
                quality: (saved.form?.quality as ConstructionCostQuality) || prev.quality,
                statedCurrentEstimateInr:
                  typeof saved.lastTotal === 'number'
                    ? String(Math.round(saved.lastTotal))
                    : prev.statedCurrentEstimateInr,
              }));
              setActionMsg('Loaded the latest cost-calculator estimate from this browser.');
            } catch {
              setActionMsg('Could not load saved estimate.');
            }
          }}
        >
          Import saved estimate
        </button>
      </div>

      <CalculatorInput
        id="opt-location"
        label="Location"
        value={form.location}
        onChange={(e) => setField('location', e.target.value)}
      />
      <CalculatorInput
        id="opt-area"
        label="Built-up area (sq ft)"
        type="number"
        min={1}
        value={form.builtUpArea}
        onChange={(e) => setField('builtUpArea', e.target.value)}
      />
      <CalculatorInput
        id="opt-floors"
        label="Floors"
        type="number"
        min={1}
        value={form.floors}
        onChange={(e) => setField('floors', e.target.value)}
      />
      <CalculatorSelect
        id="opt-quality"
        label="Quality"
        value={form.quality}
        onChange={(e) => setField('quality', e.target.value as ConstructionCostQuality)}
        options={[
          { value: 'basic', label: 'Basic' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
          { value: 'luxury', label: 'Luxury' },
        ]}
      />
      <CalculatorSelect
        id="opt-interior"
        label="Interior level"
        value={form.interiorLevel}
        onChange={(e) => setField('interiorLevel', e.target.value as ConstructionCostInterior)}
        options={[
          { value: 'shell', label: 'Shell' },
          { value: 'basic', label: 'Basic' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
        ]}
      />
      <CalculatorInput
        id="opt-target"
        label="Target reduction (₹)"
        type="number"
        min={1}
        required
        value={form.targetReductionInr}
        onChange={(e) => setField('targetReductionInr', e.target.value)}
        hint="Example: 500000 to reduce by ₹5 lakh"
      />
      <CalculatorInput
        id="opt-stated"
        label="Stated current estimate (₹, optional)"
        type="number"
        min={1}
        value={form.statedCurrentEstimateInr}
        onChange={(e) => setField('statedCurrentEstimateInr', e.target.value)}
        hint="For reference — engine recalculates from size/quality"
        className="sm:col-span-2"
      />
      {error ? (
        <p className="sm:col-span-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {actionMsg ? <p className="sm:col-span-2 text-xs text-slate-600">{actionMsg}</p> : null}
    </CalculatorForm>
  );

  const resultNode = analysis ? (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#0b1f3a] p-5 text-white sm:p-6" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          Current engine estimate
        </p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums">
          {formatInr(analysis.currentEstimateInr)}
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Target reduction {formatInr(analysis.targetReductionInr)} (
          {analysis.targetReductionPercent}%)
        </p>
        {form.statedCurrentEstimateInr ? (
          <p className="mt-1 text-xs text-slate-400">
            You stated {formatInr(Number(form.statedCurrentEstimateInr))} — recommendations still
            use the engine total above.
          </p>
        ) : null}
      </div>

      {applied ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={cn(cx.card, 'p-4')}>
            <p className="text-xs font-semibold uppercase text-slate-500">Revised total</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(applied.revisedTotal)}
            </p>
          </div>
          <div className={cn(cx.card, 'p-4')}>
            <p className="text-xs font-semibold uppercase text-slate-500">Potential savings</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald-700">
              {formatInr(applied.savingsInr)}
            </p>
          </div>
          <div className={cn(cx.card, 'p-4')}>
            <p className="text-xs font-semibold uppercase text-slate-500">% reduction</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">
              {applied.savingsPercent}%
            </p>
          </div>
        </div>
      ) : null}

      <LeverList
        title="Safe planning adjustments"
        description="Typically lower-risk budgeting moves. Structure is not weakened."
        levers={analysis.groups.safePlanning}
        selected={selected}
        onToggle={toggleLever}
        accent="text-emerald-800"
      />
      <LeverList
        title="Finish / specification adjustments"
        description="Aesthetic and brand-level choices — never reinforcement, concrete grade or foundation."
        levers={analysis.groups.finishSpec}
        selected={selected}
        onToggle={toggleLever}
        accent="text-[#0b1f3a]"
      />
      <LeverList
        title="Items requiring professional review"
        description="Shown for awareness only — not auto-applied to the revised total."
        levers={analysis.groups.professionalReview}
        selected={selected}
        onToggle={toggleLever}
        accent="text-amber-800"
      />

      <div className={cn(cx.card, 'border border-amber-200 bg-amber-50/60 p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-amber-950">Never auto-downgraded (structural)</h3>
        <ul className="mt-2 space-y-2 text-sm text-amber-950/90">
          {analysis.structuralExclusions.map((ex) => (
            <li key={ex.id}>
              <strong>{ex.label}:</strong> {ex.reason}
            </li>
          ))}
        </ul>
      </div>

      {applied && applied.tradeOffs.length ? (
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Trade-offs for selected levers</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {applied.tradeOffs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cn(cx.card, 'flex flex-wrap gap-2 p-4 sm:p-5')}>
        <button
          type="button"
          className={cx.primaryBtn}
          disabled={!applied || applied.appliedLeverIds.length === 0}
          onClick={openComparison}
        >
          Create comparison scenario
        </button>
        <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
          Refine in cost calculator
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">{analysis.disclaimer}</p>
    </div>
  ) : (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      Enter size, quality and a reduction target — or import a saved estimate — then analyse.
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Reduce my budget' },
        ]}
        title="Reduce my construction budget"
        description="Find planning and finish adjustments to approach a savings target — without ever automatically cutting reinforcement, concrete strength or foundation design."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Current totals come from the central construction calculation engine. Finish savings
              use category allocations from that same result. Selected planning levers (area,
              quality, interiors) are re-run through the engine; professional-review items stay
              advisory.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{COST_OPT_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Example</h3>
            <p>
              Current estimate around ₹50 lakh with a target to reduce ₹5 lakh: the tool ranks safe
              area trims and finish substitutions, excludes structural downgrades, and can open
              Scenario comparison for current vs optimized plans.
            </p>
          </div>
        }
        faqs={COST_OPT_FAQS}
        stickyCta={{
          primary: { label: 'Analyse savings', onClick: () => runAnalyse() },
          secondary: { label: 'Cost calculator', href: '/construction/cost-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={COST_OPT_RELATED} />
      </div>
    </>
  );
}
