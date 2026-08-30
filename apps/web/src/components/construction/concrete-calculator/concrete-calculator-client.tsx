'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateConcreteQuantity,
  listConcreteMixPresets,
  type ConcreteMixPreset,
  type ConcreteShape,
  type ConcreteCalculatorResult,
  CONCRETE_CALC_VERSION,
} from '@varnarc/validation';
import {
  CalculationBreakdown,
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
  UnitSelector,
} from '@/components/construction/calculator';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
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
import { useRestoreSharedCalculation } from '@/lib/construction/share-calculation/use-restore-shared';
import { CONCRETE_CALC_FAQS, CONCRETE_CALC_SEO, CONCRETE_WORKED_EXAMPLE } from './content';
import { ConcreteShapeDiagram } from './shape-diagram';

const CALC_TYPE = 'concrete_calculator';

const LENGTH_UNITS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'inch', label: 'inch' },
  { value: 'ft', label: 'ft' },
];

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  shape: ConcreteShape;
  length: string;
  width: string;
  height: string;
  thickness: string;
  depth: string;
  diameter: string;
  radius: string;
  useRadius: boolean;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  heightUnit: LengthUnit;
  thicknessUnit: LengthUnit;
  depthUnit: LengthUnit;
  diameterUnit: LengthUnit;
  radiusUnit: LengthUnit;
  mixPreset: ConcreteMixPreset;
  cementParts: string;
  sandParts: string;
  aggregateParts: string;
  waterCementRatio: string;
  includeMaterialBreakdown: boolean;
  wastagePercent: string;
  ratePerM3Inr: string;
};

function defaultForm(shape: ConcreteShape = 'slab'): FormState {
  return {
    shape,
    length: '5',
    width: '4',
    height: '3',
    thickness: '150',
    depth: '0.45',
    diameter: '0.4',
    radius: '0.2',
    useRadius: false,
    lengthUnit: 'm',
    widthUnit: 'm',
    heightUnit: 'm',
    thicknessUnit: 'mm',
    depthUnit: 'm',
    diameterUnit: 'm',
    radiusUnit: 'm',
    mixPreset: 'M20',
    cementParts: '1',
    sandParts: '1.5',
    aggregateParts: '3',
    waterCementRatio: '0.45',
    includeMaterialBreakdown: true,
    wastagePercent: '5',
    ratePerM3Inr: '',
  };
}

function parseShape(raw?: string): ConcreteShape | null {
  const allowed: ConcreteShape[] = [
    'slab',
    'rectangular_footing',
    'column',
    'wall',
    'circular_column',
    'custom_rectangular',
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as ConcreteShape;
  return null;
}

function formFromParams(params?: {
  shape?: string;
  length?: string;
  width?: string;
  height?: string;
  wastage?: string;
}): FormState {
  const shape = parseShape(params?.shape) ?? 'slab';
  const next = defaultForm(shape);
  if (params?.length) next.length = params.length.replace(/[^\d.]/g, '') || next.length;
  if (params?.width) next.width = params.width.replace(/[^\d.]/g, '') || next.width;
  if (params?.height) next.height = params.height.replace(/[^\d.]/g, '') || next.height;
  if (params?.wastage) {
    next.wastagePercent = params.wastage.replace(/[^\d.]/g, '') || next.wastagePercent;
  }
  return next;
}

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const shape = parseShape(String(inputs.shape ?? '')) ?? 'slab';
  const next = defaultForm(shape);
  const str = (key: keyof FormState, value: unknown) => {
    if (typeof value === 'number') (next[key] as string) = String(value);
    else if (typeof value === 'string') (next[key] as string) = value;
  };
  str('length', inputs.length);
  str('width', inputs.width);
  str('height', inputs.height);
  str('thickness', inputs.thickness);
  str('depth', inputs.depth);
  str('diameter', inputs.diameter);
  str('radius', inputs.radius);
  str('cementParts', inputs.cementParts);
  str('sandParts', inputs.sandParts);
  str('aggregateParts', inputs.aggregateParts);
  str('waterCementRatio', inputs.waterCementRatio);
  str('wastagePercent', inputs.wastagePercent);
  if (typeof inputs.ratePerM3Inr === 'number') next.ratePerM3Inr = String(inputs.ratePerM3Inr);
  if (typeof inputs.lengthUnit === 'string') next.lengthUnit = inputs.lengthUnit as LengthUnit;
  if (typeof inputs.widthUnit === 'string') next.widthUnit = inputs.widthUnit as LengthUnit;
  if (typeof inputs.heightUnit === 'string') next.heightUnit = inputs.heightUnit as LengthUnit;
  if (typeof inputs.thicknessUnit === 'string') {
    next.thicknessUnit = inputs.thicknessUnit as LengthUnit;
  }
  if (typeof inputs.depthUnit === 'string') next.depthUnit = inputs.depthUnit as LengthUnit;
  if (typeof inputs.diameterUnit === 'string') {
    next.diameterUnit = inputs.diameterUnit as LengthUnit;
  }
  if (typeof inputs.radiusUnit === 'string') next.radiusUnit = inputs.radiusUnit as LengthUnit;
  if (typeof inputs.mixPreset === 'string') {
    next.mixPreset = inputs.mixPreset as ConcreteMixPreset;
  }
  if (typeof inputs.includeMaterialBreakdown === 'boolean') {
    next.includeMaterialBreakdown = inputs.includeMaterialBreakdown;
  }
  if (typeof inputs.radius === 'number' && inputs.diameter == null) {
    next.useRadius = true;
  }
  return next;
}

