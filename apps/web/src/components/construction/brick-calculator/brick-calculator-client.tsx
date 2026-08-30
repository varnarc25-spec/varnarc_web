'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateBrickQuantity,
  listBrickSizePresets,
  type BrickCalcMode,
  type BrickSizePreset,
  type BrickCalculatorResult,
  BRICK_CALC_VERSION,
} from '@varnarc/validation';
import {
  CalculationBreakdown,
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
  ReverseResultPanel,
  UnitSelector,
} from '@/components/construction/calculator';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { cn, cx } from '@/components/construction/styles';
import {
  trackCalculationAddedToProject,
  trackCalculationShared,
  trackCalculatorModeCompleted,
  trackCalculatorModeError,
  trackProjectCreated,
} from '@/lib/construction/analytics';
import {
  clearConstructionCalculationSave,
  publishConstructionCalculationSave,
} from '@/lib/construction/save-calculation/publish';
import { useRestoreSharedCalculation } from '@/lib/construction/share-calculation/use-restore-shared';
import {
  BRICK_CALC_FAQS,
  BRICK_CALC_SEO,
  BRICK_COMMON_SIZES,
  BRICK_WORKED_EXAMPLE,
} from './content';
import { BrickWallDiagram } from './wall-diagram';

const CALC_TYPE = 'brick_calculator';

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
  mode: BrickCalcMode;
  wallLength: string;
  wallHeight: string;
  wallThickness: string;
  wallLengthUnit: LengthUnit;
  wallHeightUnit: LengthUnit;
  wallThicknessUnit: LengthUnit;
  openingMode: 'area' | 'count';
  openingArea: string;
  openingAreaUnit: 'm2' | 'ft2';
  openingCount: string;
  openingWidth: string;
  openingHeight: string;
  openingWidthUnit: LengthUnit;
  openingHeightUnit: LengthUnit;
  brickPreset: BrickSizePreset;
  brickLength: string;
  brickWidth: string;
  brickHeight: string;
  brickSizeUnit: LengthUnit;
  mortarJoint: string;
  mortarJointUnit: LengthUnit;
  wastagePercent: string;
  pricePerBrickInr: string;
  availableBricks: string;
  includeMortarEstimate: boolean;
  mortarCementParts: string;
  mortarSandParts: string;
};

function defaultForm(mode: BrickCalcMode = 'forward'): FormState {
  return {
    mode,
    wallLength: '10',
    wallHeight: '3',
    wallThickness: '200',
    wallLengthUnit: 'm',
    wallHeightUnit: 'm',
    wallThicknessUnit: 'mm',
    openingMode: 'area',
    openingArea: '4',
    openingAreaUnit: 'm2',
    openingCount: '2',
    openingWidth: '1',
    openingHeight: '2.1',
    openingWidthUnit: 'm',
    openingHeightUnit: 'm',
    brickPreset: 'indian_modular',
    brickLength: '190',
    brickWidth: '90',
    brickHeight: '90',
    brickSizeUnit: 'mm',
    mortarJoint: '10',
    mortarJointUnit: 'mm',
    wastagePercent: '5',
    pricePerBrickInr: '',
    availableBricks: '1000',
    includeMortarEstimate: true,
    mortarCementParts: '1',
    mortarSandParts: '6',
  };
}

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const mode = inputs.mode === 'reverse' ? 'reverse' : 'forward';
  const next = defaultForm(mode);
  const str = (key: keyof FormState, value: unknown) => {
    if (typeof value === 'number' || typeof value === 'string') {
      (next[key] as string) = String(value);
    }
  };
  str('wallLength', inputs.wallLength);
  str('wallHeight', inputs.wallHeight);
  str('wallThickness', inputs.wallThickness);
  str('openingArea', inputs.openingArea);
  str('openingCount', inputs.openingCount);
  str('openingWidth', inputs.openingWidth);
  str('openingHeight', inputs.openingHeight);
  str('brickLength', inputs.brickLength);
  str('brickWidth', inputs.brickWidth);
  str('brickHeight', inputs.brickHeight);
  str('mortarJoint', inputs.mortarJoint);
  str('wastagePercent', inputs.wastagePercent);
  str('pricePerBrickInr', inputs.pricePerBrickInr);
  str('availableBricks', inputs.availableBricks);
  str('mortarCementParts', inputs.mortarCementParts);
  str('mortarSandParts', inputs.mortarSandParts);
  if (typeof inputs.wallLengthUnit === 'string') {
    next.wallLengthUnit = inputs.wallLengthUnit as LengthUnit;
  }
  if (typeof inputs.wallHeightUnit === 'string') {
    next.wallHeightUnit = inputs.wallHeightUnit as LengthUnit;
  }
  if (typeof inputs.wallThicknessUnit === 'string') {
    next.wallThicknessUnit = inputs.wallThicknessUnit as LengthUnit;
  }
  if (typeof inputs.openingAreaUnit === 'string') {
    next.openingAreaUnit = inputs.openingAreaUnit as FormState['openingAreaUnit'];
  }
  if (typeof inputs.openingWidthUnit === 'string') {
    next.openingWidthUnit = inputs.openingWidthUnit as LengthUnit;
  }
  if (typeof inputs.openingHeightUnit === 'string') {
    next.openingHeightUnit = inputs.openingHeightUnit as LengthUnit;
  }
  if (typeof inputs.brickPreset === 'string') {
    next.brickPreset = inputs.brickPreset as BrickSizePreset;
  }
  if (typeof inputs.brickSizeUnit === 'string') {
    next.brickSizeUnit = inputs.brickSizeUnit as LengthUnit;
  }
  if (typeof inputs.mortarJointUnit === 'string') {
    next.mortarJointUnit = inputs.mortarJointUnit as LengthUnit;
  }
  if (typeof inputs.includeMortarEstimate === 'boolean') {
    next.includeMortarEstimate = inputs.includeMortarEstimate;
  }
  if (
    inputs.openingCount != null ||
    (inputs.openingWidth != null && inputs.openingHeight != null)
  ) {
    next.openingMode = 'count';
  } else if (inputs.openingArea != null) {
    next.openingMode = 'area';
  }
  return next;
}

