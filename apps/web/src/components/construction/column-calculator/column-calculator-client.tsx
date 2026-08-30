'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  calculateColumnVolume,
  type RccCalculatorResult,
  type RccColumnShape,
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
import {
  COLUMN_CALC_FAQS,
  COLUMN_CALC_RELATED,
  COLUMN_CALC_SEO,
  COLUMN_WORKED_EXAMPLE,
} from './content';
import { CircularColumnDiagram, RectangularColumnDiagram } from './column-dimension-diagram';

const CALC_TYPE = 'column_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  columnShape: RccColumnShape;
  width: string;
  depth: string;
  diameter: string;
  height: string;
  widthUnit: LengthUnit;
  depthUnit: LengthUnit;
  diameterUnit: LengthUnit;
  heightUnit: LengthUnit;
  quantity: string;
  wastagePercent: string;
  grade: RccGrade;
  includeMaterialBreakdown: boolean;
  includeCost: boolean;
  ratePerM3Inr: string;
};

function defaultForm(): FormState {
  return {
    columnShape: 'rectangular',
    width: '230',
    depth: '450',
    diameter: '300',
    height: '3',
    widthUnit: 'mm',
    depthUnit: 'mm',
    diameterUnit: 'mm',
    heightUnit: 'm',
    quantity: '1',
    wastagePercent: '5',
    grade: 'M20',
    includeMaterialBreakdown: true,
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

export function ColumnCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<RccCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Column estimate');
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
        columnShape: form.columnShape,
        length: form.columnShape === 'rectangular' ? Number(form.width) : undefined,
        width: form.columnShape === 'rectangular' ? Number(form.depth) : undefined,
        diameter: form.columnShape === 'circular' ? Number(form.diameter) : undefined,
        height: Number(form.height),
        lengthUnit: form.widthUnit,
        widthUnit: form.depthUnit,
        diameterUnit: form.diameterUnit,
        heightUnit: form.heightUnit,
        quantity: Number(form.quantity) || 1,
        wastagePercent: Number(form.wastagePercent) || 0,
        grade: form.grade,
        includeMaterialBreakdown: form.includeMaterialBreakdown,
        includeSteelEstimate: false,
        ratePerM3Inr:
          form.includeCost && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
      };
      const next = calculateColumnVolume(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'column-calculator',
        methodologyVersionLabel: next.version ?? RCC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/column-calculator',
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
    const shape = result.columnShape ?? 'column';
    const text = `Varnarc ${shape} column: ${result.wetVolumeOneM3} m³ each, total wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³. Volume planning only — not structural design.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Column calculator', text, url: window.location.href });
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
      `Shape,${result.columnShape ?? ''},`,
      `Individual column volume,${result.wetVolumeOneM3},m3`,
      `Total wet concrete,${result.wetVolumeM3},m3`,
      `Order concrete,${result.orderVolumeM3},m3`,
      result.materials ? `Cement,${result.materials.cementBags},bags` : '',
      result.materials ? `Sand,${result.materials.sandM3},m3` : '',
      result.materials ? `Aggregate,${result.materials.aggregateM3},m3` : '',
      result.estimatedCostInr != null
        ? `Estimated concrete cost,${result.estimatedCostInr},INR`
        : '',
      `NOTE,"Volume planning only — not structural design or load-capacity calculations.",`,
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-column-boq.csv';
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
          name: projectName.trim() || 'Column estimate',
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
      submitLabel="Calculate column volume"
    >
      <aside className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Volume planning only</p>
        <p className="mt-1 text-sm text-slate-600">
          Estimates concrete volume and materials. Does not provide structural design or
          load-capacity calculations.
        </p>
      </aside>

      <UnitSelector
        id="col-shape"
        label="Column shape"
        value={form.columnShape}
        onChange={(v) => {
          setField('columnShape', v as RccColumnShape);
          setResult(null);
        }}
        options={[
          { value: 'rectangular', label: 'Rectangular' },
          { value: 'circular', label: 'Circular' },
        ]}
        className="sm:col-span-2"
      />

      {form.columnShape === 'rectangular' ? (
        <>
          <CalculatorInput
            id="col-b"
            label="Width (B)"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
          <CalculatorSelect
            id="col-bu"
            label="Width unit"
            value={form.widthUnit}
            onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="col-d"
            label="Depth (D)"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.depth}
            onChange={(e) => setField('depth', e.target.value)}
          />
          <CalculatorSelect
            id="col-du"
            label="Depth unit"
            value={form.depthUnit}
            onChange={(e) => setField('depthUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
        </>
      ) : (
        <>
          <CalculatorInput
            id="col-dia"
            label="Diameter (Ø)"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.diameter}
            onChange={(e) => setField('diameter', e.target.value)}
          />
          <CalculatorSelect
            id="col-diau"
            label="Diameter unit"
            value={form.diameterUnit}
            onChange={(e) => setField('diameterUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
        </>
      )}

      <CalculatorInput
        id="col-h"
        label="Height (H)"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.height}
        onChange={(e) => setField('height', e.target.value)}
      />
      <CalculatorSelect
        id="col-hu"
        label="Height unit"
        value={form.heightUnit}
        onChange={(e) => setField('heightUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="col-qty"
        label="Number of columns"
        type="number"
        min={1}
        step={1}
        value={form.quantity}
        onChange={(e) => setField('quantity', e.target.value)}
      />
      <CalculatorInput
        id="col-waste"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <UnitSelector
        id="col-mats"
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
          id="col-grade"
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
        id="col-cost"
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
          id="col-rate"
          label="Concrete rate ₹ / m³"
          type="number"
          min={1}
          value={form.ratePerM3Inr}
          onChange={(e) => setField('ratePerM3Inr', e.target.value)}
          className="sm:col-span-2"
        />
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
      {result.columnShape === 'circular' && result.dimensionsM?.diameter != null ? (
        <CircularColumnDiagram
          diameterM={result.dimensionsM.diameter}
          heightM={result.dimensionsM.height ?? 0}
        />
      ) : result.dimensionsM?.height != null ? (
        <RectangularColumnDiagram
          widthM={result.dimensionsM.length}
          depthM={result.dimensionsM.width}
          heightM={result.dimensionsM.height}
        />
      ) : null}

      <CalculationResult
        label="Individual column volume"
        value={`${result.wetVolumeOneM3.toLocaleString('en-IN')} m³`}
        hint={`Total wet ${result.wetVolumeM3} m³ (${result.quantity} columns) · order ${result.orderVolumeM3} m³. Indicative only — not structural design.`}
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
            <Link href="/construction/beam-calculator" className={cx.secondaryBtn}>
              Beam
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
          </div>
        }
      />

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
          { label: 'Column calculator' },
        ]}
        title="Column concrete calculator"
        description="Estimate RCC column concrete for rectangular or circular sections — dimensions, height, quantity and wastage. Optional mix materials and cost. Does not provide structural design or load-capacity calculations."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              Rectangular: V = B × D × H · Circular: V = π × (Ø/2)² × H · Total = V × qty · Order =
              Total × (1 + wastage%)
            </p>
            <p>
              Material estimates reuse the shared RCC dry-factor and grade mix path. No structural
              design or load-capacity output is produced.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{COLUMN_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{COLUMN_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={COLUMN_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate column volume', onClick: () => runCalculate() },
          secondary: { label: 'Beam calculator', href: '/construction/beam-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={COLUMN_CALC_RELATED} />
      </div>
    </>
  );
}
