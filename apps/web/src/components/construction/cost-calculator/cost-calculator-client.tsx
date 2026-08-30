'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateConstructionCost,
  type ConstructionCostInput,
  type ConstructionCostQuality,
  type ConstructionCostPropertyType,
  type ConstructionCostResult,
  COST_CALC_VERSION,
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
  categorizeConstructionResultRange,
  resolveConstructionLocationLevel,
  trackBoqGenerated,
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
  ConstructionReportActions,
  reportFromCostCalculation,
} from '@/components/construction/report';
import { COST_CALC_EXAMPLE, COST_CALC_FAQS, LOCATION_SUGGESTIONS } from './content';

const STORAGE_KEY = 'varnarc.construction.cost-calculator.v1';
const CALC_TYPE = 'construction_cost_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

type FormState = {
  mode: 'forward' | 'reverse';
  location: string;
  propertyType: ConstructionCostPropertyType;
  builtUpArea: string;
  areaUnit: 'sqft' | 'sqm';
  floors: string;
  quality: ConstructionCostQuality;
  foundationType: string;
  structureType: string;
  basement: boolean;
  parkingSlots: string;
  lift: boolean;
  compoundWall: boolean;
  modularKitchen: boolean;
  interiorLevel: string;
  customCostPerSqft: string;
  contingencyPercent: string;
  baseRateOverride: string;
  materialPercent: string;
  labourPercent: string;
  miscPercent: string;
  budgetInr: string;
};

const DEFAULT_FORM: FormState = {
  mode: 'forward',
  location: 'Hyderabad',
  propertyType: 'independent_house',
  builtUpArea: '1500',
  areaUnit: 'sqft',
  floors: '2',
  quality: 'standard',
  foundationType: '',
  structureType: '',
  basement: false,
  parkingSlots: '0',
  lift: false,
  compoundWall: false,
  modularKitchen: false,
  interiorLevel: '',
  customCostPerSqft: '',
  contingencyPercent: '10',
  baseRateOverride: '',
  materialPercent: '',
  labourPercent: '',
  miscPercent: '',
  budgetInr: '3000000',
};

function parseInitial(params?: Record<string, string | undefined>): FormState {
  const next = { ...DEFAULT_FORM };
  if (!params) return next;
  if (params.location || params.region) next.location = (params.location || params.region)!;
  if (params.area || params.areaSqft || params.builtUpArea) {
    next.builtUpArea = (params.builtUpArea || params.areaSqft || params.area)!;
  }
  if (params.areaUnit === 'sqm' || params.areaUnit === 'sqft') next.areaUnit = params.areaUnit;
  if (params.floors) next.floors = params.floors;
  if (
    params.quality === 'basic' ||
    params.quality === 'standard' ||
    params.quality === 'premium' ||
    params.quality === 'luxury'
  ) {
    next.quality = params.quality;
  }
  if (params.propertyType) next.propertyType = params.propertyType as ConstructionCostPropertyType;
  if (params.contingency || params.contingencyPercent) {
    next.contingencyPercent = (params.contingencyPercent || params.contingency)!;
  }
  if (params.customRate) next.customCostPerSqft = params.customRate;
  if (params.mode === 'reverse' || params.mode === 'forward') next.mode = params.mode;
  if (params.budget || params.budgetInr) {
    next.budgetInr = (params.budgetInr || params.budget)!;
    next.mode = 'reverse';
  }
  return next;
}

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const next = { ...DEFAULT_FORM };
  if (inputs.mode === 'forward' || inputs.mode === 'reverse') next.mode = inputs.mode;
  if (typeof inputs.location === 'string') next.location = inputs.location;
  if (typeof inputs.propertyType === 'string') {
    next.propertyType = inputs.propertyType as ConstructionCostPropertyType;
  }
  if (typeof inputs.builtUpArea === 'number') next.builtUpArea = String(inputs.builtUpArea);
  if (inputs.areaUnit === 'sqm' || inputs.areaUnit === 'sqft') next.areaUnit = inputs.areaUnit;
  if (typeof inputs.floors === 'number') next.floors = String(inputs.floors);
  if (
    inputs.quality === 'basic' ||
    inputs.quality === 'standard' ||
    inputs.quality === 'premium' ||
    inputs.quality === 'luxury'
  ) {
    next.quality = inputs.quality;
  }
  if (typeof inputs.foundationType === 'string') next.foundationType = inputs.foundationType;
  if (typeof inputs.structureType === 'string') next.structureType = inputs.structureType;
  if (typeof inputs.basement === 'boolean') next.basement = inputs.basement;
  if (typeof inputs.parkingSlots === 'number') next.parkingSlots = String(inputs.parkingSlots);
  if (typeof inputs.lift === 'boolean') next.lift = inputs.lift;
  if (typeof inputs.compoundWall === 'boolean') next.compoundWall = inputs.compoundWall;
  if (typeof inputs.modularKitchen === 'boolean') next.modularKitchen = inputs.modularKitchen;
  if (typeof inputs.interiorLevel === 'string') next.interiorLevel = inputs.interiorLevel;
  if (typeof inputs.customCostPerSqft === 'number') {
    next.customCostPerSqft = String(inputs.customCostPerSqft);
  }
  if (typeof inputs.contingencyPercent === 'number') {
    next.contingencyPercent = String(inputs.contingencyPercent);
  }
  if (typeof inputs.budgetInr === 'number') next.budgetInr = String(inputs.budgetInr);
  const overrides = inputs.overrides;
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    const o = overrides as Record<string, unknown>;
    if (typeof o.baseRatePerSqft === 'number') next.baseRateOverride = String(o.baseRatePerSqft);
    if (typeof o.materialPercent === 'number') next.materialPercent = String(o.materialPercent);
    if (typeof o.labourPercent === 'number') next.labourPercent = String(o.labourPercent);
    if (typeof o.miscPercent === 'number') next.miscPercent = String(o.miscPercent);
  }
  return next;
}

