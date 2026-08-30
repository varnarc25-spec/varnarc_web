'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateCementQuantity,
  defaultMixForUseCase,
  CEMENT_CALC_VERSION,
  type CementMixPreset,
  type CementUseCase,
  type CementCalculatorResult,
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
import {
  ConstructionReportActions,
  reportFromCementCalculation,
} from '@/components/construction/report';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { cn, cx } from '@/components/construction/styles';
import {
  trackCalculationAddedToProject,
  trackCalculationShared,
  trackCalculatorModeCompleted,
  trackCalculatorModeError,
  trackProjectCreated,
} from '@/lib/construction/analytics';
import { CEMENT_CALC_FAQS, CEMENT_CALC_SEO, CEMENT_WORKED_EXAMPLE } from './content';
import {
  clearConstructionCalculationSave,
  publishConstructionCalculationSave,
} from '@/lib/construction/save-calculation/publish';
import { useRestorePendingConstructionSave } from '@/lib/construction/save-calculation/use-restore-pending';
import { useRestoreSharedCalculation } from '@/lib/construction/share-calculation/use-restore-shared';
import type { ConstructionSavePayload } from '@/lib/construction/save-calculation/store';

const CALC_TYPE = 'cement_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  mode: 'forward' | 'reverse';
  useCase: CementUseCase;
  volume: string;
  volumeUnit: 'm3' | 'ft3' | 'liter';
  area: string;
  areaUnit: 'm2' | 'ft2' | 'yard2';
  thickness: string;
  thicknessUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  mixPreset: CementMixPreset;
  cementParts: string;
  sandParts: string;
  aggregateParts: string;
  wastagePercent: string;
  bagSizeKg: string;
  bagPriceInr: string;
  availableBags: string;
};

function defaultForm(useCase: CementUseCase = 'concrete'): FormState {
  return {
    mode: 'forward',
    useCase,
    volume: '1',
    volumeUnit: 'm3',
    area: '100',
    areaUnit: 'm2',
    thickness: useCase === 'floor_screed' ? '40' : '12',
    thicknessUnit: 'mm',
    mixPreset: defaultMixForUseCase(useCase),
    cementParts: '1',
    sandParts: '1.5',
    aggregateParts: '3',
    wastagePercent: '5',
    bagSizeKg: '50',
    bagPriceInr: '',
    availableBags: '100',
  };
}

function parseUseCase(raw?: string): CementUseCase | null {
  if (!raw) return null;
  if (raw === 'concrete' || raw === 'masonry' || raw === 'plastering' || raw === 'floor_screed') {
    return raw;
  }
  if (raw === 'plaster') return 'plastering';
  if (raw === 'screed') return 'floor_screed';
  return null;
}

function formFromParams(params?: {
  area?: string;
  volume?: string;
  useCase?: string;
  wastage?: string;
  areaUnit?: string;
}): FormState {
  const useCase =
    parseUseCase(params?.useCase) ?? (params?.area && !params?.volume ? 'plastering' : 'concrete');
  const next = defaultForm(useCase);
  if (params?.volume) next.volume = params.volume.replace(/[^\d.]/g, '') || next.volume;
  if (params?.area) next.area = params.area.replace(/[^\d.]/g, '') || next.area;
  if (params?.wastage) {
    next.wastagePercent = params.wastage.replace(/[^\d.]/g, '') || next.wastagePercent;
  }
  const unit = params?.areaUnit?.toLowerCase();
  if (unit === 'ft2' || unit === 'sqft' || unit === 'sq ft' || unit === 'ft') {
    next.areaUnit = 'ft2';
  } else if (unit === 'yard2' || unit === 'sqyd' || unit === 'sq yard') {
    next.areaUnit = 'yard2';
  } else if (unit === 'm2' || unit === 'sqm') {
    next.areaUnit = 'm2';
  }
  return next;
}

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const useCase = parseUseCase(String(inputs.useCase ?? '')) ?? 'concrete';
  const next = defaultForm(useCase);
  if (inputs.mode === 'forward' || inputs.mode === 'reverse') next.mode = inputs.mode;
  if (typeof inputs.volume === 'number') next.volume = String(inputs.volume);
  if (typeof inputs.area === 'number') next.area = String(inputs.area);
  if (typeof inputs.thickness === 'number') next.thickness = String(inputs.thickness);
  if (typeof inputs.wastagePercent === 'number') {
    next.wastagePercent = String(inputs.wastagePercent);
  }
  if (typeof inputs.bagSizeKg === 'number') next.bagSizeKg = String(inputs.bagSizeKg);
  if (typeof inputs.availableBags === 'number') {
    next.availableBags = String(inputs.availableBags);
  }
  if (typeof inputs.bagPriceInr === 'number') next.bagPriceInr = String(inputs.bagPriceInr);
  if (typeof inputs.volumeUnit === 'string') {
    next.volumeUnit = inputs.volumeUnit as FormState['volumeUnit'];
  }
  if (typeof inputs.areaUnit === 'string') {
    next.areaUnit = inputs.areaUnit as FormState['areaUnit'];
  }
  if (typeof inputs.thicknessUnit === 'string') {
    next.thicknessUnit = inputs.thicknessUnit as FormState['thicknessUnit'];
  }
  if (typeof inputs.mixPreset === 'string') {
    next.mixPreset = inputs.mixPreset as CementMixPreset;
  }
  if (typeof inputs.cementParts === 'number') next.cementParts = String(inputs.cementParts);
  if (typeof inputs.sandParts === 'number') next.sandParts = String(inputs.sandParts);
  if (typeof inputs.aggregateParts === 'number') {
    next.aggregateParts = String(inputs.aggregateParts);
  }
  return next;
}