function buildBrickPayload(form: FormState) {
  return {
    mode: form.mode,
    wallLength: form.mode === 'forward' ? Number(form.wallLength) : undefined,
    wallHeight: form.mode === 'forward' ? Number(form.wallHeight) : undefined,
    wallThickness: Number(form.wallThickness),
    wallLengthUnit: form.wallLengthUnit,
    wallHeightUnit: form.wallHeightUnit,
    wallThicknessUnit: form.wallThicknessUnit,
    openingArea:
      form.mode === 'forward' && form.openingMode === 'area' ? Number(form.openingArea) || 0 : null,
    openingAreaUnit: form.openingAreaUnit,
    openingCount:
      form.mode === 'forward' && form.openingMode === 'count'
        ? Number(form.openingCount) || 0
        : null,
    openingWidth:
      form.mode === 'forward' && form.openingMode === 'count' ? Number(form.openingWidth) : null,
    openingHeight:
      form.mode === 'forward' && form.openingMode === 'count' ? Number(form.openingHeight) : null,
    openingWidthUnit: form.openingWidthUnit,
    openingHeightUnit: form.openingHeightUnit,
    brickPreset: form.brickPreset,
    brickLength: form.brickPreset === 'custom' ? Number(form.brickLength) : undefined,
    brickWidth: form.brickPreset === 'custom' ? Number(form.brickWidth) : undefined,
    brickHeight: form.brickPreset === 'custom' ? Number(form.brickHeight) : undefined,
    brickSizeUnit: form.brickSizeUnit,
    mortarJoint: Number(form.mortarJoint) || 0,
    mortarJointUnit: form.mortarJointUnit,
    wastagePercent: Number(form.wastagePercent) || 0,
    pricePerBrickInr: form.pricePerBrickInr.trim() ? Number(form.pricePerBrickInr) : null,
    availableBricks: form.mode === 'reverse' ? Number(form.availableBricks) : undefined,
    includeMortarEstimate: form.mode === 'forward' && form.includeMortarEstimate,
    mortarCementParts: Number(form.mortarCementParts) || 1,
    mortarSandParts: Number(form.mortarSandParts) || 6,
  };
}