function toInput(form: FormState): ConstructionCostInput {
  const overrides: NonNullable<ConstructionCostInput['overrides']> = {};
  if (form.baseRateOverride.trim()) {
    overrides.baseRatePerSqft = Number(form.baseRateOverride);
  }
  if (form.materialPercent.trim()) overrides.materialPercent = Number(form.materialPercent);
  if (form.labourPercent.trim()) overrides.labourPercent = Number(form.labourPercent);
  if (form.miscPercent.trim()) overrides.miscPercent = Number(form.miscPercent);

  return {
    mode: form.mode,
    location: form.location.trim() || 'India',
    propertyType: form.propertyType,
    builtUpArea: form.mode === 'forward' ? Number(form.builtUpArea) : undefined,
    areaUnit: form.areaUnit,
    floors: Math.max(1, Math.round(Number(form.floors) || 1)),
    quality: form.quality,
    foundationType: form.foundationType
      ? (form.foundationType as ConstructionCostInput['foundationType'])
      : undefined,
    structureType: form.structureType
      ? (form.structureType as ConstructionCostInput['structureType'])
      : undefined,
    basement: form.mode === 'forward' ? form.basement : false,
    parkingSlots:
      form.mode === 'forward' ? Math.max(0, Math.round(Number(form.parkingSlots) || 0)) : 0,
    lift: form.mode === 'forward' ? form.lift : false,
    compoundWall: form.mode === 'forward' ? form.compoundWall : false,
    modularKitchen: form.mode === 'forward' ? form.modularKitchen : false,
    budgetInr: form.mode === 'reverse' ? Number(form.budgetInr) : undefined,
    interiorLevel: form.interiorLevel
      ? (form.interiorLevel as ConstructionCostInput['interiorLevel'])
      : undefined,
    customCostPerSqft: form.customCostPerSqft.trim() ? Number(form.customCostPerSqft) : null,
    contingencyPercent: Number(form.contingencyPercent) || 10,
    overrides: Object.keys(overrides).length ? overrides : undefined,
  };
}

