'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PRIMARY_RENOVATION_CATEGORY_IDS,
  RENOVATION_CATEGORY_CARDS,
  RENOVATION_WORK_RATES,
  calculateRenovationCost,
  defaultRenovationWorkItems,
  type RenovationCostInput,
  type RenovationCostResult,
  type RenovationPropertyType,
  type RenovationQuality,
  type RenovationRoomsBhk,
  type RenovationWorkId,
  RENOVATION_CALC_VERSION,
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
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { RenoCategoryIcon } from './reno-category-icon';
import {
  categorizeConstructionResultRange,
  resolveConstructionLocationLevel,
  trackCalculationAddedToProject,
  trackCalculationShared,
  trackCalculatorCompleted,
  trackCalculatorError,
  trackProjectCreated,
  trackRenovationEstimateCompleted,
} from '@/lib/construction/analytics';
import {
  clearConstructionCalculationSave,
  publishConstructionCalculationSave,
} from '@/lib/construction/save-calculation/publish';
import {
  RENO_CALC_CITY_PAGES,
  RENO_CALC_FAQS,
  RENO_CALC_RELATED_CALCULATORS,
  RENO_LOCATION_SUGGESTIONS,
  RENO_SEO_INTRO,
} from './content';

const STORAGE_KEY = 'varnarc.construction.renovation-cost-calculator.v1';
const CALC_TYPE = 'renovation_cost_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type WorkState = Record<RenovationWorkId, { enabled: boolean; quality: RenovationQuality }>;

function defaultWorkState(): WorkState {
  const items = defaultRenovationWorkItems();
  const state = {} as WorkState;
  for (const meta of RENOVATION_WORK_RATES) {
    const found = items.find((i) => i.id === meta.id);
    state[meta.id] = {
      enabled: found?.enabled ?? false,
      quality: found?.quality ?? 'standard',
    };
  }
  return state;
}

type FormState = {
  location: string;
  propertyType: RenovationPropertyType;
  renovationArea: string;
  areaUnit: 'sqft' | 'sqm';
  roomsBhk: RenovationRoomsBhk;
  finishTier: RenovationQuality;
  propertyAgeYears: string;
  contingencyPercent: string;
  work: WorkState;
  paintArea: string;
  paintScope: 'interior' | 'exterior' | 'both';
  floorArea: string;
  flooringType: 'ceramic' | 'vitrified' | 'wood' | 'marble';
  floorDemolition: boolean;
  kitchenSize: 'compact' | 'standard' | 'large';
  cabinetType: 'basic' | 'modular';
  countertop: 'laminate' | 'granite' | 'quartz';
  bathroomCount: string;
};

const DEFAULT_FORM: FormState = {
  location: 'Hyderabad',
  propertyType: 'apartment',
  renovationArea: '1000',
  areaUnit: 'sqft',
  roomsBhk: '2bhk',
  finishTier: 'standard',
  propertyAgeYears: '12',
  contingencyPercent: '12',
  work: defaultWorkState(),
  paintArea: '',
  paintScope: 'interior',
  floorArea: '',
  flooringType: 'vitrified',
  floorDemolition: false,
  kitchenSize: 'standard',
  cabinetType: 'modular',
  countertop: 'granite',
  bathroomCount: '1',
};

