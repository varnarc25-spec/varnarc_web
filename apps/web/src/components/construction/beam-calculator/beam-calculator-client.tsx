'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  RCC_PRELIMINARY_STEEL_KG_PER_M3,
  RCC_STRUCTURAL_DISCLAIMER,
  calculateBeamVolume,
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
import { BEAM_CALC_FAQS, BEAM_CALC_RELATED, BEAM_CALC_SEO, BEAM_WORKED_EXAMPLE } from './content';
import { BeamDimensionDiagram } from './beam-dimension-diagram';

const CALC_TYPE = 'beam_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  width: string;
  depth: string;
  length: string;
  widthUnit: LengthUnit;
  depthUnit: LengthUnit;
  lengthUnit: LengthUnit;
  quantity: string;
  wastagePercent: string;
  grade: RccGrade;
  includeMaterialBreakdown: boolean;
  includeSteelEstimate: boolean;
  steelKgPerM3: string;
  includeCost: boolean;
  ratePerM3Inr: string;
};

function defaultForm(): FormState {
  return {
    width: '230',
    depth: '450',
    length: '4',
    widthUnit: 'mm',
    depthUnit: 'mm',
    lengthUnit: 'm',
    quantity: '1',
    wastagePercent: '5',
    grade: 'M20',
    includeMaterialBreakdown: true,
    includeSteelEstimate: false,
    steelKgPerM3: String(RCC_PRELIMINARY_STEEL_KG_PER_M3.beam.typical),
    includeCost: false,
    ratePerM3Inr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
  { value: 'inch', label: 'inch' },
];

export function BeamCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<RccCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Beam estimate');
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
        // Shared RCC mapping: length=span L, width=B, thickness=D
        length: Number(form.length),
        width: Number(form.width),
        thickness: Number(form.depth),
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        thicknessUnit: form.depthUnit,
        quantity: Number(form.quantity) || 1,
        wastagePercent: Number(form.wastagePercent) || 0,
        grade: form.grade,
        includeMaterialBreakdown: form.includeMaterialBreakdown,
        includeSteelEstimate: form.includeSteelEstimate,
        steelKgPerM3:
          form.includeSteelEstimate && form.steelKgPerM3.trim() ? Number(form.steelKgPerM3) : null,
        ratePerM3Inr:
          form.includeCost && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
      };
      const next = calculateBeamVolume(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'beam-calculator',
        methodologyVersionLabel: next.version ?? RCC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/beam-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'm3',
        result_range_category:
          next.orderVolumeM3 <= 2 ? 'low' : next.orderVolumeM3 <= 20 ? 'mid' : 'high',
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
    const text = `Varnarc beam: ${result.wetVolumeOneM3} m³ each, total wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³. Volume planning only — not reinforcement design.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Beam calculator', text, url: window.location.href });
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
      `Individual beam volume,${result.wetVolumeOneM3},m3`,
      `Total wet concrete,${result.wetVolumeM3},m3`,
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
      `NOTE,"This calculator does not generate structural reinforcement design.",`,
      result.steel ? `NOTE,"${RCC_STRUCTURAL_DISCLAIMER.replace(/"/g, "'")}",` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-beam-boq.csv';
    a.click();
    URL.revokeObjectURL(url);
    setActionMsg('BOQ CSV downloaded.');
  }

  async function addToProject() {
    if (!result) return;
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Beam estimate',
          areaSqft: Math.max(1, Math.round(result.orderVolumeM3 * 50)),
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

  const steelBand = RCC_PRELIMINARY_STEEL_KG_PER_M3.beam;

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
      submitLabel="Calculate beam volume"
    >
      <aside className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Volume planning only</p>
        <p className="mt-1 text-sm text-slate-600">
          This tool estimates concrete volume. It does not generate structural reinforcement design.
        </p>
      </aside>

      <CalculatorInput
        id="beam-b"
        label="Beam width (B)"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.width}
        onChange={(e) => setField('width', e.target.value)}
      />
      <CalculatorSelect
        id="beam-bu"
        label="Width unit"
        value={form.widthUnit}
        onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="beam-d"
        label="Beam depth (D)"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.depth}
        onChange={(e) => setField('depth', e.target.value)}
      />
      <CalculatorSelect
        id="beam-du"
        label="Depth unit"
        value={form.depthUnit}
        onChange={(e) => setField('depthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="beam-l"
        label="Beam length (L)"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.length}
        onChange={(e) => setField('length', e.target.value)}
      />
      <CalculatorSelect
        id="beam-lu"
        label="Length unit"
        value={form.lengthUnit}
        onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="beam-qty"
        label="Quantity"
        type="number"
        min={1}
        step={1}
        value={form.quantity}
        onChange={(e) => setField('quantity', e.target.value)}
      />
      <CalculatorInput
        id="beam-waste"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <UnitSelector
        id="beam-mats"
        label="Material quantities"
        value={form.includeMaterialBreakdown ? 'yes' : 'no'}
        onChange={(v) => setField('includeMaterialBreakdown', v === 'yes')}
        options={[
          { value: 'yes', label: 'Enable (shared mix utilities)' },
          { value: 'no', label: 'Volume only' },
        ]}
        className="sm:col-span-2"
      />
      {form.includeMaterialBreakdown ? (
        <CalculatorSelect
          id="beam-grade"
          label="Concrete grade"
          value={form.grade}
          onChange={(e) => setField('grade', e.target.value as RccGrade)}
          options={[
            { value: 'M15', label: 'M15 (1:2:4)' },
            { value: 'M20', label: 'M20 (1:1.5:3)' },
            { value: 'M25', label: 'M25 (1:1:2)' },
            { value: 'M30', label: 'M30 (1:1:1.5 indicative)' },
          ]}
          className="sm:col-span-2"
        />
      ) : null}

      <UnitSelector
        id="beam-cost"
        label="Estimated cost"
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
          id="beam-rate"
          label="Concrete rate ₹ / m³"
          type="number"
          min={1}
          value={form.ratePerM3Inr}
          onChange={(e) => setField('ratePerM3Inr', e.target.value)}
          className="sm:col-span-2"
        />
      ) : null}

      <UnitSelector
        id="beam-steel"
        label="Indicative steel"
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
          <aside className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-bold">Preliminary only — not structural design</p>
            <p className="mt-1 text-xs leading-relaxed">
              Default beam range {steelBand.min}–{steelBand.max} kg/m³ (typical {steelBand.typical}
              ). Actual reinforcement must follow structural drawings prepared by a qualified
              engineer. This estimate must not be used as a bar schedule or design output.
            </p>
          </aside>
          <CalculatorInput
            id="beam-steel-ratio"
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
      {result.dimensionsM?.thickness != null ? (
        <BeamDimensionDiagram
          widthM={result.dimensionsM.width}
          depthM={result.dimensionsM.thickness}
          lengthM={result.dimensionsM.length}
        />
      ) : null}

      <CalculationResult
        label="Individual beam volume"
        value={`${result.wetVolumeOneM3.toLocaleString('en-IN')} m³`}
        hint={`Total wet ${result.wetVolumeM3} m³ (${result.quantity} beams) · order ${result.orderVolumeM3} m³. Indicative only.`}
        metrics={[
          {
            id: 'total',
            label: 'Total concrete volume (wet)',
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
            <Link href="/construction/slab-calculator" className={cx.secondaryBtn}>
              Slab
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
          </div>
        }
      />

      {result.steel ? (
        <aside className={cn(cx.card, 'border-2 border-amber-400 bg-amber-50/60 p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-amber-950">Indicative steel — preliminary only</h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">
            Not structural reinforcement design. Actual usage requires structural drawings from a
            qualified engineer.
          </p>
          <p className="mt-3 text-lg font-bold tabular-nums text-[#0b1f3a]">
            {result.steel.steelKgMin}–{result.steel.steelKgMax} kg
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Typical {result.steel.steelKgTypical} kg @ {result.steel.kgPerM3Min}–
            {result.steel.kgPerM3Max} kg/m³
          </p>
          <p className="mt-2 text-xs text-slate-500">{result.steel.warning}</p>
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
          { label: 'Beam calculator' },
        ]}
        title="Beam volume calculator"
        description="Estimate RCC beam concrete volume from width, depth, length and quantity — optional mix materials and cost via shared concrete utilities. Does not generate structural reinforcement design."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              V_one = B × D × L · V_wet = V_one × qty · V_order = V_wet × (1 + wastage%)
            </p>
            <p>
              Material estimates reuse the shared RCC dry-factor and grade mix path. Steel design is
              not produced; any indicative steel figure is preliminary only.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{BEAM_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{BEAM_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={BEAM_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate beam volume', onClick: () => runCalculate() },
          secondary: { label: 'Slab calculator', href: '/construction/slab-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={BEAM_CALC_RELATED} />
      </div>
    </>
  );
}