function buildConcretePayload(form: FormState) {
  return {
    shape: form.shape,
    length: Number(form.length) || undefined,
    width: Number(form.width) || undefined,
    height: Number(form.height) || undefined,
    thickness: Number(form.thickness) || undefined,
    depth: Number(form.depth) || undefined,
    diameter:
      form.shape === 'circular_column' && !form.useRadius
        ? Number(form.diameter) || undefined
        : undefined,
    radius:
      form.shape === 'circular_column' && form.useRadius
        ? Number(form.radius) || undefined
        : undefined,
    lengthUnit: form.lengthUnit,
    widthUnit: form.widthUnit,
    heightUnit: form.heightUnit,
    thicknessUnit: form.thicknessUnit,
    depthUnit: form.depthUnit,
    diameterUnit: form.diameterUnit,
    radiusUnit: form.radiusUnit,
    mixPreset: form.mixPreset,
    cementParts: form.mixPreset === 'custom' ? Number(form.cementParts) : undefined,
    sandParts: form.mixPreset === 'custom' ? Number(form.sandParts) : undefined,
    aggregateParts: form.mixPreset === 'custom' ? Number(form.aggregateParts) : undefined,
    waterCementRatio: Number(form.waterCementRatio) || 0.45,
    includeMaterialBreakdown: form.includeMaterialBreakdown,
    wastagePercent: Number(form.wastagePercent) || 0,
    ratePerM3Inr: form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
  };
}

