'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  RCC_PRELIMINARY_STEEL_KG_PER_M3,
  RCC_STRUCTURAL_DISCLAIMER,
  calculateRccQuantity,
  type RccCalculatorResult,
  type RccGrade,
  RCC_CALC_VERSION,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
  UnitSelector,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import {
  trackCalculationAddedToProject,
  trackCalculationShared,
  trackCalculatorCompleted,
  trackCalculatorError,
  trackProjectCreated,
} from '@/lib/construction/analytics';
import {
  clearConstructionCalculationSave,
  publishConstructionCalculationSave,
} from '@/lib/construction/save-calculation/publish';
import { SLAB_CALC_FAQS, SLAB_CALC_RELATED, SLAB_CALC_SEO, SLAB_WORKED_EXAMPLE } from './content';
import { SlabDimensionDiagram } from './slab-dimension-diagram';

const CALC_TYPE = 'slab_calculator';
const M2_TO_FT2 = 10.76391041671;

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  length: string;
  width: string;
  thickness: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  thicknessUnit: LengthUnit;
  numberOfSlabs: string;
  grade: RccGrade;
  wastagePercent: string;
  includeMaterialBreakdown: boolean;
  includeSteelEstimate: boolean;
  steelKgPerM3: string;
  includeCost: boolean;
  ratePerM3Inr: string;
};

