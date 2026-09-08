'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateMaterialQuantities,
  MATERIAL_QUANTITY_CALC_VERSION,
  MATERIAL_QUANTITY_DISCLAIMER,
  materialRates,
  parsePlannerHandoffQuery,
  plannerToolHref,
  type ConstructionPlannerHandoff,
  type MaterialQuantityCustomRates,
  type MaterialQuantityResult,
} from '@varnarc/validation';
import {
  AssumptionPanel,
  CalculationBreakdown,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
  UnitSelector,
} from '@/components/construction/calculator';
import { ConstructionCostDonut } from '@/components/construction/calculator/construction-calculator-dashboard';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { cn, cx } from '@/components/construction/styles';
import {
  trackCalculatorModeCompleted,
  trackCalculatorModeError,
} from '@/lib/construction/analytics';
import { publishConstructionCalculationSave } from '@/lib/construction/save-calculation/publish';
import type { ConstructionProject } from '@/services/construction';
import { persistPlannerHandoff, readPlannerHandoff } from '@/lib/construction/planner-handoff';
import { MATERIAL_QTY_FAQS } from './content';

const CALC_TYPE = 'material_calculator';

type FormState = {
  projectId: string;
  builtUpArea: string;
  areaUnit: 'sqft' | 'sqm';
  floors: string;
  quality: 'basic' | 'standard' | 'premium' | 'luxury';
  location: string;
  structureType: 'rcc_framed' | 'load_bearing' | 'steel';
  wallType: 'clay_brick' | 'aac' | 'mixed';
  slabType: 'rcc' | 'filler' | 'prestressed';
  foundationType: 'isolated' | 'raft' | 'pile' | 'combined';
  wastagePercent: string;
  cementPerBag: string;
  steelPerKg: string;
  sandPerTonne: string;
  aggregatePerTonne: string;
  brickEach: string;
  tilePerSqft: string;
  paintPerLitre: string;
  factorCement: string;
  factorSteel: string;
  factorMasonry: string;
};

const DEFAULT_FORM: FormState = {
  projectId: '',
  builtUpArea: '1500',
  areaUnit: 'sqft',
  floors: '2',
  quality: 'standard',
  location: 'Bengaluru',
  structureType: 'rcc_framed',
  wallType: 'clay_brick',
  slabType: 'rcc',
  foundationType: 'isolated',
  wastagePercent: '5',
  cementPerBag: '',
  steelPerKg: '',
  sandPerTonne: '',
  aggregatePerTonne: '',
  brickEach: '',
  tilePerSqft: '',
  paintPerLitre: '',
  factorCement: '',
  factorSteel: '',
  factorMasonry: '',
};

