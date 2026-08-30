'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  DEFAULT_AGGREGATE_DENSITY_KG_PER_M3,
  calculateAggregateQuantity,
  type AggregateMixPreset,
  type AggregateUseCase,
  type AggregateCalculatorResult,
  AGGREGATE_CALC_VERSION,
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
  AGGREGATE_CALC_FAQS,
  AGGREGATE_CALC_RELATED,
  AGGREGATE_CALC_SEO,
  AGGREGATE_WORKED_EXAMPLE,
} from './content';

const CALC_TYPE = 'aggregate_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  useCase: AggregateUseCase;
  volume: string;
  volumeUnit: 'm3' | 'ft3' | 'liter';
  fillMode: 'volume' | 'dimensions';
  length: string;
  width: string;
  depth: string;
  lengthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  widthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  depthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  area: string;
  areaUnit: 'm2' | 'ft2' | 'yard2';
  thickness: string;
  thicknessUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  mixPreset: AggregateMixPreset;
  cementParts: string;
  sandParts: string;
  aggregateParts: string;
  wastagePercent: string;
  densityKgPerM3: string;
  rateMode: 'm3' | 'tonne' | 'none';
  ratePerM3Inr: string;
  ratePerTonneInr: string;
};

function defaultForm(useCase: AggregateUseCase = 'concrete'): FormState {
  return {
    useCase,
    volume: '1',
    volumeUnit: 'm3',
    fillMode: 'dimensions',
    length: '10',
    width: '4',
    depth: '0.3',
    lengthUnit: 'm',
    widthUnit: 'm',
    depthUnit: 'm',
    area: '100',
    areaUnit: 'm2',
    thickness: '150',
    thicknessUnit: 'mm',
    mixPreset: 'M20',
    cementParts: '1',
    sandParts: '1.5',
    aggregateParts: '3',
    wastagePercent: '5',
    densityKgPerM3: String(DEFAULT_AGGREGATE_DENSITY_KG_PER_M3),
    rateMode: 'none',
    ratePerM3Inr: '',
    ratePerTonneInr: '',
  };
}

