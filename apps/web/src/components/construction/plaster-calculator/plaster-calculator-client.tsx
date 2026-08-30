'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  PLASTER_SURFACE_PRESETS,
  calculatePlasterQuantity,
  type PlasterCalculatorResult,
  type PlasterMixPreset,
  type PlasterPreset,
  type PlasterSurface,
  PLASTER_CALC_VERSION,
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
  PLASTER_CALC_FAQS,
  PLASTER_CALC_RELATED,
  PLASTER_CALC_SEO,
  PLASTER_WORKED_EXAMPLE,
} from './content';

const CALC_TYPE = 'plaster_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';
type AreaUnit = 'm2' | 'ft2' | 'yard2';
type AreaMode = 'area' | 'dimensions';
type OpeningMode = 'none' | 'area' | 'count';

type FormState = {
  surface: PlasterSurface;
  surfacePreset: PlasterPreset;
  areaMode: AreaMode;
  area: string;
  areaUnit: AreaUnit;
  length: string;
  height: string;
  lengthUnit: LengthUnit;
  heightUnit: LengthUnit;
  thickness: string;
  thicknessUnit: LengthUnit;
  openingMode: OpeningMode;
  openingArea: string;
  openingAreaUnit: AreaUnit;
  openingCount: string;
  openingWidth: string;
  openingHeight: string;
  openingWidthUnit: LengthUnit;
  openingHeightUnit: LengthUnit;
  mixPreset: PlasterMixPreset;
  cementParts: string;
  sandParts: string;
  wastagePercent: string;
  bagSizeKg: string;
  bagPriceInr: string;
  sandRatePerM3Inr: string;
  includeCost: boolean;
};

function defaultForm(): FormState {
  const interior = PLASTER_SURFACE_PRESETS.interior_wall;
  return {
    surface: 'wall',
    surfacePreset: 'interior_wall',
    areaMode: 'area',
    area: '100',
    areaUnit: 'm2',
    length: '10',
    height: '3',
    lengthUnit: 'm',
    heightUnit: 'm',
    thickness: String(interior.thicknessMm),
    thicknessUnit: 'mm',
    openingMode: 'area',
    openingArea: '4',
    openingAreaUnit: 'm2',
    openingCount: '2',
    openingWidth: '1.2',
    openingHeight: '2.1',
    openingWidthUnit: 'm',
    openingHeightUnit: 'm',
    mixPreset: interior.mixPreset,
    cementParts: '1',
    sandParts: '4',
    wastagePercent: '10',
    bagSizeKg: '50',
    bagPriceInr: '',
    sandRatePerM3Inr: '',
    includeCost: false,
  };
}

const LENGTH_UNIT_OPTIONS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'inch', label: 'inch' },
  { value: 'ft', label: 'ft' },
];

const AREA_UNIT_OPTIONS = [
  { value: 'm2', label: 'm²' },
  { value: 'ft2', label: 'ft²' },
  { value: 'yard2', label: 'sq yard' },
];