export function BrickCalculatorClient({
  initialShareInputs = null,
}: {
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
} = {}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : defaultForm(),
  );
  const [result, setResult] = useState<BrickCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Brick estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const payload = buildBrickPayload(nextForm);
      const next = calculateBrickQuantity(payload);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'brick-calculator',
        methodologyVersionLabel: next.version ?? BRICK_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/brick-calculator',
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
    'brick-calculator',
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

  const brickOptions = useMemo(() => listBrickSizePresets(), []);

  const openingRatioPreview = useMemo(() => {
    const L = Number(form.wallLength) || 0;
    const H = Number(form.wallHeight) || 0;
    const gross = L * H;
    if (gross <= 0) return 0;
    if (form.openingMode === 'area') {
      return Math.min(0.7, (Number(form.openingArea) || 0) / gross);
    }
    const count = Number(form.openingCount) || 0;
    const ow = Number(form.openingWidth) || 0;
    const oh = Number(form.openingHeight) || 0;
    return Math.min(0.7, (count * ow * oh) / gross);
  }, [form]);

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = buildBrickPayload(form);
      const next = calculateBrickQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'brick-calculator',
        methodologyVersionLabel: next.version ?? BRICK_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/brick-calculator',
      });
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit: form.mode === 'reverse' ? 'm2' : 'bricks',
        result_range_category:
          form.mode === 'reverse'
            ? (next.buildableAreaM2 ?? 0) <= 20
              ? 'low'
              : (next.buildableAreaM2 ?? 0) <= 100
                ? 'mid'
                : 'high'
            : next.bricksRequired <= 2000
              ? 'low'
              : next.bricksRequired <= 20000
                ? 'mid'
                : 'high',
        logged_in: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setResult(null);
      clearConstructionCalculationSave();
      trackCalculatorModeError({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        error_code: 'calc_failed',
        logged_in: false,
      });
    }
  }

  async function shareResult() {
    if (!result) return;
    const text =
      result.mode === 'reverse'
        ? `Varnarc brick reverse: ${result.bricksRequired} bricks → ≈ ${result.buildableAreaM2} m² wall. Indicative only.`
        : `Varnarc brick estimate: ${result.bricksRequired} bricks for ${result.netWallAreaM2} m² net wall. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Brick calculator', text, url: window.location.href });
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
      result.mode === 'forward'
        ? `Bricks required,${result.bricksRequired},nos`
        : `Available bricks,${result.bricksRequired},nos`,
      result.mode === 'forward' && result.netWallAreaM2 != null
        ? `Net wall area,${result.netWallAreaM2},m2`
        : '',
      result.buildableAreaM2 != null ? `Buildable wall area,${result.buildableAreaM2},m2` : '',
      result.mortar ? `Mortar volume,${result.mortar.mortarVolumeM3},m3` : '',
      result.mortar ? `Mortar cement,${result.mortar.cementKg},kg` : '',
      result.mortar ? `Mortar sand,${result.mortar.sandVolumeM3},m3` : '',
      result.estimatedCostInr != null ? `Estimated brick cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-brick-boq-${result.mode}.csv`;
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
          name: projectName.trim() || 'Brick estimate',
          areaSqft: Math.max(
            1,
            Math.round((result.netWallAreaM2 ?? result.buildableAreaM2 ?? 1) * 10.764),
          ),
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
        setForm(defaultForm('forward'));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel={form.mode === 'reverse' ? 'Calculate wall area' : 'Calculate bricks'}
    >
      <UnitSelector
        id="brick-mode"
        label="Mode"
        value={form.mode}
        onChange={(v) => {
          setField('mode', v as BrickCalcMode);
          setResult(null);
        }}
        options={[
          { value: 'forward', label: 'Wall → bricks' },
          { value: 'reverse', label: 'Bricks → wall area' },
        ]}
        className="sm:col-span-2"
      />

      {form.mode === 'forward' ? (
        <div className="sm:col-span-2">
          <BrickWallDiagram openingRatio={openingRatioPreview} />
        </div>
      ) : null}

      {form.mode === 'forward' ? (
        <>
          <CalculatorInput
            id="brk-length"
            label="Wall length"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.wallLength}
            onChange={(e) => setField('wallLength', e.target.value)}
          />
          <CalculatorSelect
            id="brk-length-unit"
            label="Length unit"
            value={form.wallLengthUnit}
            onChange={(e) => setField('wallLengthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
          <CalculatorInput
            id="brk-height"
            label="Wall height"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.wallHeight}
            onChange={(e) => setField('wallHeight', e.target.value)}
          />
          <CalculatorSelect
            id="brk-height-unit"
            label="Height unit"
            value={form.wallHeightUnit}
            onChange={(e) => setField('wallHeightUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : (
        <CalculatorInput
          id="brk-available"
          label="I have this many bricks"
          type="number"
          min={1}
          required
          value={form.availableBricks}
          onChange={(e) => setField('availableBricks', e.target.value)}
          className="sm:col-span-2"
        />
      )}

      <CalculatorInput
        id="brk-thickness"
        label="Wall thickness"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.wallThickness}
        onChange={(e) => setField('wallThickness', e.target.value)}
      />
      <CalculatorSelect
        id="brk-thickness-unit"
        label="Thickness unit"
        value={form.wallThicknessUnit}
        onChange={(e) => setField('wallThicknessUnit', e.target.value as LengthUnit)}
        options={LENGTH_UNITS}
      />

      {form.mode === 'forward' ? (
        <>
          <UnitSelector
            id="brk-opening-mode"
            label="Openings"
            value={form.openingMode}
            onChange={(v) => setField('openingMode', v as 'area' | 'count')}
            options={[
              { value: 'area', label: 'Total area' },
              { value: 'count', label: 'Count × size' },
            ]}
            className="sm:col-span-2"
          />
          {form.openingMode === 'area' ? (
            <>
              <CalculatorInput
                id="brk-open-area"
                label="Opening area"
                type="number"
                min={0}
                step="any"
                value={form.openingArea}
                onChange={(e) => setField('openingArea', e.target.value)}
              />
              <CalculatorSelect
                id="brk-open-area-unit"
                label="Area unit"
                value={form.openingAreaUnit}
                onChange={(e) => setField('openingAreaUnit', e.target.value as 'm2' | 'ft2')}
                options={[
                  { value: 'm2', label: 'm²' },
                  { value: 'ft2', label: 'ft²' },
                ]}
              />
            </>
          ) : (
            <>
              <CalculatorInput
                id="brk-open-count"
                label="Number of openings"
                type="number"
                min={0}
                value={form.openingCount}
                onChange={(e) => setField('openingCount', e.target.value)}
              />
              <CalculatorInput
                id="brk-open-w"
                label="Opening width"
                type="number"
                min={0.001}
                step="any"
                value={form.openingWidth}
                onChange={(e) => setField('openingWidth', e.target.value)}
              />
              <CalculatorInput
                id="brk-open-h"
                label="Opening height"
                type="number"
                min={0.001}
                step="any"
                value={form.openingHeight}
                onChange={(e) => setField('openingHeight', e.target.value)}
              />
              <CalculatorSelect
                id="brk-open-unit"
                label="Opening size unit"
                value={form.openingWidthUnit}
                onChange={(e) => {
                  const u = e.target.value as LengthUnit;
                  setField('openingWidthUnit', u);
                  setField('openingHeightUnit', u);
                }}
                options={LENGTH_UNITS}
              />
            </>
          )}
        </>
      ) : null}

      <CalculatorSelect
        id="brk-size"
        label="Brick / block size"
        value={form.brickPreset}
        onChange={(e) => setField('brickPreset', e.target.value as BrickSizePreset)}
        options={brickOptions}
        className="sm:col-span-2"
      />

      {form.brickPreset === 'custom' ? (
        <>
          <CalculatorInput
            id="brk-bl"
            label="Brick length"
            type="number"
            min={0.001}
            value={form.brickLength}
            onChange={(e) => setField('brickLength', e.target.value)}
          />
          <CalculatorInput
            id="brk-bw"
            label="Brick width"
            type="number"
            min={0.001}
            value={form.brickWidth}
            onChange={(e) => setField('brickWidth', e.target.value)}
          />
          <CalculatorInput
            id="brk-bh"
            label="Brick height"
            type="number"
            min={0.001}
            value={form.brickHeight}
            onChange={(e) => setField('brickHeight', e.target.value)}
          />
          <CalculatorSelect
            id="brk-bunit"
            label="Brick size unit"
            value={form.brickSizeUnit}
            onChange={(e) => setField('brickSizeUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      <CalculatorInput
        id="brk-joint"
        label="Mortar joint"
        type="number"
        min={0}
        value={form.mortarJoint}
        onChange={(e) => setField('mortarJoint', e.target.value)}
      />
      <CalculatorSelect
        id="brk-joint-unit"
        label="Joint unit"
        value={form.mortarJointUnit}
        onChange={(e) => setField('mortarJointUnit', e.target.value as LengthUnit)}
        options={LENGTH_UNITS}
      />

      <CalculatorInput
        id="brk-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="brk-price"
        label="Price per brick (₹, optional)"
        type="number"
        min={0.01}
        value={form.pricePerBrickInr}
        onChange={(e) => setField('pricePerBrickInr', e.target.value)}
      />

      {form.mode === 'forward' ? (
        <>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="brk-mortar"
              type="checkbox"
              checked={form.includeMortarEstimate}
              onChange={(e) => setField('includeMortarEstimate', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0b1f3a] focus:ring-[#f97316]"
            />
            <label htmlFor="brk-mortar" className="text-sm font-medium text-[#0b1f3a]">
              Include mortar estimate (cement + sand)
            </label>
          </div>
          {form.includeMortarEstimate ? (
            <>
              <CalculatorInput
                id="brk-mc"
                label="Mortar cement parts"
                type="number"
                min={0.1}
                value={form.mortarCementParts}
                onChange={(e) => setField('mortarCementParts', e.target.value)}
              />
              <CalculatorInput
                id="brk-ms"
                label="Mortar sand parts"
                type="number"
                min={0.1}
                value={form.mortarSandParts}
                onChange={(e) => setField('mortarSandParts', e.target.value)}
              />
            </>
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
      <CalculationResult
        label={result.mode === 'reverse' ? 'Buildable net wall area' : 'Bricks required'}
        value={
          result.mode === 'reverse'
            ? `${result.buildableAreaM2?.toLocaleString('en-IN')} m²`
            : result.bricksRequired.toLocaleString('en-IN')
        }
        hint={
          result.mode === 'reverse'
            ? `${result.bricksRequired.toLocaleString('en-IN')} bricks · ≈ ${result.buildableVolumeM3} m³ · ${result.brickLabel}. Indicative only.`
            : `${result.brickLabel} · net ${result.netWallAreaM2} m² · +${result.wastageBricks} wastage bricks. Indicative only.`
        }
        metrics={
          result.mode === 'forward'
            ? [
                {
                  id: 'gross',
                  label: 'Gross wall area',
                  value: `${result.grossWallAreaM2} m²`,
                },
                {
                  id: 'open',
                  label: 'Opening deductions',
                  value: `${result.openingAreaM2} m²`,
                },
                {
                  id: 'net',
                  label: 'Net wall volume',
                  value: `${result.netWallVolumeM3} m³`,
                },
                {
                  id: 'before',
                  label: 'Bricks before wastage',
                  value: String(result.bricksBeforeWastage),
                },
                {
                  id: 'waste',
                  label: 'Wastage bricks',
                  value: String(result.wastageBricks),
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
              ]
            : [
                {
                  id: 'vol',
                  label: 'Buildable volume',
                  value: `${result.buildableVolumeM3} m³`,
                },
                {
                  id: 'usable',
                  label: 'Usable bricks (after wastage reserve)',
                  value: String(result.bricksBeforeWastage),
                },
                {
                  id: 'thick',
                  label: 'Wall thickness',
                  value: `${result.wallThicknessM} m`,
                },
                ...(result.estimatedCostInr != null
                  ? [
                      {
                        id: 'cost',
                        label: 'Stack cost',
                        value: formatInr(result.estimatedCostInr),
                      },
                    ]
                  : []),
              ]
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/construction/cement-calculator?useCase=masonry"
              className={cx.secondaryBtn}
            >
              Mortar / cement
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

      {result.mortar ? (
        <CalculationBreakdown
          title={`Mortar estimate (${result.mortar.mixLabel})`}
          rows={[
            { id: 'mv', label: 'Mortar volume', value: `${result.mortar.mortarVolumeM3} m³` },
            {
              id: 'md',
              label: 'Dry mortar volume',
              value: `${result.mortar.dryMortarVolumeM3} m³`,
            },
            { id: 'mc', label: 'Cement', value: `${result.mortar.cementKg} kg` },
            { id: 'ms', label: 'Sand', value: `${result.mortar.sandVolumeM3} m³` },
          ]}
        />
      ) : null}

      {result.reverseDisplay ? <ReverseResultPanel display={result.reverseDisplay} /> : null}

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
          { label: 'Brick calculator' },
        ]}
        title="Brick calculator"
        description="Estimate bricks or blocks for masonry walls — openings, mortar joints, wastage, optional mortar mix and cost. Reverse mode: how much wall can X bricks build?"
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              N = ceil((A_gross − A_open) × T / V_modular × (1 + wastage%))
            </p>
            <p>
              Modular brick volume includes the mortar joint on each face. Reverse mode solves for
              net wall area from available bricks and thickness.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{BRICK_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{BRICK_WORKED_EXAMPLE}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Common brick dimensions</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {BRICK_COMMON_SIZES.map((s) => (
                <li key={s.label} className="text-sm text-slate-600">
                  <span className="font-medium text-[#0b1f3a]">{s.label}:</span> {s.size}
                </li>
              ))}
            </ul>
          </div>
        }
        faqs={BRICK_CALC_FAQS}
        stickyCta={{
          primary: {
            label: form.mode === 'reverse' ? 'Calculate wall area' : 'Calculate bricks',
            onClick: () => runCalculate(),
          },
          secondary: {
            label: 'Cement calculator',
            href: '/construction/cement-calculator?useCase=masonry',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="calc:brick" surface="brick-calculator" />
      </div>
    </>
  );
}
