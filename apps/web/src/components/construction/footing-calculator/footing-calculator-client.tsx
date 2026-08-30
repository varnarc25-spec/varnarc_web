'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  calculateFootingVolume,
  type RccCalculatorResult,
  type RccFootingShape,
  type RccGrade,
  type RccPccMix,
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
  FOOTING_CALC_FAQS,
  FOOTING_CALC_RELATED,
  FOOTING_CALC_SEO,
  FOOTING_WORKED_EXAMPLE,
} from './content';
import { FootingDimensionDiagram } from './footing-dimension-diagram';

const CALC_TYPE = 'footing_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  footingShape: RccFootingShape;
  length: string;
  width: string;
  depth: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  depthUnit: LengthUnit;
  quantity: string;
  wastagePercent: string;
  grade: RccGrade;
  includeMaterialBreakdown: boolean;
  includePccLayer: boolean;
  pccThickness: string;
  pccThicknessUnit: LengthUnit;
  pccMix: RccPccMix;
  includeCost: boolean;
  ratePerM3Inr: string;
  pccRatePerM3Inr: string;
};

function defaultForm(): FormState {
  return {
    footingShape: 'rectangular',
    length: '2',
    width: '1.5',
    depth: '400',
    lengthUnit: 'm',
    widthUnit: 'm',
    depthUnit: 'mm',
    quantity: '1',
    wastagePercent: '5',
    grade: 'M20',
    includeMaterialBreakdown: true,
    includePccLayer: false,
    pccThickness: '75',
    pccThicknessUnit: 'mm',
    pccMix: 'M7.5',
    includeCost: false,
    ratePerM3Inr: '',
    pccRatePerM3Inr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'm', label: 'm' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft' },
  { value: 'inch', label: 'inch' },
];

export function FootingCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<RccCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Footing estimate');
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
        footingShape: form.footingShape,
        length: Number(form.length),
        width: form.footingShape === 'square' ? Number(form.length) : Number(form.width),
        thickness: Number(form.depth),
        lengthUnit: form.lengthUnit,
        widthUnit: form.footingShape === 'square' ? form.lengthUnit : form.widthUnit,
        thicknessUnit: form.depthUnit,
        quantity: Number(form.quantity) || 1,
        wastagePercent: Number(form.wastagePercent) || 0,
        grade: form.grade,
        includeMaterialBreakdown: form.includeMaterialBreakdown,
        includePccLayer: form.includePccLayer,
        pccThickness: form.includePccLayer ? Number(form.pccThickness) : undefined,
        pccThicknessUnit: form.pccThicknessUnit,
        pccMix: form.pccMix,
        includeSteelEstimate: false,
        ratePerM3Inr:
          form.includeCost && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
        pccRatePerM3Inr:
          form.includeCost && form.includePccLayer && form.pccRatePerM3Inr.trim()
            ? Number(form.pccRatePerM3Inr)
            : null,
      };
      const next = calculateFootingVolume(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'footing-calculator',
        methodologyVersionLabel: next.version ?? RCC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/footing-calculator',
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
    const pccBit = result.pcc ? ` PCC order ${result.pcc.orderVolumeM3} m³.` : '';
    const text = `Varnarc footing: RCC wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³.${pccBit} Volume planning only — not footing sizing from loads.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Footing calculator', text, url: window.location.href });
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
      `Shape,${result.footingShape ?? ''},`,
      `RCC wet volume,${result.wetVolumeM3},m3`,
      `RCC order volume,${result.orderVolumeM3},m3`,
      result.materials ? `RCC cement,${result.materials.cementBags},bags` : '',
      result.materials ? `RCC sand,${result.materials.sandM3},m3` : '',
      result.materials ? `RCC aggregate,${result.materials.aggregateM3},m3` : '',
      result.pcc ? `PCC wet volume,${result.pcc.wetVolumeM3},m3` : '',
      result.pcc ? `PCC order volume,${result.pcc.orderVolumeM3},m3` : '',
      result.pcc?.materials ? `PCC cement,${result.pcc.materials.cementBags},bags` : '',
      result.pcc?.materials ? `PCC sand,${result.pcc.materials.sandM3},m3` : '',
      result.pcc?.materials ? `PCC aggregate,${result.pcc.materials.aggregateM3},m3` : '',
      result.estimatedCostInr != null ? `RCC cost,${result.estimatedCostInr},INR` : '',
      result.pcc?.estimatedCostInr != null ? `PCC cost,${result.pcc.estimatedCostInr},INR` : '',
      result.totalEstimatedCostInr != null
        ? `Total estimated cost,${result.totalEstimatedCostInr},INR`
        : '',
      `NOTE,"Does not size footings from building loads — volume planning only.",`,
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-footing-boq.csv';
    a.click();
    URL.revokeObjectURL(url);
    setActionMsg('BOQ CSV downloaded.');
  }

  async function addToProject() {
    if (!result) return;
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const vol = result.orderVolumeM3 + (result.pcc?.orderVolumeM3 ?? 0);
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Footing estimate',
          areaSqft: Math.max(1, Math.round(vol * 50)),
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
      submitLabel="Calculate footing volume"
    >
      <aside className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Volume planning only</p>
        <p className="mt-1 text-sm text-slate-600">
          Enter footing dimensions from drawings. This tool does not size footings from building
          loads or provide structural design.
        </p>
      </aside>

      <UnitSelector
        id="ft-shape"
        label="Footing shape"
        value={form.footingShape}
        onChange={(v) => {
          setField('footingShape', v as RccFootingShape);
          setResult(null);
        }}
        options={[
          { value: 'rectangular', label: 'Rectangular' },
          { value: 'square', label: 'Square' },
        ]}
        className="sm:col-span-2"
      />

      <CalculatorInput
        id="ft-l"
        label={form.footingShape === 'square' ? 'Side length (L)' : 'Length (L)'}
        type="number"
        min={0.001}
        step="any"
        required
        value={form.length}
        onChange={(e) => setField('length', e.target.value)}
      />
      <CalculatorSelect
        id="ft-lu"
        label="Length unit"
        value={form.lengthUnit}
        onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />

      {form.footingShape === 'rectangular' ? (
        <>
          <CalculatorInput
            id="ft-w"
            label="Width (W)"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
          <CalculatorSelect
            id="ft-wu"
            label="Width unit"
            value={form.widthUnit}
            onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
        </>
      ) : null}

      <CalculatorInput
        id="ft-d"
        label="Depth (D)"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.depth}
        onChange={(e) => setField('depth', e.target.value)}
      />
      <CalculatorSelect
        id="ft-du"
        label="Depth unit"
        value={form.depthUnit}
        onChange={(e) => setField('depthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="ft-qty"
        label="Quantity"
        type="number"
        min={1}
        step={1}
        value={form.quantity}
        onChange={(e) => setField('quantity', e.target.value)}
      />
      <CalculatorInput
        id="ft-waste"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <UnitSelector
        id="ft-pcc"
        label="PCC layer"
        value={form.includePccLayer ? 'yes' : 'no'}
        onChange={(v) => setField('includePccLayer', v === 'yes')}
        options={[
          { value: 'no', label: 'Skip' },
          { value: 'yes', label: 'Include lean PCC bed' },
        ]}
        className="sm:col-span-2"
      />
      {form.includePccLayer ? (
        <>
          <CalculatorInput
            id="ft-pcc-t"
            label="PCC thickness"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.pccThickness}
            onChange={(e) => setField('pccThickness', e.target.value)}
          />
          <CalculatorSelect
            id="ft-pcc-tu"
            label="PCC thickness unit"
            value={form.pccThicknessUnit}
            onChange={(e) => setField('pccThicknessUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
          <CalculatorSelect
            id="ft-pcc-mix"
            label="PCC lean mix"
            value={form.pccMix}
            onChange={(e) => setField('pccMix', e.target.value as RccPccMix)}
            options={[
              { value: 'M5', label: 'M5 (1:5:10)' },
              { value: 'M7.5', label: 'M7.5 (1:4:8)' },
              { value: 'M10', label: 'M10 (1:3:6)' },
            ]}
            className="sm:col-span-2"
          />
        </>
      ) : null}

      <UnitSelector
        id="ft-mats"
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
          id="ft-grade"
          label="RCC grade"
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
        id="ft-cost"
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
        <>
          <CalculatorInput
            id="ft-rate"
            label="RCC rate ₹ / m³"
            type="number"
            min={1}
            value={form.ratePerM3Inr}
            onChange={(e) => setField('ratePerM3Inr', e.target.value)}
            className={form.includePccLayer ? undefined : 'sm:col-span-2'}
          />
          {form.includePccLayer ? (
            <CalculatorInput
              id="ft-pcc-rate"
              label="PCC rate ₹ / m³"
              type="number"
              min={1}
              value={form.pccRatePerM3Inr}
              onChange={(e) => setField('pccRatePerM3Inr', e.target.value)}
            />
          ) : null}
        </>
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
        <FootingDimensionDiagram
          lengthM={result.dimensionsM.length}
          widthM={result.dimensionsM.width}
          depthM={result.dimensionsM.thickness}
          pccThicknessM={result.pcc?.thicknessM}
          shape={result.footingShape === 'square' ? 'square' : 'rectangular'}
        />
      ) : null}

      <CalculationResult
        label="RCC concrete volume (wet)"
        value={`${result.wetVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`Each ${result.wetVolumeOneM3} m³ · order ${result.orderVolumeM3} m³ (+${result.wastagePercent}% wastage). Indicative only — not footing sizing from loads.`}
        metrics={[
          {
            id: 'order',
            label: 'RCC order volume',
            value: `${result.orderVolumeM3} m³`,
          },
          ...(result.planAreaOneM2 != null
            ? [
                {
                  id: 'plan',
                  label: 'Plan area (one)',
                  value: `${result.planAreaOneM2} m²`,
                },
              ]
            : []),
          ...(result.pcc
            ? [
                {
                  id: 'pcc-wet',
                  label: 'PCC wet volume',
                  value: `${result.pcc.wetVolumeM3} m³`,
                  hint: `Each ${result.pcc.wetVolumeOneM3} m³ · ${result.pcc.mixLabel}`,
                },
                {
                  id: 'pcc-order',
                  label: 'PCC order volume',
                  value: `${result.pcc.orderVolumeM3} m³`,
                },
              ]
            : []),
          ...(result.materials
            ? [
                {
                  id: 'cement',
                  label: 'RCC cement',
                  value: `${result.materials.cementBags} bags`,
                  hint: `${result.materials.cementKg} kg · ${result.materials.mixLabel}`,
                },
                {
                  id: 'sand',
                  label: 'RCC sand',
                  value: `${result.materials.sandM3} m³`,
                },
                {
                  id: 'agg',
                  label: 'RCC aggregate',
                  value: `${result.materials.aggregateM3} m³`,
                },
              ]
            : []),
          ...(result.pcc?.materials
            ? [
                {
                  id: 'pcc-cement',
                  label: 'PCC cement',
                  value: `${result.pcc.materials.cementBags} bags`,
                  hint: `${result.pcc.materials.cementKg} kg · ${result.pcc.mixLabel}`,
                },
                {
                  id: 'pcc-sand',
                  label: 'PCC sand',
                  value: `${result.pcc.materials.sandM3} m³`,
                },
                {
                  id: 'pcc-agg',
                  label: 'PCC aggregate',
                  value: `${result.pcc.materials.aggregateM3} m³`,
                },
              ]
            : []),
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'rcc-cost',
                  label: 'RCC estimated cost',
                  value: formatInr(result.estimatedCostInr),
                },
              ]
            : []),
          ...(result.pcc?.estimatedCostInr != null
            ? [
                {
                  id: 'pcc-cost',
                  label: 'PCC estimated cost',
                  value: formatInr(result.pcc.estimatedCostInr),
                },
              ]
            : []),
          ...(result.totalEstimatedCostInr != null
            ? [
                {
                  id: 'total-cost',
                  label: 'Total estimated cost',
                  value: formatInr(result.totalEstimatedCostInr),
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
            <Link href="/construction/column-calculator" className={cx.secondaryBtn}>
              Column
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
          </div>
        }
      />

      <MethodologyPanel
        title="Step-by-step methodology"
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
          { label: 'Footing calculator' },
        ]}
        title="Footing concrete calculator"
        description="Estimate RCC footing concrete for rectangular or square footings — length, width, depth, quantity and wastage. Optional lean PCC bed, mix materials and cost. Does not size footings from building loads."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              V_rcc = L × W × D × qty · V_pcc = L × W × t_pcc × qty (optional) · Order = wet × (1 +
              wastage%)
            </p>
            <p>
              Square mode sets W = L. Material estimates reuse shared dry-factor and mix utilities.
              No structural footing sizing from loads is performed.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{FOOTING_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{FOOTING_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={FOOTING_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate footing volume', onClick: () => runCalculate() },
          secondary: { label: 'Column calculator', href: '/construction/column-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={FOOTING_CALC_RELATED} />
      </div>
    </>
  );
}