export function PlasterCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<PlasterCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Plaster estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function applySurfacePreset(preset: PlasterPreset) {
    setForm((prev) => {
      if (preset === 'custom') {
        return { ...prev, surfacePreset: 'custom' };
      }
      const defaults = PLASTER_SURFACE_PRESETS[preset];
      return {
        ...prev,
        surfacePreset: preset,
        surface: preset === 'ceiling' ? 'ceiling' : 'wall',
        thickness: String(defaults.thicknessMm),
        thicknessUnit: 'mm',
        mixPreset: defaults.mixPreset,
        sandParts:
          defaults.mixPreset === 'mortar_1_3'
            ? '3'
            : defaults.mixPreset === 'mortar_1_5'
              ? '5'
              : defaults.mixPreset === 'mortar_1_6'
                ? '6'
                : '4',
      };
    });
    setResult(null);
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        surface: form.surface,
        surfacePreset: form.surfacePreset,
        area: form.areaMode === 'area' ? Number(form.area) : undefined,
        areaUnit: form.areaUnit,
        length: form.areaMode === 'dimensions' ? Number(form.length) : undefined,
        height: form.areaMode === 'dimensions' ? Number(form.height) : undefined,
        lengthUnit: form.lengthUnit,
        heightUnit: form.heightUnit,
        thickness: Number(form.thickness),
        thicknessUnit: form.thicknessUnit,
        openingArea:
          form.openingMode === 'area' && form.openingArea.trim() ? Number(form.openingArea) : null,
        openingAreaUnit: form.openingAreaUnit,
        openingCount: form.openingMode === 'count' ? Number(form.openingCount) || 0 : null,
        openingWidth: form.openingMode === 'count' ? Number(form.openingWidth) : null,
        openingHeight: form.openingMode === 'count' ? Number(form.openingHeight) : null,
        openingWidthUnit: form.openingWidthUnit,
        openingHeightUnit: form.openingHeightUnit,
        mixPreset: form.mixPreset,
        cementParts: form.mixPreset === 'custom' ? Number(form.cementParts) : undefined,
        sandParts: form.mixPreset === 'custom' ? Number(form.sandParts) : undefined,
        wastagePercent: Number(form.wastagePercent) || 0,
        bagSizeKg: Number(form.bagSizeKg) || 50,
        bagPriceInr: form.includeCost && form.bagPriceInr.trim() ? Number(form.bagPriceInr) : null,
        sandRatePerM3Inr:
          form.includeCost && form.sandRatePerM3Inr.trim() ? Number(form.sandRatePerM3Inr) : null,
      };
      const next = calculatePlasterQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'plaster-calculator',
        methodologyVersionLabel: next.version ?? PLASTER_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/plaster-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'm3',
        result_range_category:
          next.wetVolumeM3 <= 1 ? 'low' : next.wetVolumeM3 <= 10 ? 'mid' : 'high',
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
    const text = `Varnarc plaster: wet ${result.wetVolumeM3} m³, dry ${result.dryVolumeM3} m³, cement ${result.cementBags} bags, sand ${result.sandVolumeM3} m³. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Plaster calculator',
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
      `Net plaster area,${result.netAreaM2},m2`,
      `Wet mortar volume,${result.wetVolumeM3},m3`,
      `Dry mortar volume,${result.dryVolumeM3},m3`,
      `Cement,${result.cementKg},kg`,
      `Cement bags (${result.bagSizeKg} kg),${result.cementBags},bags`,
      `Sand,${result.sandVolumeM3},m3`,
      result.estimatedCostInr != null
        ? `Estimated material cost,${result.estimatedCostInr},INR`
        : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-plaster-boq.csv`;
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
          name: projectName.trim() || 'Plaster estimate',
          areaSqft: Math.max(1, Math.round(result.netAreaM2 * 10.764)),
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

  const activePresetNote =
    form.surfacePreset !== 'custom'
      ? PLASTER_SURFACE_PRESETS[form.surfacePreset].assumptions
      : null;

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
      submitLabel="Calculate plaster"
    >
      <UnitSelector
        id="plaster-preset"
        label="Surface preset (optional)"
        value={form.surfacePreset}
        onChange={(v) => applySurfacePreset(v as PlasterPreset)}
        options={[
          { value: 'interior_wall', label: 'Interior wall' },
          { value: 'exterior_wall', label: 'Exterior wall' },
          { value: 'ceiling', label: 'Ceiling' },
          { value: 'custom', label: 'Custom' },
        ]}
        className="sm:col-span-2"
      />
      {activePresetNote ? (
        <p className="sm:col-span-2 text-xs text-slate-500">
          Suggests thickness and mix only — both remain editable. {activePresetNote[0]}
        </p>
      ) : null}

      <UnitSelector
        id="plaster-surface"
        label="Surface type"
        value={form.surface}
        onChange={(v) => setField('surface', v as PlasterSurface)}
        options={[
          { value: 'wall', label: 'Wall' },
          { value: 'ceiling', label: 'Ceiling' },
        ]}
        className="sm:col-span-2"
      />

      <UnitSelector
        id="plaster-area-mode"
        label="Area input"
        value={form.areaMode}
        onChange={(v) => setField('areaMode', v as AreaMode)}
        options={[
          { value: 'area', label: 'Gross area' },
          { value: 'dimensions', label: 'Length × height' },
        ]}
        className="sm:col-span-2"
      />

      {form.areaMode === 'area' ? (
        <>
          <CalculatorInput
            id="plaster-area"
            label="Gross area"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.area}
            onChange={(e) => setField('area', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-area-unit"
            label="Area unit"
            value={form.areaUnit}
            onChange={(e) => setField('areaUnit', e.target.value as AreaUnit)}
            options={AREA_UNIT_OPTIONS}
          />
        </>
      ) : (
        <>
          <CalculatorInput
            id="plaster-length"
            label="Length"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.length}
            onChange={(e) => setField('length', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-length-unit"
            label="Length unit"
            value={form.lengthUnit}
            onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNIT_OPTIONS}
          />
          <CalculatorInput
            id="plaster-height"
            label="Height"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.height}
            onChange={(e) => setField('height', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-height-unit"
            label="Height unit"
            value={form.heightUnit}
            onChange={(e) => setField('heightUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNIT_OPTIONS}
          />
        </>
      )}

      <CalculatorInput
        id="plaster-thk"
        label="Plaster thickness"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.thickness}
        onChange={(e) => {
          setField('thickness', e.target.value);
          if (form.surfacePreset !== 'custom') setField('surfacePreset', 'custom');
        }}
        hint="Editable — presets only suggest a starting value"
      />
      <CalculatorSelect
        id="plaster-thk-unit"
        label="Thickness unit"
        value={form.thicknessUnit}
        onChange={(e) => setField('thicknessUnit', e.target.value as LengthUnit)}
        options={LENGTH_UNIT_OPTIONS}
      />

      <UnitSelector
        id="plaster-opening-mode"
        label="Openings"
        value={form.openingMode}
        onChange={(v) => setField('openingMode', v as OpeningMode)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'area', label: 'Total area' },
          { value: 'count', label: 'Count × size' },
        ]}
        className="sm:col-span-2"
      />

      {form.openingMode === 'area' ? (
        <>
          <CalculatorInput
            id="plaster-open-area"
            label="Opening area"
            type="number"
            min={0}
            step="any"
            value={form.openingArea}
            onChange={(e) => setField('openingArea', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-open-area-unit"
            label="Opening unit"
            value={form.openingAreaUnit}
            onChange={(e) => setField('openingAreaUnit', e.target.value as AreaUnit)}
            options={AREA_UNIT_OPTIONS}
          />
        </>
      ) : null}

      {form.openingMode === 'count' ? (
        <>
          <CalculatorInput
            id="plaster-open-count"
            label="Number of openings"
            type="number"
            min={0}
            step={1}
            value={form.openingCount}
            onChange={(e) => setField('openingCount', e.target.value)}
          />
          <span className="hidden sm:block" aria-hidden />
          <CalculatorInput
            id="plaster-open-w"
            label="Opening width"
            type="number"
            min={0.001}
            step="any"
            value={form.openingWidth}
            onChange={(e) => setField('openingWidth', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-open-wu"
            label="Width unit"
            value={form.openingWidthUnit}
            onChange={(e) => setField('openingWidthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNIT_OPTIONS}
          />
          <CalculatorInput
            id="plaster-open-h"
            label="Opening height"
            type="number"
            min={0.001}
            step="any"
            value={form.openingHeight}
            onChange={(e) => setField('openingHeight', e.target.value)}
          />
          <CalculatorSelect
            id="plaster-open-hu"
            label="Height unit"
            value={form.openingHeightUnit}
            onChange={(e) => setField('openingHeightUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNIT_OPTIONS}
          />
        </>
      ) : null}

      <CalculatorSelect
        id="plaster-mix"
        label="Mix ratio (cement : sand)"
        value={form.mixPreset}
        onChange={(e) => {
          const mix = e.target.value as PlasterMixPreset;
          setField('mixPreset', mix);
          if (form.surfacePreset !== 'custom') setField('surfacePreset', 'custom');
        }}
        options={[
          { value: 'mortar_1_3', label: '1:3' },
          { value: 'mortar_1_4', label: '1:4' },
          { value: 'mortar_1_5', label: '1:5' },
          { value: 'mortar_1_6', label: '1:6' },
          { value: 'custom', label: 'Custom' },
        ]}
        className="sm:col-span-2"
      />
      {form.mixPreset === 'custom' ? (
        <>
          <CalculatorInput
            id="plaster-c-parts"
            label="Cement parts"
            type="number"
            min={0.1}
            value={form.cementParts}
            onChange={(e) => setField('cementParts', e.target.value)}
          />
          <CalculatorInput
            id="plaster-s-parts"
            label="Sand parts"
            type="number"
            min={0.1}
            value={form.sandParts}
            onChange={(e) => setField('sandParts', e.target.value)}
          />
        </>
      ) : null}

      <CalculatorInput
        id="plaster-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="plaster-bag-size"
        label="Bag size (kg)"
        type="number"
        min={1}
        max={100}
        value={form.bagSizeKg}
        onChange={(e) => setField('bagSizeKg', e.target.value)}
      />

      <UnitSelector
        id="plaster-cost"
        label="Estimated cost"
        value={form.includeCost ? 'yes' : 'no'}
        onChange={(v) => setField('includeCost', v === 'yes')}
        options={[
          { value: 'no', label: 'Skip' },
          { value: 'yes', label: 'Include rates' },
        ]}
        className="sm:col-span-2"
      />
      {form.includeCost ? (
        <>
          <CalculatorInput
            id="plaster-bag-price"
            label="Cement bag price (₹)"
            type="number"
            min={1}
            value={form.bagPriceInr}
            onChange={(e) => setField('bagPriceInr', e.target.value)}
          />
          <CalculatorInput
            id="plaster-sand-rate"
            label="Sand rate (₹ / m³)"
            type="number"
            min={1}
            value={form.sandRatePerM3Inr}
            onChange={(e) => setField('sandRatePerM3Inr', e.target.value)}
          />
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
        label="Wet mortar volume"
        value={`${result.wetVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`Dry ${result.dryVolumeM3} m³ (× ${result.dryVolumeFactor}). Indicative only.`}
        metrics={[
          {
            id: 'net',
            label: 'Net plaster area',
            value: `${result.netAreaM2} m²`,
            hint: `Gross ${result.grossAreaM2} − openings ${result.openingAreaM2}`,
          },
          {
            id: 'dry',
            label: 'Dry volume',
            value: `${result.dryVolumeM3} m³`,
          },
          {
            id: 'cement',
            label: 'Cement',
            value: `${result.cementBags} bags`,
            hint: `${result.cementKg} kg @ ${result.bagSizeKg} kg bags · mix ${result.mixLabel}`,
          },
          {
            id: 'sand',
            label: 'Sand',
            value: `${result.sandVolumeM3} m³`,
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
            <Link href="/construction/cement-calculator" className={cx.secondaryBtn}>
              Related: cement
            </Link>
            <Link href="/construction/sand-calculator" className={cx.secondaryBtn}>
              Related: sand
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
          { label: 'Plaster calculator' },
        ]}
        title="Plaster calculator"
        description="Estimate plaster mortar for walls and ceilings — wet/dry volume, cement bags, sand and optional cost. Interior/exterior presets suggest transparent defaults; thickness and mix stay editable."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              V_wet = A_net × T · V_dry = V_wet × 1.33 · cement_kg = V_dry × (c/Σ) × 1440 × (1+w%)
            </p>
            <p>
              Net area deducts openings. Dry factor 1.33 and cement density 1440 kg/m³ match the
              cement/sand mortar path. Presets only suggest thickness and mix — both remain
              editable.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{PLASTER_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{PLASTER_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={PLASTER_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate plaster', onClick: () => runCalculate() },
          secondary: {
            label: 'Cement calculator',
            href: '/construction/cement-calculator',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={PLASTER_CALC_RELATED} />
      </div>
    </>
  );
}