export function ConcreteCalculatorClient({
  initialParams,
  initialShareInputs = null,
}: {
  initialParams?: {
    shape?: string;
    length?: string;
    width?: string;
    height?: string;
    wastage?: string;
  };
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : formFromParams(initialParams),
  );
  const [result, setResult] = useState<ConcreteCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Concrete estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const payload = buildConcretePayload(nextForm);
      const next = calculateConcreteQuantity(payload);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'concrete-calculator',
        methodologyVersionLabel: next.version ?? CONCRETE_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/concrete-calculator',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore shared calculation');
      setResult(null);
    }
  }, []);

  useEffect(() => {
    if (shareApplied.current || !initialShareInputs) return;
    shareApplied.current = true;
    applyShareInputs(initialShareInputs);
  }, [initialShareInputs, applyShareInputs]);

  useRestoreSharedCalculation(
    'concrete-calculator',
    useCallback(
      (inputs) => {
        if (shareApplied.current) return;
        shareApplied.current = true;
        applyShareInputs(inputs);
      },
      [applyShareInputs],
    ),
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mixOptions = useMemo(() => listConcreteMixPresets(), []);

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = buildConcretePayload(form);
      const next = calculateConcreteQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'concrete-calculator',
        methodologyVersionLabel: next.version ?? CONCRETE_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/concrete-calculator',
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
    const text = `Varnarc concrete estimate (${result.shapeLabel}): wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³. Indicative only.`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'Concrete calculator', text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
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
      `Wet concrete volume,${result.wetVolumeM3},m3`,
      `Order volume (with wastage),${result.orderVolumeM3},m3`,
      result.estimatedCostInr != null
        ? `Estimated concrete cost,${result.estimatedCostInr},INR`
        : '',
      ...(result.materials
        ? [
            `Cement,${result.materials.cementKg},kg`,
            `Cement bags (50 kg),${result.materials.cementBags50kg},bags`,
            `Sand,${result.materials.sandVolumeM3},m3`,
            `Aggregate,${result.materials.aggregateVolumeM3},m3`,
            result.materials.waterLitres != null ? `Water,${result.materials.waterLitres},L` : '',
          ]
        : []),
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-concrete-boq-${result.shape}.csv`;
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
          name: projectName.trim() || 'Concrete estimate',
          areaSqft: Math.max(1, Math.round(result.orderVolumeM3 * 10)),
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

  const showLW = form.shape !== 'circular_column';
  const showThickness = form.shape === 'slab' || form.shape === 'wall';
  const showDepth = form.shape === 'rectangular_footing';
  const showHeight =
    form.shape === 'column' ||
    form.shape === 'wall' ||
    form.shape === 'circular_column' ||
    form.shape === 'custom_rectangular';
  const showWidth =
    form.shape === 'slab' ||
    form.shape === 'rectangular_footing' ||
    form.shape === 'column' ||
    form.shape === 'custom_rectangular';

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={runCalculate}
      onReset={() => {
        setForm(defaultForm('slab'));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate concrete"
    >
      <UnitSelector
        id="concrete-shape"
        label="Shape"
        value={form.shape}
        onChange={(v) => {
          setField('shape', v as ConcreteShape);
          setResult(null);
        }}
        options={[
          { value: 'slab', label: 'Slab' },
          { value: 'rectangular_footing', label: 'Footing' },
          { value: 'column', label: 'Column' },
          { value: 'wall', label: 'Wall' },
          { value: 'circular_column', label: 'Circular column' },
          { value: 'custom_rectangular', label: 'Custom box' },
        ]}
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <ConcreteShapeDiagram shape={form.shape} />
      </div>

      {showLW ? (
        <>
          <CalculatorInput
            id="con-length"
            label="Length"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.length}
            onChange={(e) => setField('length', e.target.value)}
          />
          <CalculatorSelect
            id="con-length-unit"
            label="Length unit"
            value={form.lengthUnit}
            onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      {showWidth ? (
        <>
          <CalculatorInput
            id="con-width"
            label="Width"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
          <CalculatorSelect
            id="con-width-unit"
            label="Width unit"
            value={form.widthUnit}
            onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      {showHeight ? (
        <>
          <CalculatorInput
            id="con-height"
            label="Height"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.height}
            onChange={(e) => setField('height', e.target.value)}
          />
          <CalculatorSelect
            id="con-height-unit"
            label="Height unit"
            value={form.heightUnit}
            onChange={(e) => setField('heightUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      {showThickness ? (
        <>
          <CalculatorInput
            id="con-thickness"
            label="Thickness"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.thickness}
            onChange={(e) => setField('thickness', e.target.value)}
          />
          <CalculatorSelect
            id="con-thickness-unit"
            label="Thickness unit"
            value={form.thicknessUnit}
            onChange={(e) => setField('thicknessUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      {showDepth ? (
        <>
          <CalculatorInput
            id="con-depth"
            label="Depth"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.depth}
            onChange={(e) => setField('depth', e.target.value)}
          />
          <CalculatorSelect
            id="con-depth-unit"
            label="Depth unit"
            value={form.depthUnit}
            onChange={(e) => setField('depthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      {form.shape === 'circular_column' ? (
        <>
          <UnitSelector
            id="con-rad-mode"
            label="Circular input"
            value={form.useRadius ? 'radius' : 'diameter'}
            onChange={(v) => setField('useRadius', v === 'radius')}
            options={[
              { value: 'diameter', label: 'Diameter' },
              { value: 'radius', label: 'Radius' },
            ]}
            className="sm:col-span-2"
          />
          {form.useRadius ? (
            <>
              <CalculatorInput
                id="con-radius"
                label="Radius"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.radius}
                onChange={(e) => setField('radius', e.target.value)}
              />
              <CalculatorSelect
                id="con-radius-unit"
                label="Radius unit"
                value={form.radiusUnit}
                onChange={(e) => setField('radiusUnit', e.target.value as LengthUnit)}
                options={LENGTH_UNITS}
              />
            </>
          ) : (
            <>
              <CalculatorInput
                id="con-diameter"
                label="Diameter"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.diameter}
                onChange={(e) => setField('diameter', e.target.value)}
              />
              <CalculatorSelect
                id="con-diameter-unit"
                label="Diameter unit"
                value={form.diameterUnit}
                onChange={(e) => setField('diameterUnit', e.target.value as LengthUnit)}
                options={LENGTH_UNITS}
              />
            </>
          )}
        </>
      ) : null}

      <CalculatorInput
        id="con-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="con-rate"
        label="Rate ₹ / m³ (optional)"
        type="number"
        min={1}
        value={form.ratePerM3Inr}
        onChange={(e) => setField('ratePerM3Inr', e.target.value)}
        hint="Custom ready-mix or site rate"
      />

      <div className="sm:col-span-2 flex items-center gap-2">
        <input
          id="con-materials"
          type="checkbox"
          checked={form.includeMaterialBreakdown}
          onChange={(e) => setField('includeMaterialBreakdown', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#0b1f3a] focus:ring-[#f97316]"
        />
        <label htmlFor="con-materials" className="text-sm font-medium text-[#0b1f3a]">
          Include cement / sand / aggregate / water breakdown
        </label>
      </div>

      {form.includeMaterialBreakdown ? (
        <>
          <CalculatorSelect
            id="con-mix"
            label="Concrete mix"
            value={form.mixPreset}
            onChange={(e) => setField('mixPreset', e.target.value as ConcreteMixPreset)}
            options={mixOptions}
            className="sm:col-span-2"
          />
          {form.mixPreset === 'custom' ? (
            <>
              <CalculatorInput
                id="con-c"
                label="Cement parts"
                type="number"
                min={0.1}
                value={form.cementParts}
                onChange={(e) => setField('cementParts', e.target.value)}
              />
              <CalculatorInput
                id="con-s"
                label="Sand parts"
                type="number"
                min={0.1}
                value={form.sandParts}
                onChange={(e) => setField('sandParts', e.target.value)}
              />
              <CalculatorInput
                id="con-a"
                label="Aggregate parts"
                type="number"
                min={0}
                value={form.aggregateParts}
                onChange={(e) => setField('aggregateParts', e.target.value)}
              />
              <CalculatorInput
                id="con-wc"
                label="Water–cement ratio"
                type="number"
                min={0.2}
                max={1}
                step="0.01"
                value={form.waterCementRatio}
                onChange={(e) => setField('waterCementRatio', e.target.value)}
              />
            </>
          ) : (
            <CalculatorInput
              id="con-wc"
              label="Water–cement ratio"
              type="number"
              min={0.2}
              max={1}
              step="0.01"
              value={form.waterCementRatio}
              onChange={(e) => setField('waterCementRatio', e.target.value)}
              hint="Indicative W/C by cement mass"
              className="sm:col-span-2"
            />
          )}
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
      <CalculationResult
        label="Order volume (with wastage)"
        value={`${result.orderVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`${result.shapeLabel} · wet ${result.wetVolumeM3} m³ · ${result.orderVolumeFt3} ft³ order. Indicative only.`}
        metrics={[
          { id: 'wet', label: 'Wet volume', value: `${result.wetVolumeM3} m³` },
          { id: 'wet-ft', label: 'Wet volume (ft³)', value: `${result.wetVolumeFt3} ft³` },
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
            <Link
              href={`/construction/cement-calculator?volume=${result.orderVolumeM3}&useCase=concrete`}
              className={cx.secondaryBtn}
            >
              Calculate cement
            </Link>
            <Link href="/construction/aggregate-calculator" className={cx.secondaryBtn}>
              Calculate aggregate
            </Link>
            <button type="button" className={cx.secondaryBtn} onClick={downloadBoq}>
              Add to BOQ
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => window.print()}>
              Print
            </button>
          </div>
        }
      />

      {result.materials ? (
        <CalculationBreakdown
          title={`Material breakdown (${result.materials.mixLabel})`}
          rows={[
            { id: 'cem', label: 'Cement', value: `${result.materials.cementKg} kg` },
            {
              id: 'bags',
              label: 'Cement bags (50 kg)',
              value: String(result.materials.cementBags50kg),
            },
            { id: 'sand', label: 'Sand (dry share)', value: `${result.materials.sandVolumeM3} m³` },
            {
              id: 'agg',
              label: 'Aggregate (dry share)',
              value: `${result.materials.aggregateVolumeM3} m³`,
            },
            ...(result.materials.waterLitres != null
              ? [
                  {
                    id: 'water',
                    label: 'Water (indicative)',
                    value: `${result.materials.waterLitres} L`,
                  },
                ]
              : []),
            {
              id: 'dry',
              label: 'Dry volume factor base',
              value: `${result.materials.dryVolumeM3} m³`,
            },
          ]}
        />
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
            {saveLoading ? 'Saving…' : 'Save to project'}
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
          { label: 'Concrete calculator' },
        ]}
        title="Concrete calculator"
        description="Estimate wet and wastage-adjusted concrete volume for slabs, footings, columns, walls and circular columns — with optional mix materials and custom ₹/m³ cost."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              V_wet = shape formula · V_order = V_wet × (1 + wastage%) · cost = V_order × ₹/m³
            </p>
            <p>
              Rectangular shapes use length × width × height (or thickness/depth). Circular columns
              use π × r² × H. Material breakdown uses dry factor 1.54 and cement density 1440 kg/m³.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{CONCRETE_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{CONCRETE_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={CONCRETE_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate concrete', onClick: () => runCalculate() },
          secondary: { label: 'Cement calculator', href: '/construction/cement-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="calc:concrete" surface="concrete-calculator" />
      </div>
    </>
  );
}