export function CementCalculatorClient({
  initialParams,
  initialShareInputs = null,
}: {
  initialParams?: {
    area?: string;
    volume?: string;
    useCase?: string;
    wastage?: string;
    areaUnit?: string;
  };
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : formFromParams(initialParams),
  );
  const [result, setResult] = useState<CementCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Cement estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const payload = {
        mode: (inputs.mode as 'forward' | 'reverse') ?? nextForm.mode,
        useCase: (inputs.useCase as CementUseCase) ?? nextForm.useCase,
        volume: typeof inputs.volume === 'number' ? inputs.volume : undefined,
        volumeUnit: nextForm.volumeUnit,
        area: typeof inputs.area === 'number' ? inputs.area : undefined,
        areaUnit: nextForm.areaUnit,
        thickness: typeof inputs.thickness === 'number' ? inputs.thickness : undefined,
        thicknessUnit: nextForm.thicknessUnit,
        mixPreset: (inputs.mixPreset as CementMixPreset) ?? nextForm.mixPreset,
        cementParts: typeof inputs.cementParts === 'number' ? inputs.cementParts : undefined,
        sandParts: typeof inputs.sandParts === 'number' ? inputs.sandParts : undefined,
        aggregateParts:
          typeof inputs.aggregateParts === 'number' ? inputs.aggregateParts : undefined,
        wastagePercent:
          typeof inputs.wastagePercent === 'number'
            ? inputs.wastagePercent
            : Number(nextForm.wastagePercent) || 0,
        bagSizeKg:
          typeof inputs.bagSizeKg === 'number'
            ? inputs.bagSizeKg
            : Number(nextForm.bagSizeKg) || 50,
        bagPriceInr: typeof inputs.bagPriceInr === 'number' ? inputs.bagPriceInr : null,
        availableBags: typeof inputs.availableBags === 'number' ? inputs.availableBags : undefined,
      };
      const next = calculateCementQuantity(payload);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'cement-calculator',
        methodologyVersionLabel: next.version ?? CEMENT_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions,
        unitSummary: {
          bags: next.bags,
          cementKg: next.cementKg,
          bagSizeKg: next.bagSizeKg,
        },
        sourcePath: '/construction/cement-calculator',
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
    'cement-calculator',
    useCallback(
      (inputs) => {
        if (shareApplied.current) return;
        shareApplied.current = true;
        applyShareInputs(inputs);
      },
      [applyShareInputs],
    ),
  );

  const restorePending = useCallback((pending: ConstructionSavePayload) => {
    const raw = pending.inputs as Partial<FormState>;
    if (raw && typeof raw === 'object') {
      setForm((prev) => ({ ...prev, ...raw }));
    }
    if (pending.outputs) {
      setResult(pending.outputs as CementCalculatorResult);
    }
    publishConstructionCalculationSave({
      calculatorSlug: pending.calculatorSlug,
      methodologyKey: pending.methodologyKey,
      methodologyVersionLabel: pending.methodologyVersionLabel,
      inputs: pending.inputs,
      normalizedInputs: pending.normalizedInputs ?? pending.inputs,
      outputs: pending.outputs,
      assumptions: pending.assumptions,
      unitSummary: pending.unitSummary,
      name: pending.name,
      currency: pending.currency,
      sourcePath: pending.sourcePath ?? '/construction/cement-calculator',
    });
  }, []);

  useRestorePendingConstructionSave('cement-calculator', restorePending);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function changeUseCase(useCase: CementUseCase) {
    setForm((prev) => ({
      ...prev,
      useCase,
      mixPreset: defaultMixForUseCase(useCase),
      thickness: useCase === 'floor_screed' ? '40' : useCase === 'concrete' ? prev.thickness : '12',
    }));
    setResult(null);
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        mode: form.mode,
        useCase: form.useCase,
        volume:
          form.mode === 'forward' && form.useCase === 'concrete' ? Number(form.volume) : undefined,
        volumeUnit: form.volumeUnit,
        area:
          form.mode === 'forward' && form.useCase !== 'concrete' ? Number(form.area) : undefined,
        areaUnit: form.areaUnit,
        thickness: form.useCase !== 'concrete' ? Number(form.thickness) : undefined,
        thicknessUnit: form.thicknessUnit,
        mixPreset: form.mixPreset,
        cementParts: form.mixPreset === 'custom' ? Number(form.cementParts) : undefined,
        sandParts: form.mixPreset === 'custom' ? Number(form.sandParts) : undefined,
        aggregateParts:
          form.mixPreset === 'custom'
            ? form.useCase === 'concrete'
              ? Number(form.aggregateParts)
              : 0
            : undefined,
        wastagePercent: Number(form.wastagePercent) || 0,
        bagSizeKg: Number(form.bagSizeKg) || 50,
        bagPriceInr: form.bagPriceInr.trim() ? Number(form.bagPriceInr) : null,
        availableBags: form.mode === 'reverse' ? Number(form.availableBags) : undefined,
      };
      const next = calculateCementQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'cement-calculator',
        methodologyVersionLabel: next.version ?? CEMENT_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions,
        unitSummary: {
          bags: next.bags,
          cementKg: next.cementKg,
          bagSizeKg: next.bagSizeKg,
        },
        sourcePath: '/construction/cement-calculator',
      });
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit:
          form.mode === 'reverse'
            ? next.selectedUnit
            : form.useCase === 'concrete'
              ? form.volumeUnit
              : form.areaUnit,
        result_range_category:
          form.mode === 'reverse'
            ? (next.coverableWetVolumeM3 ?? 0) <= 5
              ? 'low'
              : (next.coverableWetVolumeM3 ?? 0) <= 25
                ? 'mid'
                : 'high'
            : next.bags <= 20
              ? 'low'
              : next.bags <= 100
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
    const text = `Varnarc cement estimate: ${result.cementKg} kg ≈ ${result.bags} × ${result.bagSizeKg} kg bags (${result.mixLabel}). Indicative only.`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'Cement calculator', text, url });
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
      `Cement,${result.cementKg},kg`,
      `Cement bags (${result.bagSizeKg} kg),${result.bags},bags`,
      result.sandVolumeM3 != null ? `Sand (related),${result.sandVolumeM3},m3` : '',
      result.aggregateVolumeM3 != null ? `Aggregate (related),${result.aggregateVolumeM3},m3` : '',
      result.estimatedCostInr != null ? `Estimated cement cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-cement-boq-${result.useCase}.csv`;
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
          name: projectName.trim() || 'Cement estimate',
          areaSqft: form.useCase === 'concrete' ? 0 : Number(form.area) || 1,
          region: 'India',
          quality: 'standard',
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to add this calculation to a project.');
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

  const mixOptions = useMemo(() => {
    if (form.useCase === 'concrete') {
      return [
        { value: 'M5', label: 'M5 (1:5:10)' },
        { value: 'M7.5', label: 'M7.5 (1:4:8)' },
        { value: 'M10', label: 'M10 (1:3:6)' },
        { value: 'M15', label: 'M15 (1:2:4)' },
        { value: 'M20', label: 'M20 (1:1.5:3)' },
        { value: 'M25', label: 'M25 (1:1:2)' },
        { value: 'custom', label: 'Custom mix ratio' },
      ];
    }
    return [
      { value: 'mortar_1_3', label: '1:3 mortar' },
      { value: 'mortar_1_4', label: '1:4 mortar' },
      { value: 'mortar_1_5', label: '1:5 mortar' },
      { value: 'mortar_1_6', label: '1:6 mortar' },
      { value: 'custom', label: 'Custom mix ratio' },
    ];
  }, [form.useCase]);

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
      submitLabel={form.mode === 'reverse' ? 'Calculate coverage' : 'Calculate cement'}
    >
      <UnitSelector
        id="cement-mode"
        label="Calculation mode"
        value={form.mode}
        onChange={(v) => {
          setField('mode', v as 'forward' | 'reverse');
          setResult(null);
        }}
        options={[
          { value: 'forward', label: 'Work → bags' },
          { value: 'reverse', label: 'Bags → coverage' },
        ]}
        className="sm:col-span-2"
      />

      <UnitSelector
        id="cement-use-case"
        label="Use case"
        value={form.useCase}
        onChange={(v) => changeUseCase(v as CementUseCase)}
        options={[
          { value: 'concrete', label: 'Concrete' },
          { value: 'masonry', label: 'Masonry' },
          { value: 'plastering', label: 'Plastering' },
          { value: 'floor_screed', label: 'Floor screed' },
        ]}
        className="sm:col-span-2"
      />

      {form.mode === 'reverse' ? (
        <CalculatorInput
          id="cem-bags"
          label="Cement bags on hand"
          type="number"
          min={1}
          step="1"
          required
          value={form.availableBags}
          onChange={(e) => setField('availableBags', e.target.value)}
          hint="Example: 100 bags — how much work can they cover?"
          className="sm:col-span-2"
        />
      ) : null}

      {form.mode === 'forward' && form.useCase === 'concrete' ? (
        <>
          <CalculatorInput
            id="cem-volume"
            label="Volume"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.volume}
            onChange={(e) => setField('volume', e.target.value)}
          />
          <CalculatorSelect
            id="cem-volume-unit"
            label="Volume unit"
            value={form.volumeUnit}
            onChange={(e) => setField('volumeUnit', e.target.value as FormState['volumeUnit'])}
            options={[
              { value: 'm3', label: 'm³ (metric)' },
              { value: 'ft3', label: 'ft³ (imperial)' },
              { value: 'liter', label: 'litre' },
            ]}
          />
        </>
      ) : null}

      {(form.mode === 'forward' && form.useCase !== 'concrete') ||
      (form.mode === 'reverse' && form.useCase !== 'concrete') ? (
        <>
          {form.mode === 'forward' ? (
            <>
              <CalculatorInput
                id="cem-area"
                label="Area"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.area}
                onChange={(e) => setField('area', e.target.value)}
              />
              <CalculatorSelect
                id="cem-area-unit"
                label="Area unit"
                value={form.areaUnit}
                onChange={(e) => setField('areaUnit', e.target.value as FormState['areaUnit'])}
                options={[
                  { value: 'm2', label: 'm²' },
                  { value: 'ft2', label: 'ft²' },
                  { value: 'yard2', label: 'sq yard' },
                ]}
              />
            </>
          ) : null}
          <CalculatorInput
            id="cem-thickness"
            label="Thickness"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.thickness}
            onChange={(e) => setField('thickness', e.target.value)}
            hint={
              form.mode === 'reverse'
                ? 'Needed to convert coverable wet volume into area'
                : undefined
            }
          />
          <CalculatorSelect
            id="cem-thickness-unit"
            label="Thickness unit"
            value={form.thicknessUnit}
            onChange={(e) =>
              setField('thicknessUnit', e.target.value as FormState['thicknessUnit'])
            }
            options={[
              { value: 'mm', label: 'mm' },
              { value: 'cm', label: 'cm' },
              { value: 'm', label: 'm' },
              { value: 'inch', label: 'inch' },
              { value: 'ft', label: 'ft' },
            ]}
          />
        </>
      ) : null}

      <CalculatorSelect
        id="cem-mix"
        label={form.useCase === 'concrete' ? 'Concrete mix' : 'Mix ratio'}
        value={form.mixPreset}
        onChange={(e) => setField('mixPreset', e.target.value as CementMixPreset)}
        options={mixOptions}
        className="sm:col-span-2"
      />

      {form.mixPreset === 'custom' ? (
        <>
          <CalculatorInput
            id="cem-c"
            label="Cement parts"
            type="number"
            min={0.1}
            value={form.cementParts}
            onChange={(e) => setField('cementParts', e.target.value)}
          />
          <CalculatorInput
            id="cem-s"
            label="Sand parts"
            type="number"
            min={0.1}
            value={form.sandParts}
            onChange={(e) => setField('sandParts', e.target.value)}
          />
          {form.useCase === 'concrete' ? (
            <CalculatorInput
              id="cem-a"
              label="Aggregate parts"
              type="number"
              min={0}
              value={form.aggregateParts}
              onChange={(e) => setField('aggregateParts', e.target.value)}
              className="sm:col-span-2"
            />
          ) : null}
        </>
      ) : null}

      <CalculatorInput
        id="cem-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorSelect
        id="cem-bag"
        label="Bag size"
        value={form.bagSizeKg}
        onChange={(e) => setField('bagSizeKg', e.target.value)}
        options={[
          { value: '25', label: '25 kg' },
          { value: '40', label: '40 kg' },
          { value: '50', label: '50 kg' },
        ]}
      />
      <CalculatorInput
        id="cem-price"
        label="Bag price (₹, optional)"
        type="number"
        min={1}
        value={form.bagPriceInr}
        onChange={(e) => setField('bagPriceInr', e.target.value)}
        hint="For indicative cement cost"
        className="sm:col-span-2"
      />

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
        label={result.mode === 'reverse' ? 'Coverable work' : 'Cement required'}
        value={
          result.mode === 'reverse'
            ? result.coverableAreaM2 != null
              ? `${result.coverableAreaM2.toLocaleString('en-IN')} m²`
              : `${result.coverableWetVolumeM3?.toLocaleString('en-IN')} m³`
            : `${result.cementKg.toLocaleString('en-IN')} kg`
        }
        unit={
          result.mode === 'reverse'
            ? result.coverableAreaM2 != null
              ? undefined
              : undefined
            : undefined
        }
        hint={
          result.mode === 'reverse'
            ? result.coverableAreaFt2 != null
              ? `${result.coverableAreaFt2.toLocaleString('en-IN')} ft² · ${result.bags} bags × ${result.bagSizeKg} kg · ${result.mixLabel}. Indicative only.`
              : `${result.bags} bags × ${result.bagSizeKg} kg → wet work volume · ${result.mixLabel}. Indicative only.`
            : `${result.bags} bags × ${result.bagSizeKg} kg · ${result.mixLabel}. Indicative only.`
        }
        metrics={[
          {
            id: 'bags',
            label: result.mode === 'reverse' ? 'Bags on hand' : 'Bags',
            value: String(result.bags),
            hint: `${result.bagSizeKg} kg bags`,
          },
          {
            id: 'wet',
            label: 'Wet volume',
            value: `${result.wetVolumeM3} m³`,
          },
          {
            id: 'dry',
            label: 'Dry volume',
            value: `${result.dryVolumeM3} m³`,
          },
          {
            id: 'wastage',
            label: 'Wastage',
            value: `${result.wastagePercent}%`,
            hint:
              result.mode === 'reverse'
                ? `${result.wastageExtraKg} kg reserved`
                : `${result.wastageExtraKg} kg extra`,
          },
          {
            id: 'unit',
            label: 'Selected unit',
            value: result.selectedUnit,
          },
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'cost',
                  label: 'Estimated cement cost',
                  value: formatInr(result.estimatedCostInr),
                },
              ]
            : []),
          ...(result.sandVolumeM3 != null
            ? [
                {
                  id: 'sand',
                  label: 'Related sand (dry)',
                  value: `${result.sandVolumeM3} m³`,
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
            <ConstructionReportActions
              data={reportFromCementCalculation({
                result,
                form: form as unknown as Record<string, unknown>,
              })}
              label="Print report"
            />
            <button type="button" className={cx.secondaryBtn} onClick={downloadBoq}>
              Add to BOQ
            </button>
            <Link href="/construction/materials?search=cement" className={cx.secondaryBtn}>
              Check cement price
            </Link>
          </div>
        }
      />

      {result.reverseDisplay ? <ReverseResultPanel display={result.reverseDisplay} /> : null}

      <CalculationBreakdown
        title="Bag size conversion"
        rows={result.bagSizes.map((b) => ({
          id: `bag-${b.sizeKg}`,
          label: `${b.sizeKg} kg bags`,
          value: String(b.bags),
        }))}
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
        <h3 className="text-sm font-bold text-[#0b1f3a]">Add to project</h3>
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
            {saveLoading ? 'Saving…' : 'Add to project'}
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
          { label: 'Cement calculator' },
        ]}
        title="Cement calculator"
        description="Estimate cement for concrete, masonry, plastering and floor screed — metric or imperial units, mix presets, wastage, bags and optional bag price."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              cement_kg = wet_m³ × dry_factor × (c / Σparts) × 1440 × (1 + wastage%)
            </p>
            <p>
              Concrete uses dry factor 1.54; plaster, masonry mortar and screed use 1.33. Unit
              conversion uses the shared construction calculation engine helpers.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{CEMENT_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{CEMENT_WORKED_EXAMPLE}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Bag conversion</h3>
            <p>
              After computing kilograms, divide by your bag size (commonly 25, 40 or 50 kg) and
              round up to whole bags for purchasing.
            </p>
          </div>
        }
        faqs={CEMENT_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate cement', onClick: () => runCalculate() },
          secondary: { label: 'Cement prices', href: '/construction/materials?search=cement' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="calc:cement" surface="cement-calculator" />
      </div>
    </>
  );
}