function parseInitial(params?: Record<string, string | undefined>): FormState {
  const next: FormState = {
    ...DEFAULT_FORM,
    work: defaultWorkState(),
  };
  if (!params) return next;
  if (params.location || params.region) {
    next.location = (params.location || params.region)!;
  }
  if (params.area || params.renovationArea || params.areaSqft) {
    next.renovationArea = (params.renovationArea || params.areaSqft || params.area)!;
  }
  if (params.areaUnit === 'sqm' || params.areaUnit === 'sqft') {
    next.areaUnit = params.areaUnit;
  }
  if (params.age || params.propertyAgeYears) {
    next.propertyAgeYears = (params.propertyAgeYears || params.age)!;
  }
  if (params.contingency || params.contingencyPercent) {
    next.contingencyPercent = (params.contingencyPercent || params.contingency)!;
  }
  if (params.propertyType) {
    next.propertyType = params.propertyType as RenovationPropertyType;
  }
  if (
    params.roomsBhk === '1bhk' ||
    params.roomsBhk === '2bhk' ||
    params.roomsBhk === '3bhk' ||
    params.roomsBhk === '4bhk'
  ) {
    next.roomsBhk = params.roomsBhk;
  }
  if (
    params.finishTier === 'basic' ||
    params.finishTier === 'standard' ||
    params.finishTier === 'premium' ||
    params.quality === 'basic' ||
    params.quality === 'standard' ||
    params.quality === 'premium'
  ) {
    next.finishTier = (params.finishTier || params.quality) as RenovationQuality;
    for (const id of Object.keys(next.work) as RenovationWorkId[]) {
      next.work[id] = { ...next.work[id], quality: next.finishTier };
    }
  }
  if (params.work) {
    const ids = params.work.split(',').map((s) => s.trim()) as RenovationWorkId[];
    for (const id of Object.keys(next.work) as RenovationWorkId[]) {
      next.work[id] = {
        ...next.work[id],
        enabled: ids.includes(id),
      };
    }
  }
  return next;
}

function toInput(form: FormState): RenovationCostInput {
  const workItems = RENOVATION_WORK_RATES.map((meta) => ({
    id: meta.id,
    enabled: form.work[meta.id].enabled,
    quality: form.finishTier,
  }));
  return {
    location: form.location.trim() || 'India',
    propertyType: form.propertyType,
    renovationArea: Number(form.renovationArea),
    areaUnit: form.areaUnit,
    roomsBhk: form.roomsBhk,
    propertyAgeYears: Math.max(0, Number(form.propertyAgeYears) || 0),
    finishTier: form.finishTier,
    contingencyPercent: Number(form.contingencyPercent) || 12,
    workItems,
    workDetails: {
      painting: form.work.painting.enabled
        ? {
            paintArea: Number(form.paintArea) > 0 ? Number(form.paintArea) : undefined,
            scope: form.paintScope,
          }
        : undefined,
      flooring: form.work.flooring.enabled
        ? {
            floorArea: Number(form.floorArea) > 0 ? Number(form.floorArea) : undefined,
            flooringType: form.flooringType,
            demolition: form.floorDemolition,
          }
        : undefined,
      kitchen: form.work.kitchen.enabled
        ? {
            kitchenSize: form.kitchenSize,
            cabinetType: form.cabinetType,
            countertop: form.countertop,
          }
        : undefined,
      bathroom: form.work.bathroom.enabled
        ? { bathroomCount: Math.max(1, Math.round(Number(form.bathroomCount) || 1)) }
        : undefined,
    },
  };
}

function buildShareParams(form: FormState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('location', form.location);
  sp.set('renovationArea', form.renovationArea);
  sp.set('areaUnit', form.areaUnit);
  sp.set('propertyAgeYears', form.propertyAgeYears);
  sp.set('propertyType', form.propertyType);
  sp.set('contingencyPercent', form.contingencyPercent);
  const work = RENOVATION_WORK_RATES.filter((w) => form.work[w.id].enabled)
    .map((w) => w.id)
    .join(',');
  if (work) sp.set('work', work);
  return sp;
}