function optionalRate(raw: string): number | undefined {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

function optionalFactor(raw: string): number | undefined {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

function customRatesFromForm(form: FormState): MaterialQuantityCustomRates | undefined {
  const rates: MaterialQuantityCustomRates = {
    cementPerBag: optionalRate(form.cementPerBag),
    steelPerKg: optionalRate(form.steelPerKg),
    sandPerTonne: optionalRate(form.sandPerTonne),
    aggregatePerTonne: optionalRate(form.aggregatePerTonne),
    brickEach: optionalRate(form.brickEach),
    tilePerSqft: optionalRate(form.tilePerSqft),
    paintPerLitre: optionalRate(form.paintPerLitre),
  };
  return Object.values(rates).some((v) => v != null) ? rates : undefined;
}

function applyHandoffToMaterialForm(
  next: FormState,
  handoff: ConstructionPlannerHandoff,
): FormState {
  if (handoff.location) next.location = handoff.location;
  if (handoff.builtUpArea != null) next.builtUpArea = String(handoff.builtUpArea);
  if (handoff.areaUnit) next.areaUnit = handoff.areaUnit;
  if (handoff.floors != null) next.floors = String(handoff.floors);
  if (
    handoff.quality === 'basic' ||
    handoff.quality === 'standard' ||
    handoff.quality === 'premium' ||
    handoff.quality === 'luxury'
  ) {
    next.quality = handoff.quality;
  }
  if (
    handoff.structureType === 'rcc_framed' ||
    handoff.structureType === 'load_bearing' ||
    handoff.structureType === 'steel'
  ) {
    next.structureType = handoff.structureType;
  }
  if (
    handoff.foundationType === 'isolated' ||
    handoff.foundationType === 'raft' ||
    handoff.foundationType === 'pile' ||
    handoff.foundationType === 'combined'
  ) {
    next.foundationType = handoff.foundationType;
  }
  return next;
}

function formFromParams(params?: Record<string, string | undefined>): FormState {
  const next = { ...DEFAULT_FORM };
  if (!params) return next;
  return applyHandoffToMaterialForm(next, parsePlannerHandoffQuery(params));
}

function handoffFromMaterial(form: FormState, areaSqft?: number): ConstructionPlannerHandoff {
  const area = Number(form.builtUpArea);
  return {
    location: form.location.trim() || undefined,
    builtUpArea: Number.isFinite(area) && area > 0 ? area : areaSqft,
    areaUnit: form.areaUnit,
    floors: Number(form.floors) || undefined,
    quality: form.quality,
    structureType: form.structureType,
    foundationType: form.foundationType,
  };
}

export function MaterialQuantityCalculatorClient({
  initialParams,
}: {
  initialParams?: Record<string, string | undefined>;
}) {
  const [form, setForm] = useState<FormState>(() => formFromParams(initialParams));
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [result, setResult] = useState<MaterialQuantityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: ConstructionProject[] };
        if (!cancelled && Array.isArray(json.data)) setProjects(json.data);
      } catch {
        /* guests */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProject = useCallback(
    (projectId: string) => {
      setForm((prev) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return { ...prev, projectId };
        const quality =
          project.quality === 'basic' ||
          project.quality === 'premium' ||
          project.quality === 'standard'
            ? project.quality
            : prev.quality;
        return {
          ...prev,
          projectId,
          builtUpArea: project.areaSqft != null ? String(project.areaSqft) : prev.builtUpArea,
          location: project.region?.trim() || prev.location,
          quality,
        };
      });
    },
    [projects],
  );

  const runCalculate = useCallback(
    (source?: FormState) => {
      const current = source ?? form;
      setError(null);
      try {
        const next = calculateMaterialQuantities({
          builtUpArea: Number(current.builtUpArea),
          areaUnit: current.areaUnit,
          floors: Number(current.floors),
          quality: current.quality,
          location: current.location.trim() || 'India',
          structureType: current.structureType,
          wallType: current.wallType,
          slabType: current.slabType,
          foundationType: current.foundationType,
          wastagePercent: Number(current.wastagePercent),
          customRates: customRatesFromForm(current),
          customFactors: (() => {
            const cement = optionalFactor(current.factorCement);
            const steel = optionalFactor(current.factorSteel);
            const masonry = optionalFactor(current.factorMasonry);
            if (cement == null && steel == null && masonry == null) return undefined;
            return { cement, steel, masonry };
          })(),
        });
        setResult(next);
        persistPlannerHandoff(handoffFromMaterial(current, next.areaSqft));
        publishConstructionCalculationSave({
          calculatorSlug: 'material-calculator',
          methodologyVersionLabel: MATERIAL_QUANTITY_CALC_VERSION,
          inputs: { ...current },
          normalizedInputs: {
            builtUpArea: Number(current.builtUpArea),
            areaUnit: current.areaUnit,
            floors: Number(current.floors),
            quality: current.quality,
            location: current.location,
            structureType: current.structureType,
            foundationType: current.foundationType,
          },
          outputs: next,
          assumptions: null,
          sourcePath: '/construction/material-calculator',
        });
        trackCalculatorModeCompleted({
          mode: 'forward',
          calculator_type: CALC_TYPE,
          unit: current.areaUnit,
          logged_in: projects.length > 0,
        });
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : 'Enter a valid built-up area and floors.');
        trackCalculatorModeError({ calculator_type: CALC_TYPE, error_type: 'validation' });
      }
    },
    [form, projects.length],
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const urlHandoff = parsePlannerHandoffQuery(initialParams ?? {});
    if (urlHandoff.builtUpArea != null) {
      runCalculate(form);
      return;
    }
    const stored = readPlannerHandoff();
    if (stored.builtUpArea) {
      const next = applyHandoffToMaterialForm({ ...form }, stored);
      setForm(next);
      if (stored.structureType || stored.foundationType) setShowAdvanced(true);
      runCalculate(next);
    }
  }, [form, initialParams, runCalculate]);

  const plannerHandoff = useMemo(() => handoffFromMaterial(form, result?.areaSqft), [form, result]);
  const boqHref = plannerToolHref('/construction/boq', plannerHandoff);
  const costHref = plannerToolHref('/construction/cost-calculator', plannerHandoff);

  return (
    <CalculatorShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Home & Construction', href: '/construction' },
        { label: 'Material quantity calculator' },
      ]}
      title="Material quantity calculator"
      description="Take a construction project and calculate indicative quantities for cement, steel, sand, aggregate, bricks, tiles, paint, electrical and plumbing."
      lastUpdated="September 2026"
      areaSqft={result?.areaSqft}
      relatedTools={[
        { label: 'Construction cost calculator', href: costHref },
        { label: 'BOQ generator', href: boqHref },
        { label: 'Cement calculator', href: '/construction/cement-calculator' },
      ]}
      form={
        <CalculatorForm
          calculatorType={CALC_TYPE}
          loggedIn={projects.length > 0}
          onSubmit={(e) => {
            e.preventDefault();
            runCalculate();
          }}
          onReset={() => {
            setForm(DEFAULT_FORM);
            setResult(null);
            setError(null);
          }}
        >
          {projects.length ? (
            <CalculatorSelect
              id="mq-project"
              label="Select project"
              value={form.projectId}
              onChange={(e) => applyProject(e.target.value)}
              options={[
                { value: '', label: 'No project — enter details' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatorInput
              id="mq-area"
              label="Built-up area"
              required
              inputMode="decimal"
              value={form.builtUpArea}
              onChange={(e) => setForm({ ...form, builtUpArea: e.target.value })}
            />
            <UnitSelector
              id="mq-area-unit"
              label="Area unit"
              value={form.areaUnit}
              onChange={(value) => setForm({ ...form, areaUnit: value === 'sqm' ? 'sqm' : 'sqft' })}
              options={[
                { value: 'sqft', label: 'sq ft' },
                { value: 'sqm', label: 'sq m' },
              ]}
            />
          </div>
          <CalculatorInput
            id="mq-floors"
            label="Number of floors"
            required
            inputMode="numeric"
            value={form.floors}
            onChange={(e) => setForm({ ...form, floors: e.target.value })}
          />
          <CalculatorSelect
            id="mq-quality"
            label="Construction quality"
            value={form.quality}
            onChange={(e) => setForm({ ...form, quality: e.target.value as FormState['quality'] })}
            options={[
              { value: 'basic', label: 'Basic' },
              { value: 'standard', label: 'Standard' },
              { value: 'premium', label: 'Premium' },
              { value: 'luxury', label: 'Luxury' },
            ]}
          />
          <CalculatorInput
            id="mq-location"
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <button
            type="button"
            className={cn(cx.link, 'text-left')}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? 'Hide advanced parameters' : 'Show advanced parameters'}
          </button>
          {showAdvanced ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorSelect
                id="mq-structure"
                label="Structure type"
                value={form.structureType}
                onChange={(e) =>
                  setForm({ ...form, structureType: e.target.value as FormState['structureType'] })
                }
                options={[
                  { value: 'rcc_framed', label: 'RCC framed' },
                  { value: 'load_bearing', label: 'Load bearing' },
                  { value: 'steel', label: 'Steel' },
                ]}
              />
              <CalculatorSelect
                id="mq-wall"
                label="Wall type"
                value={form.wallType}
                onChange={(e) =>
                  setForm({ ...form, wallType: e.target.value as FormState['wallType'] })
                }
                options={[
                  { value: 'clay_brick', label: 'Clay bricks' },
                  { value: 'aac', label: 'AAC blocks' },
                  { value: 'mixed', label: 'Mixed' },
                ]}
              />
              <CalculatorSelect
                id="mq-slab"
                label="Slab type"
                value={form.slabType}
                onChange={(e) =>
                  setForm({ ...form, slabType: e.target.value as FormState['slabType'] })
                }
                options={[
                  { value: 'rcc', label: 'RCC slab' },
                  { value: 'filler', label: 'Filler slab' },
                  { value: 'prestressed', label: 'Prestressed' },
                ]}
              />
              <CalculatorSelect
                id="mq-foundation"
                label="Foundation type"
                value={form.foundationType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    foundationType: e.target.value as FormState['foundationType'],
                  })
                }
                options={[
                  { value: 'isolated', label: 'Isolated' },
                  { value: 'raft', label: 'Raft' },
                  { value: 'pile', label: 'Pile' },
                  { value: 'combined', label: 'Combined' },
                ]}
              />
              <CalculatorInput
                id="mq-wastage"
                label="Wastage %"
                inputMode="decimal"
                value={form.wastagePercent}
                onChange={(e) => setForm({ ...form, wastagePercent: e.target.value })}
              />
              <CalculatorInput
                id="mq-f-cement"
                label="Custom cement factor"
                hint="1 = default"
                inputMode="decimal"
                value={form.factorCement}
                onChange={(e) => setForm({ ...form, factorCement: e.target.value })}
              />
              <CalculatorInput
                id="mq-f-steel"
                label="Custom steel factor"
                hint="1 = default"
                inputMode="decimal"
                value={form.factorSteel}
                onChange={(e) => setForm({ ...form, factorSteel: e.target.value })}
              />
              <CalculatorInput
                id="mq-f-masonry"
                label="Custom masonry factor"
                hint="1 = default"
                inputMode="decimal"
                value={form.factorMasonry}
                onChange={(e) => setForm({ ...form, factorMasonry: e.target.value })}
              />
            </div>
          ) : null}
          <button
            type="button"
            className={cn(cx.link, 'text-left')}
            onClick={() => setShowRates((v) => !v)}
          >
            Edit local prices
          </button>
          {showRates ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorInput
                id="mq-rate-cement"
                label="Cement ₹/bag"
                inputMode="decimal"
                placeholder={String(materialRates.cementPerBag)}
                value={form.cementPerBag}
                onChange={(e) => setForm({ ...form, cementPerBag: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-steel"
                label="Steel ₹/kg"
                inputMode="decimal"
                placeholder={String(materialRates.steelPerKg)}
                value={form.steelPerKg}
                onChange={(e) => setForm({ ...form, steelPerKg: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-sand"
                label="Sand ₹/tonne"
                inputMode="decimal"
                placeholder={String(materialRates.sandPerTonne)}
                value={form.sandPerTonne}
                onChange={(e) => setForm({ ...form, sandPerTonne: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-agg"
                label="Aggregate ₹/tonne"
                inputMode="decimal"
                placeholder={String(materialRates.aggregatePerTonne)}
                value={form.aggregatePerTonne}
                onChange={(e) => setForm({ ...form, aggregatePerTonne: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-brick"
                label="Brick ₹/piece"
                inputMode="decimal"
                placeholder={String(materialRates.brickEach)}
                value={form.brickEach}
                onChange={(e) => setForm({ ...form, brickEach: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-tile"
                label="Tiles ₹/sq ft"
                inputMode="decimal"
                placeholder={String(materialRates.tilePerSqft)}
                value={form.tilePerSqft}
                onChange={(e) => setForm({ ...form, tilePerSqft: e.target.value })}
              />
              <CalculatorInput
                id="mq-rate-paint"
                label="Paint ₹/litre"
                inputMode="decimal"
                placeholder={String(materialRates.paintPerLitre)}
                value={form.paintPerLitre}
                onChange={(e) => setForm({ ...form, paintPerLitre: e.target.value })}
              />
            </div>
          ) : null}
          {error ? <p className={cx.error}>{error}</p> : null}
        </CalculatorForm>
      }
      workspace={
        result ? (
          <div className={cn(cx.card, 'overflow-x-auto p-0')}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Material</th>
                  <th className="px-3 py-2.5 font-semibold">Quantity</th>
                  <th className="px-3 py-2.5 font-semibold">Unit</th>
                  <th className="px-3 py-2.5 font-semibold">Indicative rate</th>
                  <th className="px-3 py-2.5 font-semibold">Estimated cost</th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-[#0b1f3a]">{line.label}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {line.quantity.toLocaleString('en-IN', {
                        maximumFractionDigits: line.unit === 'tonnes' ? 1 : 0,
                      })}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{line.unit}</td>
                    <td className="px-3 py-2 tabular-nums">₹{line.rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 tabular-nums font-medium">
                      ₹{line.estimatedCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : undefined
      }
      result={
        result ? (
          <div className="space-y-4">
            <ConstructionCostDonut
              materialCost={result.materialCost}
              labourCost={result.labourCost}
              otherCost={result.otherCost}
              areaSqft={result.areaSqft}
              boqHref={boqHref}
            />
            <div className={cn(cx.card, 'space-y-3 p-4')}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Material cost estimate
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
                ₹{result.materialCost.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-600">
                Materials {result.materialSharePercent}% · Labour {result.labourSharePercent}% ·
                Other {result.otherSharePercent}%
              </p>
              <Link href={costHref} className={cn(cx.secondaryBtn, 'w-full')}>
                Construction cost calculator
              </Link>
              <Link href={boqHref} className={cn(cx.accentBtn, 'w-full')}>
                Send to BOQ
              </Link>
              <a href="#material-qty-breakdown" className={cn(cx.secondaryBtn, 'w-full')}>
                View detailed breakdown
              </a>
            </div>
          </div>
        ) : undefined
      }
      stickyCta={{
        primary: { label: 'Calculate', onClick: () => runCalculate() },
        secondary: { label: 'Open BOQ', href: boqHref },
      }}
      methodology={
        <MethodologyPanel
          title="How quantities are calculated"
          formula={result?.formula}
          lastUpdated={MATERIAL_QUANTITY_CALC_VERSION}
          steps={[
            'Start from documented per-sq-ft planning factors.',
            'Adjust for quality, floors (structure), wall/slab/foundation type and wastage.',
            'Apply city rate multipliers unless you enter local prices.',
          ]}
        />
      }
      assumptions={
        result ? (
          <AssumptionPanel
            items={[
              {
                label: 'Built-up',
                value: `${Math.round(result.areaSqft).toLocaleString('en-IN')} sq ft`,
              },
              { label: 'Floors', value: String(result.floors) },
              { label: 'Quality', value: result.quality },
              { label: 'Wastage', value: `${result.wastagePercent}%` },
            ]}
            note={result.disclaimer}
          />
        ) : null
      }
      breakdown={
        result ? (
          <div id="material-qty-breakdown">
            <CalculationBreakdown
              title="Line-by-line quantities"
              rows={result.lines.map((line) => ({
                label: line.label,
                value: `${line.quantity.toLocaleString('en-IN', {
                  maximumFractionDigits: line.unit === 'tonnes' ? 1 : 0,
                })} ${line.unit}`,
              }))}
            />
          </div>
        ) : null
      }
      faqs={MATERIAL_QTY_FAQS}
      seoContent={
        <>
          <p className="text-sm text-slate-600">{MATERIAL_QUANTITY_DISCLAIMER}</p>
          <ConstructionRelatedSection entityId="calc:cement" surface="material-calculator" />
        </>
      }
    />
  );
}
