'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_COST_SIMULATOR_STATE,
  DEFAULT_MARKET_RATES,
  simulateConstructionCostChange,
  type ConstructionCostInterior,
  type ConstructionCostQuality,
  type CostSimulatorState,
} from '@varnarc/validation';
import { CalculatorShell } from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { COST_SIM_FAQS, COST_SIM_RELATED, COST_SIM_SEO } from './content';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatSigned(n: number): string {
  const abs = formatInr(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${formatInr(Math.abs(n))}`;
  return formatInr(0);
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cx.label}>
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-[#0b1f3a]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#f97316]"
      />
      {hint ? <p className={cx.helper}>{hint}</p> : null}
    </div>
  );
}

export function CostChangeSimulatorClient() {
  const [state, setState] = useState<CostSimulatorState>(DEFAULT_COST_SIMULATOR_STATE);

  const result = useMemo(() => simulateConstructionCostChange(state), [state]);

  const set = <K extends keyof CostSimulatorState>(key: K, value: CostSimulatorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setState({ ...DEFAULT_COST_SIMULATOR_STATE });

  const psf =
    result.current.areaSqft > 0
      ? Math.round(result.current.estimatedTotal / result.current.areaSqft)
      : result.current.costPerSqft;

  const formNode = (
    <div className={cn(cx.card, 'space-y-5 p-4 sm:p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#0b1f3a]">Inputs</h2>
        <button type="button" className={cx.secondaryBtn} onClick={reset}>
          Reset to market defaults
        </button>
      </div>

      <SliderField
        id="sim-area"
        label="Built-up area"
        value={state.builtUpArea}
        min={600}
        max={4000}
        step={50}
        display={`${state.builtUpArea.toLocaleString('en-IN')} sq ft`}
        onChange={(v) => set('builtUpArea', v)}
      />

      <fieldset>
        <legend className={cx.label}>Quality level</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Quality level">
          {(['basic', 'standard', 'premium', 'luxury'] as ConstructionCostQuality[]).map((q) => (
            <button
              key={q}
              type="button"
              role="radio"
              aria-checked={state.quality === q}
              onClick={() => set('quality', q)}
              className={cn(
                'min-h-11 rounded-lg border px-3 text-sm font-semibold capitalize',
                cx.focus,
                state.quality === q
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-[#0b1f3a] hover:border-[#f97316]',
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </fieldset>

      <SliderField
        id="sim-floors"
        label="Number of floors"
        value={state.floors}
        min={1}
        max={5}
        step={1}
        display={state.floors === 1 ? 'G (1)' : `G+${state.floors - 1} (${state.floors})`}
        onChange={(v) => set('floors', v)}
        hint="1 = ground only · 2 = G+1 · 3 = G+2"
      />

      <SliderField
        id="sim-steel"
        label="Steel rate"
        value={state.steelRatePerKg}
        min={40}
        max={90}
        step={1}
        display={`₹${state.steelRatePerKg}/kg`}
        onChange={(v) => set('steelRatePerKg', v)}
        hint={`Market default ₹${DEFAULT_MARKET_RATES.steelRatePerKg}/kg — not a price forecast`}
      />

      <SliderField
        id="sim-cement"
        label="Cement rate"
        value={state.cementRatePerBag}
        min={280}
        max={550}
        step={5}
        display={`₹${state.cementRatePerBag}/bag`}
        onChange={(v) => set('cementRatePerBag', v)}
        hint={`Market default ₹${DEFAULT_MARKET_RATES.cementRatePerBag}/bag`}
      />

      <SliderField
        id="sim-labour"
        label="Labour rate index"
        value={state.labourRateIndex}
        min={70}
        max={150}
        step={1}
        display={`${state.labourRateIndex} (100 = default)`}
        onChange={(v) => set('labourRateIndex', v)}
        hint="Relative labour cost vs market default — not wage advice"
      />

      <SliderField
        id="sim-contingency"
        label="Contingency"
        value={state.contingencyPercent}
        min={0}
        max={25}
        step={1}
        display={`${state.contingencyPercent}%`}
        onChange={(v) => set('contingencyPercent', v)}
      />

      <fieldset>
        <legend className={cx.label}>Interior level</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Interior level">
          {(['shell', 'basic', 'standard', 'premium'] as ConstructionCostInterior[]).map(
            (level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={state.interiorLevel === level}
                onClick={() => set('interiorLevel', level)}
                className={cn(
                  'min-h-11 rounded-lg border px-3 text-sm font-semibold capitalize',
                  cx.focus,
                  state.interiorLevel === level
                    ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                    : 'border-slate-200 bg-white text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                {level}
              </button>
            ),
          )}
        </div>
      </fieldset>
    </div>
  );

  const resultNode = (
    <div className="space-y-4">
      <div
        className="rounded-xl bg-[#0b1f3a] p-5 text-white sm:p-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          Total project cost
        </p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">
          {formatInr(result.current.estimatedTotal)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Indicative engine estimate vs market defaults — not a quote. Does not advise on future
          commodity pricing.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn(cx.card, 'p-4')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cost change
          </p>
          <p
            className={cn(
              'mt-1 text-xl font-extrabold tabular-nums',
              result.costChangeInr > 0 && 'text-amber-700',
              result.costChangeInr < 0 && 'text-emerald-700',
              result.costChangeInr === 0 && 'text-[#0b1f3a]',
            )}
          >
            {formatSigned(result.costChangeInr)}
          </p>
          <p className="mt-1 text-xs text-slate-500">vs market / default assumptions</p>
        </div>
        <div className={cn(cx.card, 'p-4')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Percentage difference
          </p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">
            {result.costChangePercent > 0 ? '+' : ''}
            {result.costChangePercent}%
          </p>
        </div>
        <div className={cn(cx.card, 'p-4')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cost per sq ft
          </p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-[#0b1f3a]">
            {formatInr(psf)}
          </p>
        </div>
      </div>

      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">What changes this estimate?</h3>
        <ul className="mt-3 space-y-2.5">
          {result.insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700"
            >
              {insight.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Insights re-run the central construction calculation engine with one input changed. They
          are educational sensitivity notes — not market timing or purchasing advice.
        </p>
      </div>

      <aside className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Assumptions</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600">
          {result.current.assumptions.slice(0, 6).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">{result.current.disclaimer}</p>
      </aside>
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Cost change simulator' },
        ]}
        title="What changes my construction cost?"
        description="Move the sliders to see how area, quality, floors, steel, cement, labour, contingency and interiors shift an indicative project total. Uses the central Varnarc construction calculation engine — not a separate formula."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Totals come from{' '}
              <code className="rounded bg-slate-100 px-1">calculateConstructionCost</code>. Steel
              and cement sliders adjust material cost via planning quantities; labour index scales
              the labour share; quality, floors, interiors and contingency use the same multipliers
              as the flagship cost calculator.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{COST_SIM_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">How to use it</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Start from market defaults, then change one control at a time</li>
              <li>Read the ₹ and % difference vs defaults</li>
              <li>Use insights to understand area and rate sensitivity</li>
              <li>Reset anytime — then open the full cost calculator for a detailed breakdown</li>
            </ul>
          </div>
        }
        faqs={COST_SIM_FAQS}
        stickyCta={{
          primary: { label: 'Reset defaults', onClick: reset },
          secondary: { label: 'Full cost calculator', href: '/construction/cost-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={COST_SIM_RELATED} />
      </div>
    </>
  );
}