function buildShareParams(form: FormState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('mode', form.mode);
  sp.set('location', form.location);
  if (form.mode === 'reverse') sp.set('budgetInr', form.budgetInr);
  else sp.set('builtUpArea', form.builtUpArea);
  sp.set('areaUnit', form.areaUnit);
  sp.set('floors', form.floors);
  sp.set('quality', form.quality);
  sp.set('propertyType', form.propertyType);
  sp.set('contingencyPercent', form.contingencyPercent);
  if (form.customCostPerSqft.trim()) sp.set('customRate', form.customCostPerSqft);
  return sp;
}

function downloadBoq(result: ConstructionCostResult, form: FormState) {
  const lines = [
    'Category,Amount (INR),Percent of total',
    ...result.categoryBreakdown.map((r) => `"${r.label}",${r.amount},${r.percentOfTotal}`),
    '',
    'Phase,Amount (INR),Percent of total',
    ...result.phaseBreakdown.map((r) => `"${r.label}",${r.amount},${r.percentOfTotal}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `varnarc-boq-${form.location.replace(/\s+/g, '-').toLowerCase()}-${Math.round(result.areaSqft)}sqft.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ConstructionCostCalculatorClient({
  initialParams,
  initialShareInputs = null,
  isAuthenticated = false,
}: {
  initialParams?: Record<string, string | undefined>;
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
  isAuthenticated?: boolean;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : parseInitial(initialParams),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConstructionCostResult | null>(null);
  const [compare, setCompare] = useState<ConstructionCostResult | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My construction project');
  const [saveLoading, setSaveLoading] = useState(false);
  const hydrated = useRef(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const input = toInput(nextForm);
      const next = calculateConstructionCost(input);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'cost-calculator',
        methodologyVersionLabel: next.version ?? COST_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: input as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/cost-calculator',
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
    'cost-calculator',
    useCallback(
      (inputs) => {
        if (shareApplied.current) return;
        shareApplied.current = true;
        applyShareInputs(inputs);
      },
      [applyShareInputs],
    ),
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (initialShareInputs) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialParams?.builtUpArea && !initialParams?.areaSqft) {
        const saved = JSON.parse(raw) as { form?: FormState };
        if (saved.form) setForm({ ...DEFAULT_FORM, ...saved.form });
      }
    } catch {
      /* ignore */
    }
  }, [initialParams, initialShareInputs]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function runCalculate() {
    setError(null);
    setActionMsg(null);
    try {
      const input = toInput(form);
      if (form.mode === 'forward' && (!input.builtUpArea || input.builtUpArea <= 0)) {
        setError('Enter a valid built-up area.');
        return;
      }
      if (form.mode === 'reverse' && (!input.budgetInr || input.budgetInr <= 0)) {
        setError('Enter a valid budget (₹).');
        return;
      }
      const next = calculateConstructionCost(input);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'cost-calculator',
        methodologyVersionLabel: next.version ?? COST_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: input as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/cost-calculator',
      });
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ form, lastTotal: next.estimatedTotal, savedAt: Date.now() }),
        );
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined') {
        const url = `${window.location.pathname}?${buildShareParams(form).toString()}`;
        window.history.replaceState({}, '', url);
      }
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit: form.mode === 'reverse' ? next.selectedUnit : form.areaUnit,
        location_level: resolveConstructionLocationLevel({
          hasState: Boolean(form.location.trim()),
        }),
        result_range_category:
          form.mode === 'reverse'
            ? next.areaSqft <= 800
              ? 'low'
              : next.areaSqft <= 2000
                ? 'mid'
                : 'high'
            : categorizeConstructionResultRange(next.estimatedTotal),
        logged_in: isAuthenticated,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setResult(null);
      clearConstructionCalculationSave();
      trackCalculatorModeError({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        error_code: 'calc_failed',
        logged_in: isAuthenticated,
      });
    }
  }

  async function saveToProject() {
    if (!result) return;
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const quality =
        form.quality === 'luxury'
          ? 'premium'
          : form.quality === 'basic'
            ? 'basic'
            : form.quality === 'premium'
              ? 'premium'
              : 'standard';
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'My construction project',
          areaSqft: result.areaSqft,
          region: form.location,
          quality,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (res.status === 401) {
        setActionMsg('Sign in to save this calculation to a project.');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setActionMsg('Saved to your projects.');
      trackProjectCreated({ logged_in: true });
      trackCalculationAddedToProject({
        calculator_type: CALC_TYPE,
        logged_in: true,
      });
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  async function shareResult() {
    if (!result) return;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/construction/cost-calculator?${buildShareParams(form)}`
        : '';
    const text = `Indicative construction cost: ${formatInr(result.estimatedTotal)} (range ${formatInr(result.rangeLow)}–${formatInr(result.rangeHigh)}). Not a quote.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Varnarc construction cost estimate', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setActionMsg('Share link copied to clipboard.');
      }
      trackCalculationShared({ calculator_type: CALC_TYPE });
    } catch {
      setActionMsg('Could not share — copy the URL from the address bar.');
    }
  }

  const breakdownRows = useMemo(() => {
    if (!result) return [];
    return result.categoryBreakdown.map((r) => ({
      id: r.id,
      label: r.label,
      value: `${formatInr(r.amount)} (${r.percentOfTotal}%)`,
    }));
  }, [result]);

  const phaseRows = useMemo(() => {
    if (!result) return [];
    return result.phaseBreakdown.map((r) => ({
      id: r.id,
      label: r.label,
      value: `${formatInr(r.amount)} (${r.percentOfTotal}%)`,
    }));
  }, [result]);

  const floorRows = useMemo(() => {
    if (!result) return [];
    return result.floorBreakdown.map((r) => ({
      id: r.id,
      label: r.label,
      value: `${formatInr(r.amount)} (${r.percentOfTotal}%)`,
    }));
  }, [result]);

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      loggedIn={isAuthenticated}
      onSubmit={(e) => {
        e.preventDefault();
        runCalculate();
      }}
      onReset={() => {
        setForm(DEFAULT_FORM);
        setResult(null);
        setCompare(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate cost"
    >
      <UnitSelector
        id="cost-mode"
        label="Calculation mode"
        value={form.mode}
        onChange={(v) => {
          setField('mode', v as 'forward' | 'reverse');
          setResult(null);
        }}
        options={[
          { value: 'forward', label: 'Area → cost' },
          { value: 'reverse', label: 'Budget → house size' },
        ]}
        className="sm:col-span-2"
      />

      <CalculatorInput
        id="location"
        label="Location"
        required
        list="cost-calc-cities"
        value={form.location}
        onChange={(e) => setField('location', e.target.value)}
        placeholder="e.g. Hyderabad"
        className="sm:col-span-2"
      />
      <datalist id="cost-calc-cities">
        {LOCATION_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <CalculatorSelect
        id="propertyType"
        label="Property type"
        value={form.propertyType}
        onChange={(e) => setField('propertyType', e.target.value as ConstructionCostPropertyType)}
        options={[
          { value: 'independent_house', label: 'Independent house' },
          { value: 'villa', label: 'Villa' },
          { value: 'apartment', label: 'Apartment' },
          { value: 'duplex', label: 'Duplex' },
          { value: 'commercial', label: 'Commercial' },
          { value: 'renovation', label: 'Renovation' },
        ]}
      />

      {form.mode === 'reverse' ? (
        <CalculatorInput
          id="budgetInr"
          label="Budget (₹)"
          required
          type="number"
          min={1}
          step="any"
          value={form.budgetInr}
          onChange={(e) => setField('budgetInr', e.target.value)}
          hint="Example: ₹30 lakh — approximately how much house can I build?"
          className="sm:col-span-2"
        />
      ) : (
        <CalculatorInput
          id="builtUpArea"
          label="Built-up area"
          required
          type="number"
          min={1}
          step="any"
          value={form.builtUpArea}
          onChange={(e) => setField('builtUpArea', e.target.value)}
        />
      )}

      <UnitSelector
        id="areaUnit"
        label="Area unit"
        value={form.areaUnit}
        onChange={(v) => setField('areaUnit', v as 'sqft' | 'sqm')}
        options={[
          { value: 'sqft', label: 'sq ft' },
          { value: 'sqm', label: 'sq m' },
        ]}
      />

      <CalculatorInput
        id="floors"
        label="Number of floors"
        type="number"
        min={1}
        max={50}
        value={form.floors}
        onChange={(e) => setField('floors', e.target.value)}
      />

      <UnitSelector
        id="quality"
        label="Construction quality"
        value={form.quality}
        onChange={(v) => setField('quality', v as ConstructionCostQuality)}
        options={[
          { value: 'basic', label: 'Basic' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
          { value: 'luxury', label: 'Luxury' },
        ]}
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <button
          type="button"
          className={cn(cx.link, 'text-left')}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? 'Hide advanced inputs' : 'Show advanced inputs & rate overrides'}
        </button>
      </div>

      {showAdvanced ? (
        <>
          <CalculatorSelect
            id="foundationType"
            label="Foundation type"
            value={form.foundationType}
            onChange={(e) => setField('foundationType', e.target.value)}
            options={[
              { value: '', label: 'Default' },
              { value: 'isolated', label: 'Isolated footing' },
              { value: 'raft', label: 'Raft' },
              { value: 'pile', label: 'Pile' },
              { value: 'combined', label: 'Combined' },
            ]}
          />
          <CalculatorSelect
            id="structureType"
            label="Structure type"
            value={form.structureType}
            onChange={(e) => setField('structureType', e.target.value)}
            options={[
              { value: '', label: 'Default' },
              { value: 'rcc_framed', label: 'RCC framed' },
              { value: 'load_bearing', label: 'Load bearing' },
              { value: 'steel', label: 'Steel' },
            ]}
          />
          <CalculatorSelect
            id="interiorLevel"
            label="Interior level"
            value={form.interiorLevel}
            onChange={(e) => setField('interiorLevel', e.target.value)}
            options={[
              { value: '', label: 'Default' },
              { value: 'shell', label: 'Shell only' },
              { value: 'basic', label: 'Basic interiors' },
              { value: 'standard', label: 'Standard interiors' },
              { value: 'premium', label: 'Premium interiors' },
            ]}
          />
          <CalculatorInput
            id="parkingSlots"
            label="Parking slots"
            type="number"
            min={0}
            value={form.parkingSlots}
            onChange={(e) => setField('parkingSlots', e.target.value)}
          />
          <CalculatorInput
            id="contingencyPercent"
            label="Contingency %"
            type="number"
            min={0}
            max={40}
            value={form.contingencyPercent}
            onChange={(e) => setField('contingencyPercent', e.target.value)}
          />
          <CalculatorInput
            id="customCostPerSqft"
            label="Custom cost per sq ft (₹)"
            type="number"
            min={1}
            hint="All-in override — skips location/quality multipliers"
            value={form.customCostPerSqft}
            onChange={(e) => setField('customCostPerSqft', e.target.value)}
          />
          <CalculatorInput
            id="baseRateOverride"
            label="Override base rate (₹/sq ft)"
            type="number"
            min={1}
            hint="Multipliers still apply"
            value={form.baseRateOverride}
            onChange={(e) => setField('baseRateOverride', e.target.value)}
          />
          <CalculatorInput
            id="materialPercent"
            label="Material %"
            type="number"
            min={20}
            max={80}
            value={form.materialPercent}
            onChange={(e) => setField('materialPercent', e.target.value)}
            placeholder="52"
          />
          <CalculatorInput
            id="labourPercent"
            label="Labour %"
            type="number"
            min={5}
            max={60}
            value={form.labourPercent}
            onChange={(e) => setField('labourPercent', e.target.value)}
            placeholder="32"
          />
          <CalculatorInput
            id="miscPercent"
            label="Miscellaneous %"
            type="number"
            min={0}
            max={40}
            value={form.miscPercent}
            onChange={(e) => setField('miscPercent', e.target.value)}
            placeholder="16"
          />
          <fieldset className="sm:col-span-2">
            <legend className={cx.label}>Optional features</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['basement', 'Basement'],
                  ['lift', 'Lift'],
                  ['compoundWall', 'Compound wall'],
                  ['modularKitchen', 'Modular kitchen'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-11 items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setField(key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#f97316] focus:ring-[#f97316]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
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
    <div className="space-y-4 print:space-y-3">
      <CalculationResult
        label={result.mode === 'reverse' ? 'Approximate buildable area' : 'Estimated total cost'}
        value={
          result.mode === 'reverse'
            ? `${result.areaSqft.toLocaleString('en-IN')} sq ft`
            : formatInr(result.estimatedTotal)
        }
        hint={
          result.mode === 'reverse'
            ? `${result.areaSqm.toLocaleString('en-IN')} sq m · budget ${formatInr(result.budgetInr ?? 0)} at ~${formatInr(result.costPerSqft)}/sq ft incl. contingency. Indicative only.`
            : `Likely range ${formatInr(result.rangeLow)} – ${formatInr(result.rangeHigh)}. Indicative only — not a guaranteed quote.`
        }
        metrics={[
          { id: 'psf', label: 'Cost per sq ft', value: formatInr(result.costPerSqft) },
          {
            id: 'unit',
            label: 'Selected unit',
            value: result.selectedUnit,
          },
          {
            id: 'buffer',
            label: result.mode === 'reverse' ? 'Contingency buffer' : 'Contingency',
            value: `${result.contingencyPercent}%`,
          },
          { id: 'mat', label: 'Estimated material', value: formatCompact(result.materialCost) },
          { id: 'lab', label: 'Estimated labour', value: formatCompact(result.labourCost) },
          {
            id: 'conf',
            label: 'Confidence',
            value: `${result.confidence} (${Math.round(result.confidenceScore * 100)}%)`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx.secondaryBtn} onClick={() => shareResult()}>
              Share
            </button>
            <Link
              href={`/construction/affordability-calculator?projectCost=${result.estimatedTotal}&source=${encodeURIComponent('Construction cost calculator')}`}
              className={cx.secondaryBtn}
            >
              Check affordability
            </Link>
            <ConstructionReportActions
              data={reportFromCostCalculation({
                result,
                form: form as unknown as Record<string, unknown>,
              })}
              label="Print report"
            />
            <Link href="/construction/scenario-compare" className={cx.secondaryBtn}>
              Compare scenarios
            </Link>
            <button
              type="button"
              className={cx.secondaryBtn}
              onClick={() => {
                setCompare(result);
                setActionMsg('Scenario A saved — change inputs and calculate again to compare.');
              }}
            >
              Quick 2-way compare
            </button>
            <button
              type="button"
              className={cx.secondaryBtn}
              onClick={() => {
                downloadBoq(result, form);
                trackBoqGenerated({ item_count_bucket: 'many' });
              }}
            >
              Create BOQ
            </button>
            <Link
              href={`/construction/cost-optimization?builtUpArea=${Math.round(result.areaSqft)}&quality=${form.quality}&projectCost=${result.estimatedTotal}&targetReduction=${Math.round(result.estimatedTotal * 0.1)}`}
              className={cx.secondaryBtn}
            >
              Reduce my budget
            </Link>
            <Link href={`/construction/cement-calculator`} className={cx.secondaryBtn}>
              Calculate materials
            </Link>
          </div>
        }
      />

      {result.reverseDisplay ? <ReverseResultPanel display={result.reverseDisplay} /> : null}

      {compare && compare !== result ? (
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Scenario comparison</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scenario A
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-[#0b1f3a]">
                {formatInr(compare.estimatedTotal)}
              </p>
              <p className="text-xs text-slate-500">
                {formatInr(compare.rangeLow)} – {formatInr(compare.rangeHigh)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current (B)
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-[#0b1f3a]">
                {formatInr(result.estimatedTotal)}
              </p>
              <p className="text-xs text-slate-500">
                Diff {formatInr(result.estimatedTotal - compare.estimatedTotal)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(cx.card, 'space-y-3 p-4 sm:p-5 print:hidden')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Save & add to project</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={cx.input}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Project name"
            placeholder="Project name"
          />
          <button
            type="button"
            className={cx.primaryBtn}
            disabled={saveLoading}
            onClick={() => void saveToProject()}
          >
            {saveLoading ? 'Saving…' : 'Save / add to project'}
          </button>
        </div>
        {actionMsg ? <p className="text-xs text-slate-600">{actionMsg}</p> : null}
      </div>

      <CalculationBreakdown
        title="Cost breakdown"
        caption="Percentage and ₹ values — planning allocations, not contractor invoices."
        rows={breakdownRows}
      />
      <CalculationBreakdown title="Phase-wise cost" rows={phaseRows} />
      <CalculationBreakdown title="Floor-wise cost" rows={floorRows} />

      <aside className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5')} aria-labelledby="maj-assumptions">
        <h3 id="maj-assumptions" className="text-sm font-bold text-[#0b1f3a]">
          Major assumptions
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.disclaimer}</p>
      </aside>

      <MethodologyPanel
        title={result.methodology.title}
        formula="Total ≈ (area × effective ₹/sqft × multipliers) + features + contingency"
        steps={result.methodology.steps}
      />
    </div>
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Cost calculator' },
        ]}
        title="Construction cost calculator"
        description="Estimate the likely cost of building a property by location, area, floors and quality. Override rates when you have local quotes. Results are indicative — never a guaranteed quote."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 sm:text-sm">
              effective_rate = base_rate × quality × floors × foundation × structure × interior ×
              property × location
            </p>
            <p>
              Shell cost = built-up area (sq ft) × effective rate (or your custom ₹/sq ft). Optional
              features are added, then material / labour / miscellaneous shares are applied, and
              contingency % is added on the subtotal. A likely range of ±12% is published around the
              mid estimate.
            </p>
          </div>
        }
        methodology={
          <div className="space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              <strong className="text-[#0b1f3a]">Base location rate</strong> — national indicative
              ₹/sq ft, adjusted by city multiplier (or your override).
            </p>
            <p>
              <strong className="text-[#0b1f3a]">Quality multiplier</strong> — Basic, Standard,
              Premium or Luxury finish assumptions.
            </p>
            <p>
              <strong className="text-[#0b1f3a]">Floor multiplier</strong> — additional storeys
              increase structure and circulation cost.
            </p>
            <p>
              <strong className="text-[#0b1f3a]">Optional features</strong> — basement, parking,
              lift, compound wall, modular kitchen add fixed or area-linked amounts.
            </p>
            <p>
              <strong className="text-[#0b1f3a]">Material & labour assumptions</strong> — default
              split (~52% / 32% / 16% misc) unless you override percentages.
            </p>
            <p>
              <strong className="text-[#0b1f3a]">Contingency</strong> — configurable buffer on the
              subtotal (default 10%).
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>
              Construction cost is the likely spend to build a property to a chosen quality level —
              including structure, finishes and typical soft costs — before land, registration and
              many interior extras. Use this calculator to plan budgets, compare scenarios and brief
              contractors, then validate with local BOQs.
            </p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Cost-affecting factors</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>City labour and material markets</li>
              <li>Built-up area and number of floors</li>
              <li>Quality tier and interior level</li>
              <li>Foundation and structure type</li>
              <li>Basement, parking, lift and compound wall</li>
              <li>Contingency and professional fees</li>
            </ul>
            <h3 className="text-base font-bold text-[#0b1f3a]">{COST_CALC_EXAMPLE.title}</h3>
            <p>{COST_CALC_EXAMPLE.body}</p>
          </div>
        }
        faqs={COST_CALC_FAQS}
        stickyCta={{
          primary: {
            label: 'Calculate cost',
            onClick: () => runCalculate(),
          },
          secondary: result
            ? { label: 'Share', onClick: () => void shareResult() }
            : { label: 'Materials', href: '/construction/materials' },
        }}
      />

      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="calc:cost" surface="cost-calculator" />
      </div>
    </>
  );
}