function defaultForm(): FormState {
  return {
    length: '5',
    width: '4',
    thickness: '150',
    lengthUnit: 'm',
    widthUnit: 'm',
    thicknessUnit: 'mm',
    numberOfSlabs: '1',
    grade: 'M20',
    wastagePercent: '5',
    includeMaterialBreakdown: true,
    includeSteelEstimate: false,
    steelKgPerM3: String(RCC_PRELIMINARY_STEEL_KG_PER_M3.slab.typical),
    includeCost: false,
    ratePerM3Inr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'm', label: 'm' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft' },
  { value: 'inch', label: 'inch' },
];

export function SlabCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<RccCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Slab estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        element: 'slab',
        length: Number(form.length),
        width: Number(form.width),
        thickness: Number(form.thickness),
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        thicknessUnit: form.thicknessUnit,
        quantity: Number(form.numberOfSlabs) || 1,
        grade: form.grade,
        wastagePercent: Number(form.wastagePercent) || 0,
        includeMaterialBreakdown: form.includeMaterialBreakdown,
        includeSteelEstimate: form.includeSteelEstimate,
        steelKgPerM3:
          form.includeSteelEstimate && form.steelKgPerM3.trim() ? Number(form.steelKgPerM3) : null,
        ratePerM3Inr:
          form.includeCost && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
      };
      const next = calculateRccQuantity(payload as Parameters<typeof calculateRccQuantity>[0]);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'slab-calculator',
        methodologyVersionLabel: next.version ?? RCC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/slab-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'm3',
        result_range_category:
          next.orderVolumeM3 <= 5 ? 'low' : next.orderVolumeM3 <= 50 ? 'mid' : 'high',
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

  async function shareResult() {
    if (!result) return;
    const text = `Varnarc slab: area ${result.planAreaM2} m², wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³. Preliminary only — reinforcement must follow engineer drawings.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Slab calculator', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setActionMsg('Copied estimate to clipboard.');
      }
      trackCalculationShared({ calculator_type: CALC_TYPE });
    } catch {
      setActionMsg('Could not share — copy the URL manually.');
    }
  }

  function downloadBoq() {
    if (!result) return;
    const lines = [
      'Item,Quantity,Unit',
      `Slab area,${result.planAreaM2 ?? ''},m2`,
      `Wet concrete,${result.wetVolumeM3},m3`,
      `Order concrete,${result.orderVolumeM3},m3`,
      result.materials ? `Cement,${result.materials.cementBags},bags` : '',
      result.materials ? `Sand,${result.materials.sandM3},m3` : '',
      result.materials ? `Aggregate,${result.materials.aggregateM3},m3` : '',
      result.steel
        ? `Indicative steel PRELIMINARY ONLY (typical),${result.steel.steelKgTypical},kg`
        : '',
      result.estimatedCostInr != null
        ? `Estimated concrete cost,${result.estimatedCostInr},INR`
        : '',
      `NOTE,"${RCC_STRUCTURAL_DISCLAIMER.replace(/"/g, "'")}",`,
      `NOTE,"Steel figures are preliminary only and separate from structural engineering design.",`,
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-slab-boq.csv';
    a.click();
    URL.revokeObjectURL(url);
    setActionMsg('BOQ CSV downloaded.');
  }

  async function addToProject() {
    if (!result) return;
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const areaSqft = Math.max(
        1,
        Math.round((result.planAreaM2 ?? result.orderVolumeM3 * 10) * M2_TO_FT2),
      );
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Slab estimate',
          areaSqft,
          region: 'India',
          quality: 'standard',
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to save this calculation to a project.');
        return;
      }
      if (!res.ok) throw new Error('Save failed');
      setActionMsg('Saved to your projects.');
      trackProjectCreated({ logged_in: true });
      trackCalculationAddedToProject({ calculator_type: CALC_TYPE, logged_in: true });
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  const steelBand = RCC_PRELIMINARY_STEEL_KG_PER_M3.slab;

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={runCalculate}
      onReset={() => {
        setForm(defaultForm());
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate slab"
    >
      <aside className="sm:col-span-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-bold text-amber-950">Important</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-950/90">
          {RCC_STRUCTURAL_DISCLAIMER}
        </p>
      </aside>

      <CalculatorInput
        id="slab-l"
        label="Slab length"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.length}
        onChange={(e) => setField('length', e.target.value)}
      />
      <CalculatorSelect
        id="slab-lu"
        label="Length unit"
        value={form.lengthUnit}
        onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="slab-w"
        label="Slab width"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.width}
        onChange={(e) => setField('width', e.target.value)}
      />
      <CalculatorSelect
        id="slab-wu"
        label="Width unit"
        value={form.widthUnit}
        onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="slab-t"
        label="Slab thickness"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.thickness}
        onChange={(e) => setField('thickness', e.target.value)}
      />
      <CalculatorSelect
        id="slab-tu"
        label="Thickness unit"
        value={form.thicknessUnit}
        onChange={(e) => setField('thicknessUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="slab-n"
        label="Number of slabs"
        type="number"
        min={1}
        step={1}
        value={form.numberOfSlabs}
        onChange={(e) => setField('numberOfSlabs', e.target.value)}
      />
      <CalculatorInput
        id="slab-waste"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <CalculatorSelect
        id="slab-grade"
        label="Concrete grade (optional mix)"
        value={form.grade}
        onChange={(e) => setField('grade', e.target.value as RccGrade)}
        options={[
          { value: 'M15', label: 'M15 (1:2:4)' },
          { value: 'M20', label: 'M20 (1:1.5:3)' },
          { value: 'M25', label: 'M25 (1:1:2)' },
          { value: 'M30', label: 'M30 (1:1:1.5 indicative)' },
        ]}
        className="sm:col-span-2"
        hint="Used when material quantities are included"
      />

      <UnitSelector
        id="slab-mats"
        label="Concrete material quantities"
        value={form.includeMaterialBreakdown ? 'yes' : 'no'}
        onChange={(v) => setField('includeMaterialBreakdown', v === 'yes')}
        options={[
          { value: 'yes', label: 'Include cement / sand / aggregate' },
          { value: 'no', label: 'Volume only' },
        ]}
        className="sm:col-span-2"
      />

      <UnitSelector
        id="slab-cost"
        label="Cost estimate"
        value={form.includeCost ? 'yes' : 'no'}
        onChange={(v) => setField('includeCost', v === 'yes')}
        options={[
          { value: 'no', label: 'Skip' },
          { value: 'yes', label: 'Include ₹ / m³' },
        ]}
        className="sm:col-span-2"
      />
      {form.includeCost ? (
        <CalculatorInput
          id="slab-rate"
          label="Concrete rate ₹ / m³"
          type="number"
          min={1}
          value={form.ratePerM3Inr}
          onChange={(e) => setField('ratePerM3Inr', e.target.value)}
          className="sm:col-span-2"
        />
      ) : null}

      <UnitSelector
        id="slab-steel"
        label="Steel estimate"
        value={form.includeSteelEstimate ? 'yes' : 'no'}
        onChange={(v) => setField('includeSteelEstimate', v === 'yes')}
        options={[
          { value: 'no', label: 'Off (default)' },
          { value: 'yes', label: 'Preliminary only' },
        ]}
        className="sm:col-span-2"
      />
      {form.includeSteelEstimate ? (
        <div className="sm:col-span-2 space-y-3">
          <aside className="rounded-lg border border-amber-300 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950">
            <strong>Preliminary only — not structural design.</strong> Default slab range{' '}
            {steelBand.min}–{steelBand.max} kg/m³ (typical {steelBand.typical}). This is separate
            from structural engineering design. Actual reinforcement must follow drawings by a
            qualified engineer.
          </aside>
          <CalculatorInput
            id="slab-steel-ratio"
            label="Typical steel kg / m³ (override)"
            type="number"
            min={1}
            value={form.steelKgPerM3}
            onChange={(e) => setField('steelKgPerM3', e.target.value)}
          />
        </div>
      ) : null}

      {error ? (
        <p className="sm:col-span-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </CalculatorForm>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <aside className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-bold text-amber-950">Structural design note</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-950/90">
          {result.structuralDisclaimer}
        </p>
      </aside>

      {result.dimensionsM?.thickness != null ? (
        <SlabDimensionDiagram
          lengthM={result.dimensionsM.length}
          widthM={result.dimensionsM.width}
          thicknessM={result.dimensionsM.thickness}
        />
      ) : null}

      <CalculationResult
        label="Slab area"
        value={`${(result.planAreaM2 ?? 0).toLocaleString('en-IN')} m²`}
        hint={
          result.quantity > 1
            ? `${result.planAreaOneM2} m² each × ${result.quantity} slabs · ${(
                (result.planAreaM2 ?? 0) * M2_TO_FT2
              ).toFixed(1)} ft² total`
            : `${((result.planAreaM2 ?? 0) * M2_TO_FT2).toFixed(1)} ft² · Indicative only.`
        }
        metrics={[
          {
            id: 'wet',
            label: 'Concrete volume (wet)',
            value: `${result.wetVolumeM3} m³`,
          },
          {
            id: 'order',
            label: 'Order volume',
            value: `${result.orderVolumeM3} m³`,
            hint: `+${result.wastagePercent}% wastage`,
          },
          ...(result.materials
            ? [
                {
                  id: 'cement',
                  label: 'Cement',
                  value: `${result.materials.cementBags} bags`,
                  hint: `${result.materials.cementKg} kg · ${result.materials.mixLabel}`,
                },
                {
                  id: 'sand',
                  label: 'Sand',
                  value: `${result.materials.sandM3} m³`,
                },
                {
                  id: 'agg',
                  label: 'Aggregate',
                  value: `${result.materials.aggregateM3} m³`,
                },
              ]
            : []),
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'cost',
                  label: 'Estimated cost',
                  value: formatInr(result.estimatedCostInr),
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx.primaryBtn} onClick={downloadBoq}>
              Add to BOQ
            </button>
            <button
              type="button"
              className={cx.secondaryBtn}
              disabled={saveLoading}
              onClick={() => void addToProject()}
            >
              {saveLoading ? 'Saving…' : 'Add to project'}
            </button>
            <Link href="/construction/rcc-calculator" className={cx.secondaryBtn}>
              RCC hub
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
          </div>
        }
      />

      {result.steel ? (
        <aside className={cn(cx.card, 'border-amber-300 bg-amber-50/50 p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-amber-950">Indicative steel — preliminary only</h3>
          <p className="mt-1 text-xs text-amber-900/90">
            Separate from structural engineering design. Not a BBS or bar schedule.
          </p>
          <p className="mt-3 text-lg font-bold tabular-nums text-[#0b1f3a]">
            {result.steel.steelKgMin}–{result.steel.steelKgMax} kg
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Typical {result.steel.steelKgTypical} kg ({result.steel.steelTonnesTypical} t) @{' '}
            {result.steel.kgPerM3Min}–{result.steel.kgPerM3Max} kg/m³ of concrete
          </p>
          <p className="mt-2 text-xs text-slate-500">{result.steel.ratioSource}</p>
        </aside>
      ) : null}

      <MethodologyPanel
        title="Step-by-step calculation"
        formula={result.formula}
        steps={result.steps}
      />

      <aside className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Assumptions</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">{result.disclaimer}</p>
      </aside>

      <div className={cn(cx.card, 'space-y-3 p-4 sm:p-5 print:hidden')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Save to project</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={cx.input}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Project name"
          />
          <button
            type="button"
            className={cx.primaryBtn}
            disabled={saveLoading}
            onClick={() => void addToProject()}
          >
            {saveLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
        {actionMsg ? <p className="text-xs text-slate-600">{actionMsg}</p> : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Slab calculator' },
        ]}
        title="Slab calculator"
        description="Estimate slab area and RCC concrete volume from length, width, thickness and number of slabs — optional mix materials and cost. Steel (if shown) is preliminary only and separate from structural design."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              A = L × W × n · V_wet = A × T · V_order = V_wet × (1 + wastage%)
            </p>
            <p>
              Optional materials use dry factor 1.54 and the selected grade mix. Any steel figure is
              a preliminary thumb-rule range — not structural engineering design.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{SLAB_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{SLAB_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={SLAB_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate slab', onClick: () => runCalculate() },
          secondary: { label: 'Add to BOQ', onClick: () => result && downloadBoq() },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={SLAB_CALC_RELATED} />
      </div>
    </>
  );
}