export function AggregateCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<AggregateCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Aggregate estimate');
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
        useCase: form.useCase,
        volume:
          form.useCase === 'concrete' ||
          (form.useCase === 'generic_fill' && form.fillMode === 'volume')
            ? Number(form.volume)
            : undefined,
        volumeUnit: form.volumeUnit,
        length:
          form.useCase === 'generic_fill' && form.fillMode === 'dimensions'
            ? Number(form.length)
            : undefined,
        width:
          form.useCase === 'generic_fill' && form.fillMode === 'dimensions'
            ? Number(form.width)
            : undefined,
        depth:
          form.useCase === 'generic_fill' && form.fillMode === 'dimensions'
            ? Number(form.depth)
            : undefined,
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        depthUnit: form.depthUnit,
        area: form.useCase === 'area_depth' ? Number(form.area) : undefined,
        areaUnit: form.areaUnit,
        thickness: form.useCase === 'area_depth' ? Number(form.thickness) : undefined,
        thicknessUnit: form.thicknessUnit,
        mixPreset: form.mixPreset,
        cementParts: form.mixPreset === 'custom' ? Number(form.cementParts) : undefined,
        sandParts: form.mixPreset === 'custom' ? Number(form.sandParts) : undefined,
        aggregateParts: form.mixPreset === 'custom' ? Number(form.aggregateParts) : undefined,
        wastagePercent: Number(form.wastagePercent) || 0,
        densityKgPerM3: Number(form.densityKgPerM3) || DEFAULT_AGGREGATE_DENSITY_KG_PER_M3,
        ratePerM3Inr:
          form.rateMode === 'm3' && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
        ratePerTonneInr:
          form.rateMode === 'tonne' && form.ratePerTonneInr.trim()
            ? Number(form.ratePerTonneInr)
            : null,
      };
      const next = calculateAggregateQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'aggregate-calculator',
        methodologyVersionLabel: next.version ?? AGGREGATE_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/aggregate-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'm3',
        result_range_category:
          next.aggregateVolumeM3 <= 5 ? 'low' : next.aggregateVolumeM3 <= 50 ? 'mid' : 'high',
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
    const text = `Varnarc aggregate: ${result.aggregateVolumeM3} m³ (${result.aggregateVolumeFt3} ft³) ≈ ${result.estimatedTonnes} t @ ${result.densityKgPerM3} kg/m³. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Aggregate calculator',
          text,
          url: window.location.href,
        });
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
      `Aggregate volume,${result.aggregateVolumeM3},m3`,
      `Aggregate volume,${result.aggregateVolumeFt3},ft3`,
      `Aggregate mass,${result.estimatedKg},kg`,
      `Aggregate mass,${result.estimatedTonnes},tonne`,
      result.estimatedCostInr != null ? `Estimated cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-aggregate-boq-${result.useCase}.csv`;
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
          name: projectName.trim() || 'Aggregate estimate',
          areaSqft: Math.max(1, Math.round(result.aggregateVolumeM3 * 10)),
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

  const lengthUnits = [
    { value: 'm', label: 'm' },
    { value: 'ft', label: 'ft' },
    { value: 'cm', label: 'cm' },
    { value: 'mm', label: 'mm' },
    { value: 'inch', label: 'inch' },
  ];

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={runCalculate}
      onReset={() => {
        setForm(defaultForm('concrete'));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate aggregate"
    >
      <UnitSelector
        id="agg-use-case"
        label="Use case"
        value={form.useCase}
        onChange={(v) => {
          setField('useCase', v as AggregateUseCase);
          setResult(null);
        }}
        options={[
          { value: 'concrete', label: 'Concrete mix' },
          { value: 'generic_fill', label: 'Generic fill' },
          { value: 'area_depth', label: 'Area × depth' },
        ]}
        className="sm:col-span-2"
      />

      {form.useCase === 'concrete' ? (
        <>
          <CalculatorInput
            id="agg-volume"
            label="Concrete volume"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.volume}
            onChange={(e) => setField('volume', e.target.value)}
          />
          <CalculatorSelect
            id="agg-volume-unit"
            label="Volume unit"
            value={form.volumeUnit}
            onChange={(e) => setField('volumeUnit', e.target.value as FormState['volumeUnit'])}
            options={[
              { value: 'm3', label: 'm³' },
              { value: 'ft3', label: 'ft³' },
              { value: 'liter', label: 'litre' },
            ]}
          />
          <CalculatorSelect
            id="agg-mix"
            label="Concrete mix"
            value={form.mixPreset}
            onChange={(e) => setField('mixPreset', e.target.value as AggregateMixPreset)}
            options={[
              { value: 'M5', label: 'M5 (1:5:10)' },
              { value: 'M7.5', label: 'M7.5 (1:4:8)' },
              { value: 'M10', label: 'M10 (1:3:6)' },
              { value: 'M15', label: 'M15 (1:2:4)' },
              { value: 'M20', label: 'M20 (1:1.5:3)' },
              { value: 'M25', label: 'M25 (1:1:2)' },
              { value: 'custom', label: 'Custom mix' },
            ]}
            className="sm:col-span-2"
          />
          {form.mixPreset === 'custom' ? (
            <>
              <CalculatorInput
                id="agg-c"
                label="Cement parts"
                type="number"
                min={0.1}
                value={form.cementParts}
                onChange={(e) => setField('cementParts', e.target.value)}
              />
              <CalculatorInput
                id="agg-s"
                label="Sand parts"
                type="number"
                min={0.1}
                value={form.sandParts}
                onChange={(e) => setField('sandParts', e.target.value)}
              />
              <CalculatorInput
                id="agg-a"
                label="Aggregate parts"
                type="number"
                min={0.1}
                value={form.aggregateParts}
                onChange={(e) => setField('aggregateParts', e.target.value)}
                className="sm:col-span-2"
              />
            </>
          ) : null}
        </>
      ) : null}

      {form.useCase === 'generic_fill' ? (
        <>
          <UnitSelector
            id="agg-fill-mode"
            label="Fill input"
            value={form.fillMode}
            onChange={(v) => setField('fillMode', v as 'volume' | 'dimensions')}
            options={[
              { value: 'dimensions', label: 'L × W × D' },
              { value: 'volume', label: 'Volume' },
            ]}
            className="sm:col-span-2"
          />
          {form.fillMode === 'volume' ? (
            <>
              <CalculatorInput
                id="agg-fill-vol"
                label="Volume"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.volume}
                onChange={(e) => setField('volume', e.target.value)}
              />
              <CalculatorSelect
                id="agg-fill-vol-unit"
                label="Volume unit"
                value={form.volumeUnit}
                onChange={(e) => setField('volumeUnit', e.target.value as FormState['volumeUnit'])}
                options={[
                  { value: 'm3', label: 'm³' },
                  { value: 'ft3', label: 'ft³' },
                  { value: 'liter', label: 'litre' },
                ]}
              />
            </>
          ) : (
            <>
              <CalculatorInput
                id="agg-l"
                label="Length"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.length}
                onChange={(e) => setField('length', e.target.value)}
              />
              <CalculatorSelect
                id="agg-lu"
                label="Length unit"
                value={form.lengthUnit}
                onChange={(e) => setField('lengthUnit', e.target.value as FormState['lengthUnit'])}
                options={lengthUnits}
              />
              <CalculatorInput
                id="agg-w"
                label="Width"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.width}
                onChange={(e) => setField('width', e.target.value)}
              />
              <CalculatorSelect
                id="agg-wu"
                label="Width unit"
                value={form.widthUnit}
                onChange={(e) => setField('widthUnit', e.target.value as FormState['widthUnit'])}
                options={lengthUnits}
              />
              <CalculatorInput
                id="agg-d"
                label="Depth"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
              />
              <CalculatorSelect
                id="agg-du"
                label="Depth unit"
                value={form.depthUnit}
                onChange={(e) => setField('depthUnit', e.target.value as FormState['depthUnit'])}
                options={lengthUnits}
              />
            </>
          )}
        </>
      ) : null}

      {form.useCase === 'area_depth' ? (
        <>
          <CalculatorInput
            id="agg-area"
            label="Area"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.area}
            onChange={(e) => setField('area', e.target.value)}
          />
          <CalculatorSelect
            id="agg-area-unit"
            label="Area unit"
            value={form.areaUnit}
            onChange={(e) => setField('areaUnit', e.target.value as FormState['areaUnit'])}
            options={[
              { value: 'm2', label: 'm²' },
              { value: 'ft2', label: 'ft²' },
              { value: 'yard2', label: 'sq yard' },
            ]}
          />
          <CalculatorInput
            id="agg-thk"
            label="Depth"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.thickness}
            onChange={(e) => setField('thickness', e.target.value)}
          />
          <CalculatorSelect
            id="agg-thk-unit"
            label="Depth unit"
            value={form.thicknessUnit}
            onChange={(e) =>
              setField('thicknessUnit', e.target.value as FormState['thicknessUnit'])
            }
            options={lengthUnits}
          />
        </>
      ) : null}

      <CalculatorInput
        id="agg-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="agg-density"
        label="Bulk density (kg/m³)"
        type="number"
        min={500}
        max={3000}
        required
        value={form.densityKgPerM3}
        onChange={(e) => setField('densityKgPerM3', e.target.value)}
        hint="Editable assumption for kg / tonnes"
      />

      <UnitSelector
        id="agg-rate-mode"
        label="Cost rate basis"
        value={form.rateMode}
        onChange={(v) => setField('rateMode', v as FormState['rateMode'])}
        options={[
          { value: 'none', label: 'No cost' },
          { value: 'm3', label: '₹ / m³' },
          { value: 'tonne', label: '₹ / tonne' },
        ]}
        className="sm:col-span-2"
      />
      {form.rateMode === 'm3' ? (
        <CalculatorInput
          id="agg-rate-m3"
          label="Rate ₹ / m³"
          type="number"
          min={1}
          value={form.ratePerM3Inr}
          onChange={(e) => setField('ratePerM3Inr', e.target.value)}
          className="sm:col-span-2"
        />
      ) : null}
      {form.rateMode === 'tonne' ? (
        <CalculatorInput
          id="agg-rate-t"
          label="Rate ₹ / tonne"
          type="number"
          min={1}
          value={form.ratePerTonneInr}
          onChange={(e) => setField('ratePerTonneInr', e.target.value)}
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
      <CalculationResult
        label="Aggregate volume"
        value={`${result.aggregateVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`${result.aggregateVolumeFt3} ft³ · ${result.estimatedKg} kg · ${result.estimatedTonnes} t @ ${result.densityKgPerM3} kg/m³. Indicative only.`}
        metrics={[
          { id: 'ft3', label: 'Cubic feet', value: `${result.aggregateVolumeFt3} ft³` },
          { id: 'kg', label: 'Estimated kg', value: `${result.estimatedKg} kg` },
          {
            id: 'tonnes',
            label: 'Estimated tonnes',
            value: String(result.estimatedTonnes),
            hint: `Density assumption ${result.densityKgPerM3} kg/m³`,
          },
          {
            id: 'waste',
            label: 'Wastage impact',
            value: `+${result.wastageExtraM3} m³ (${result.wastagePercent}%)`,
          },
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
            <Link href="/construction/concrete-calculator" className={cx.secondaryBtn}>
              Concrete calculator
            </Link>
            <Link href="/construction/cement-calculator" className={cx.secondaryBtn}>
              Cement calculator
            </Link>
            <Link href="/construction/sand-calculator" className={cx.secondaryBtn}>
              Sand calculator
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={downloadBoq}>
              Add to BOQ
            </button>
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
          { label: 'Aggregate calculator' },
        ]}
        title="Aggregate calculator"
        description="Estimate crushed stone / jelly for concrete mixes, generic fill and area × depth — with editable density, wastage and optional cost."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              agg_m³ = wet × 1.54 × (a/Σparts) × (1 + wastage%) · kg = m³ × density
            </p>
            <p>
              Density is an editable bulk-density assumption (default{' '}
              {DEFAULT_AGGREGATE_DENSITY_KG_PER_M3} kg/m³). Concrete mixes share conventions with
              the cement and concrete calculators.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{AGGREGATE_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{AGGREGATE_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={AGGREGATE_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate aggregate', onClick: () => runCalculate() },
          secondary: {
            label: 'Concrete calculator',
            href: '/construction/concrete-calculator',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={AGGREGATE_CALC_RELATED} />
      </div>
    </>
  );
}