export function RenovationCostCalculatorClient({
  initialParams,
  isAuthenticated = false,
}: {
  initialParams?: Record<string, string | undefined>;
  isAuthenticated?: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => parseInitial(initialParams));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My renovation project');
  const [saveLoading, setSaveLoading] = useState(false);
  const trackedRef = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialParams?.renovationArea && !initialParams?.area) {
        const saved = JSON.parse(raw) as { form?: FormState; submitted?: boolean };
        if (saved.form?.work) {
          setForm({
            ...DEFAULT_FORM,
            ...saved.form,
            work: { ...defaultWorkState(), ...saved.form.work },
          });
          if (saved.submitted) setSubmitted(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, [initialParams]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleWork = useCallback((id: RenovationWorkId, enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      work: { ...prev.work, [id]: { ...prev.work[id], enabled } },
    }));
  }, []);

  const result: RenovationCostResult | null = useMemo(() => {
    if (!submitted) return null;
    try {
      return calculateRenovationCost(toInput(form));
    } catch {
      return null;
    }
  }, [form, submitted]);

  useEffect(() => {
    if (!submitted) return;
    try {
      const next = calculateRenovationCost(toInput(form));
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'renovation-cost-calculator',
        methodologyVersionLabel: next.version ?? RENOVATION_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: toInput(form) as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/renovation-cost-calculator',
      });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, submitted: true, savedAt: Date.now() }),
      );
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}?${buildShareParams(form)}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      clearConstructionCalculationSave();
    }
  }, [form, submitted]);

  function runCalculate() {
    setActionMsg(null);
    try {
      const input = toInput(form);
      if (!input.renovationArea || input.renovationArea <= 0) {
        setError('Enter a valid renovation area.');
        return;
      }
      const next = calculateRenovationCost(input);
      setSubmitted(true);
      setError(null);
      if (!trackedRef.current) {
        trackedRef.current = true;
        trackCalculatorCompleted({
          calculator_type: CALC_TYPE,
          unit: form.areaUnit,
          location_level: resolveConstructionLocationLevel({
            hasState: Boolean(form.location.trim()),
          }),
          result_range_category: categorizeConstructionResultRange(next.estimatedTotal),
          logged_in: isAuthenticated,
        });
        trackRenovationEstimateCompleted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setSubmitted(false);
      clearConstructionCalculationSave();
      trackCalculatorError({
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
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'My renovation project',
          areaSqft: result.areaSqft,
          region: form.location,
          quality: 'standard',
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
        ? `${window.location.origin}/construction/renovation-cost-calculator?${buildShareParams(form)}`
        : '';
    const text = `Indicative renovation cost: ${formatInr(result.estimatedTotal)} (range ${formatInr(result.rangeLow)}–${formatInr(result.rangeHigh)}). Not a quote.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Varnarc renovation cost estimate', text, url });
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
    return result.workBreakdown
      .filter((r) => r.enabled || r.id === 'contingency')
      .map((r) => ({
        id: r.id,
        label:
          r.id === 'contingency'
            ? r.label
            : `${r.label}${r.quality !== 'n/a' ? ` (${r.quality})` : ''}`,
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
        setForm({ ...DEFAULT_FORM, work: defaultWorkState() });
        setSubmitted(false);
        setError(null);
        setActionMsg(null);
        trackedRef.current = false;
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate renovation cost"
    >
      <CalculatorInput
        id="reno-location"
        label="Location"
        required
        list="reno-calc-cities"
        value={form.location}
        onChange={(e) => setField('location', e.target.value)}
        placeholder="e.g. Hyderabad"
        className="sm:col-span-2"
      />
      <datalist id="reno-calc-cities">
        {RENO_LOCATION_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <CalculatorSelect
        id="reno-propertyType"
        label="Property type"
        value={form.propertyType}
        onChange={(e) => setField('propertyType', e.target.value as RenovationPropertyType)}
        options={[
          { value: 'apartment', label: 'Apartment' },
          { value: 'independent_house', label: 'Independent house' },
          { value: 'villa', label: 'Villa' },
          { value: 'duplex', label: 'Duplex' },
          { value: 'commercial', label: 'Commercial' },
        ]}
      />

      <CalculatorSelect
        id="reno-bhk"
        label="Rooms / BHK"
        value={form.roomsBhk}
        onChange={(e) => setField('roomsBhk', e.target.value as RenovationRoomsBhk)}
        options={[
          { value: 'na', label: 'Not specified' },
          { value: '1bhk', label: '1 BHK' },
          { value: '2bhk', label: '2 BHK' },
          { value: '3bhk', label: '3 BHK' },
          { value: '4bhk', label: '4 BHK' },
          { value: '5plus', label: '5 BHK+' },
        ]}
      />

      <UnitSelector
        id="reno-finish"
        label="Finish tier"
        value={form.finishTier}
        onChange={(v) => setField('finishTier', v as RenovationQuality)}
        options={[
          { value: 'basic', label: 'Basic' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
        ]}
      />

      <CalculatorInput
        id="reno-area"
        label="Renovation area"
        required
        type="number"
        min={1}
        step="any"
        value={form.renovationArea}
        onChange={(e) => setField('renovationArea', e.target.value)}
      />

      <UnitSelector
        id="reno-areaUnit"
        label="Area unit"
        value={form.areaUnit}
        onChange={(v) => setField('areaUnit', v as 'sqft' | 'sqm')}
        options={[
          { value: 'sqft', label: 'sq ft' },
          { value: 'sqm', label: 'sq m' },
        ]}
      />

      <CalculatorInput
        id="reno-age"
        label="Age of property (years)"
        type="number"
        min={0}
        max={150}
        value={form.propertyAgeYears}
        onChange={(e) => setField('propertyAgeYears', e.target.value)}
        hint="Older homes often need more prep and repairs"
      />

      <CalculatorInput
        id="reno-contingency"
        label="Contingency %"
        type="number"
        min={0}
        max={40}
        value={form.contingencyPercent}
        onChange={(e) => setField('contingencyPercent', e.target.value)}
      />

      <fieldset className="sm:col-span-2">
        <legend className={cx.label}>Renovation categories</legend>
        <p className={cx.helper}>
          Indicative starting costs. Select what you will renovate — local rates still apply.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RENOVATION_CATEGORY_CARDS.map((card) => {
            const selected = form.work[card.id].enabled;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => toggleWork(card.id, !selected)}
                  className={cn(
                    cx.card,
                    cx.focus,
                    'flex w-full min-h-[7.5rem] flex-col items-start gap-2 p-3 text-left',
                    selected
                      ? 'ring-2 ring-[#f97316] bg-orange-50/60'
                      : 'hover:border-[#f97316]/40',
                  )}
                  aria-pressed={selected}
                >
                  <RenoCategoryIcon name={card.icon} />
                  <span className="text-sm font-bold text-[#0b1f3a]">{card.title}</span>
                  <span className="text-xs text-slate-500">{card.startingLabel}</span>
                  <span className="text-[11px] font-semibold text-[#f97316]">
                    {selected ? 'Selected' : 'Tap to select'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div id="reno-customize" className="sm:col-span-2 space-y-3">
        {form.work.painting.enabled ? (
          <div className={cn(cx.card, 'grid gap-3 p-4 sm:grid-cols-2')}>
            <p className="sm:col-span-2 text-sm font-bold text-[#0b1f3a]">Painting details</p>
            <CalculatorInput
              id="reno-paint-area"
              label="Paint area (optional)"
              hint="Leave blank to use property size"
              inputMode="decimal"
              value={form.paintArea}
              onChange={(e) => setField('paintArea', e.target.value)}
            />
            <CalculatorSelect
              id="reno-paint-scope"
              label="Interior / exterior"
              value={form.paintScope}
              onChange={(e) => setField('paintScope', e.target.value as FormState['paintScope'])}
              options={[
                { value: 'interior', label: 'Interior' },
                { value: 'exterior', label: 'Exterior' },
                { value: 'both', label: 'Interior and exterior' },
              ]}
            />
          </div>
        ) : null}
        {form.work.flooring.enabled ? (
          <div className={cn(cx.card, 'grid gap-3 p-4 sm:grid-cols-2')}>
            <p className="sm:col-span-2 text-sm font-bold text-[#0b1f3a]">Flooring details</p>
            <CalculatorInput
              id="reno-floor-area"
              label="Floor area (optional)"
              hint="Leave blank to use property size"
              inputMode="decimal"
              value={form.floorArea}
              onChange={(e) => setField('floorArea', e.target.value)}
            />
            <CalculatorSelect
              id="reno-floor-type"
              label="Tile / flooring type"
              value={form.flooringType}
              onChange={(e) =>
                setField('flooringType', e.target.value as FormState['flooringType'])
              }
              options={[
                { value: 'ceramic', label: 'Ceramic' },
                { value: 'vitrified', label: 'Vitrified' },
                { value: 'wood', label: 'Wood / laminate' },
                { value: 'marble', label: 'Marble / stone' },
              ]}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.floorDemolition}
                onChange={(e) => setField('floorDemolition', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#f97316]"
              />
              Demolition of existing flooring required
            </label>
          </div>
        ) : null}
        {form.work.kitchen.enabled ? (
          <div className={cn(cx.card, 'grid gap-3 p-4 sm:grid-cols-2')}>
            <p className="sm:col-span-2 text-sm font-bold text-[#0b1f3a]">Kitchen details</p>
            <CalculatorSelect
              id="reno-kitchen-size"
              label="Kitchen size"
              value={form.kitchenSize}
              onChange={(e) => setField('kitchenSize', e.target.value as FormState['kitchenSize'])}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'standard', label: 'Standard' },
                { value: 'large', label: 'Large' },
              ]}
            />
            <CalculatorSelect
              id="reno-cabinet"
              label="Cabinet type"
              value={form.cabinetType}
              onChange={(e) => setField('cabinetType', e.target.value as FormState['cabinetType'])}
              options={[
                { value: 'basic', label: 'Basic' },
                { value: 'modular', label: 'Modular' },
              ]}
            />
            <CalculatorSelect
              id="reno-counter"
              label="Countertop type"
              value={form.countertop}
              onChange={(e) => setField('countertop', e.target.value as FormState['countertop'])}
              options={[
                { value: 'laminate', label: 'Laminate' },
                { value: 'granite', label: 'Granite' },
                { value: 'quartz', label: 'Quartz' },
              ]}
            />
          </div>
        ) : null}
        {form.work.bathroom.enabled ? (
          <div className={cn(cx.card, 'grid gap-3 p-4 sm:grid-cols-2')}>
            <p className="sm:col-span-2 text-sm font-bold text-[#0b1f3a]">Bathroom details</p>
            <CalculatorInput
              id="reno-bath-count"
              label="Number of bathrooms"
              inputMode="numeric"
              value={form.bathroomCount}
              onChange={(e) => setField('bathroomCount', e.target.value)}
            />
            <p className="text-xs text-slate-500 sm:col-span-2">
              Fixture tier follows the finish selected above (basic / standard / premium).
            </p>
          </div>
        ) : null}
      </div>

      <fieldset className="sm:col-span-2">
        <legend className={cx.label}>More work (optional)</legend>
        <ul className="mt-2 space-y-2">
          {RENOVATION_WORK_RATES.filter(
            (meta) => !(PRIMARY_RENOVATION_CATEGORY_IDS as readonly string[]).includes(meta.id),
          ).map((meta) => {
            const item = form.work[meta.id];
            return (
              <li
                key={meta.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => toggleWork(meta.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#f97316]"
                  />
                  {meta.label}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

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
        label="Estimated renovation cost"
        value={formatInr(result.estimatedTotal)}
        hint={`Likely range ${formatInr(result.rangeLow)} – ${formatInr(result.rangeHigh)}. Indicative only — not a guaranteed quote.`}
        metrics={[
          { id: 'mat', label: 'Material cost', value: formatInr(result.materialCost) },
          { id: 'lab', label: 'Labour cost', value: formatInr(result.labourCost) },
          { id: 'oth', label: 'Other', value: formatInr(result.otherCost) },
          { id: 'psf', label: 'Cost per sq ft', value: formatInr(result.costPerSqft) },
          {
            id: 'cont',
            label: 'Contingency',
            value: `${formatInr(result.contingencyAmount)} (${result.contingencyPercent}%)`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="#reno-customize" className={cx.accentBtn}>
              Customize renovation
            </a>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => window.print()}>
              Print
            </button>
          </div>
        }
      />

      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Top cost drivers</h3>
        <ol className="mt-3 space-y-2">
          {result.topCostDrivers.map((d, i) => (
            <li
              key={d.id}
              className="flex items-baseline justify-between gap-3 text-sm text-slate-700"
            >
              <span>
                <span className="mr-2 font-bold text-[#f97316]">{i + 1}.</span>
                {d.label}
              </span>
              <span className="font-semibold tabular-nums text-[#0b1f3a]">
                {formatInr(d.amount)}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  ({d.percentOfTotal}%)
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Toggle work categories in the form to update this list and the total instantly.
        </p>
      </div>

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
        title="Work-category breakdown"
        caption="Enabled categories only — toggle items above to recalculate."
        rows={breakdownRows}
      />

      <aside className={cn(cx.card, 'bg-slate-50 p-4 sm:p-5')} aria-labelledby="reno-assumptions">
        <h3 id="reno-assumptions" className="text-sm font-bold text-[#0b1f3a]">
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
        formula="Total ≈ Σ(selected work × quality rates × location × property × age) + contingency"
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
          { label: 'Renovation cost calculator' },
        ]}
        title="Renovation cost calculator"
        description="Estimate renovation expenses by selecting only the work you need — painting, kitchen, bathroom, waterproofing and more — without forcing a full new-build cost."
        lastUpdated="September 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 sm:text-sm">
              renovation_total = Σ(work_rate[quality]) × location × property × age + contingency
            </p>
            <p>
              Each selected category uses basic / standard / premium rates (per sq ft or package).
              Location, property type and age adjust the subtotal; contingency is added last. A
              likely range of ±15% is shown around the mid estimate.
            </p>
          </div>
        }
        methodology={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              This tool answers renovation-cost questions — what will a kitchen refresh, bathroom
              redo or full apartment renovation roughly cost — not “how much to build a new house.”
            </p>
            <p>
              Toggle categories after you calculate to see how removing waterproofing or upgrading
              flooring moves the total and the top cost drivers.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{RENO_SEO_INTRO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">What drives renovation cost?</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Scope of work (cosmetic vs wet areas vs structural)</li>
              <li>Finish quality — basic, standard or premium fittings</li>
              <li>City labour and material markets</li>
              <li>Property age and surprise repairs behind walls</li>
              <li>Debris removal, waterproofing and electrical upgrades</li>
            </ul>
            <h3 className="text-base font-bold text-[#0b1f3a]">Example</h3>
            <p>
              A 1,000 sq ft apartment in Hyderabad, ~12 years old, with painting, flooring,
              electrical and plumbing at standard quality plus 12% contingency typically shows a mid
              estimate with kitchen/bathroom packages becoming the top drivers if you enable them.
              Compare scenarios by toggling categories — then confirm with local quotes.
            </p>
          </div>
        }
        faqs={RENO_CALC_FAQS}
        stickyCta={{
          primary: {
            label: 'Calculate renovation',
            onClick: () => runCalculate(),
          },
          secondary: result
            ? { label: 'Customize renovation', href: '#reno-customize' }
            : { label: 'New-build cost', href: '/construction/cost-calculator' },
        }}
      />

      <div className="site-container pb-12">
        <ConstructionRelatedLinks
          calculators={RENO_CALC_RELATED_CALCULATORS}
          cityPages={RENO_CALC_CITY_PAGES}
        />
      </div>
    </>
  );
}
