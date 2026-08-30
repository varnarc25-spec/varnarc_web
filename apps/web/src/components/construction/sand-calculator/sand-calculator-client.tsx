'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DEFAULT_SAND_DENSITY_KG_PER_M3,
  calculateSandQuantity,
  type SandMixPreset,
  type SandUseCase,
  type SandCalculatorResult,
  SAND_CALC_VERSION,
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
import { SAND_CALC_FAQS, SAND_CALC_RELATED, SAND_CALC_SEO, SAND_WORKED_EXAMPLE } from './content';

const CALC_TYPE = 'sand_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  useCase: SandUseCase;
  volume: string;
  volumeUnit: 'm3' | 'ft3' | 'liter';
  length: string;
  width: string;
  depth: string;
  lengthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  widthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  depthUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  fillingMode: 'volume' | 'dimensions';
  area: string;
  areaUnit: 'm2' | 'ft2' | 'yard2';
  thickness: string;
  thicknessUnit: 'mm' | 'cm' | 'm' | 'inch' | 'ft';
  mixPreset: SandMixPreset;
  cementParts: string;
  sandParts: string;
  aggregateParts: string;
  wastagePercent: string;
  densityKgPerM3: string;
  rateMode: 'm3' | 'tonne' | 'none';
  ratePerM3Inr: string;
  ratePerTonneInr: string;
};

function defaultMix(useCase: SandUseCase): SandMixPreset {
  if (useCase === 'concrete') return 'M20';
  if (useCase === 'plaster') return 'mortar_1_4';
  if (useCase === 'masonry') return 'mortar_1_6';
  return 'M20';
}

function defaultForm(useCase: SandUseCase = 'concrete'): FormState {
  return {
    useCase,
    volume: '1',
    volumeUnit: 'm3',
    length: '10',
    width: '4',
    depth: '0.3',
    lengthUnit: 'm',
    widthUnit: 'm',
    depthUnit: 'm',
    fillingMode: 'dimensions',
    area: '100',
    areaUnit: 'm2',
    thickness: useCase === 'masonry' ? '10' : '12',
    thicknessUnit: 'mm',
    mixPreset: defaultMix(useCase),
    cementParts: '1',
    sandParts: useCase === 'concrete' ? '1.5' : '4',
    aggregateParts: '3',
    wastagePercent: '5',
    densityKgPerM3: String(DEFAULT_SAND_DENSITY_KG_PER_M3),
    rateMode: 'none',
    ratePerM3Inr: '',
    ratePerTonneInr: '',
  };
}

export function SandCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<SandCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Sand estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const needsMix =
    form.useCase === 'concrete' || form.useCase === 'masonry' || form.useCase === 'plaster';

  const mixOptions = useMemo(() => {
    if (form.useCase === 'concrete') {
      return [
        { value: 'M5', label: 'M5 (1:5:10)' },
        { value: 'M7.5', label: 'M7.5 (1:4:8)' },
        { value: 'M10', label: 'M10 (1:3:6)' },
        { value: 'M15', label: 'M15 (1:2:4)' },
        { value: 'M20', label: 'M20 (1:1.5:3)' },
        { value: 'M25', label: 'M25 (1:1:2)' },
        { value: 'custom', label: 'Custom mix' },
      ];
    }
    return [
      { value: 'mortar_1_3', label: '1:3 mortar' },
      { value: 'mortar_1_4', label: '1:4 mortar' },
      { value: 'mortar_1_5', label: '1:5 mortar' },
      { value: 'mortar_1_6', label: '1:6 mortar' },
      { value: 'custom', label: 'Custom mix' },
    ];
  }, [form.useCase]);

  function changeUseCase(useCase: SandUseCase) {
    setForm((prev) => ({
      ...prev,
      useCase,
      mixPreset: defaultMix(useCase),
      thickness: useCase === 'masonry' ? '10' : '12',
      sandParts: useCase === 'concrete' ? '1.5' : '4',
    }));
    setResult(null);
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        useCase: form.useCase,
        volume:
          form.useCase === 'concrete' ||
          form.useCase === 'generic_volume' ||
          (form.useCase === 'filling' && form.fillingMode === 'volume')
            ? Number(form.volume)
            : undefined,
        volumeUnit: form.volumeUnit,
        length:
          form.useCase === 'filling' && form.fillingMode === 'dimensions'
            ? Number(form.length)
            : undefined,
        width:
          form.useCase === 'filling' && form.fillingMode === 'dimensions'
            ? Number(form.width)
            : undefined,
        depth:
          form.useCase === 'filling' && form.fillingMode === 'dimensions'
            ? Number(form.depth)
            : undefined,
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        depthUnit: form.depthUnit,
        area:
          form.useCase === 'masonry' || form.useCase === 'plaster' ? Number(form.area) : undefined,
        areaUnit: form.areaUnit,
        thickness:
          form.useCase === 'masonry' || form.useCase === 'plaster'
            ? Number(form.thickness)
            : undefined,
        thicknessUnit: form.thicknessUnit,
        mixPreset: needsMix ? form.mixPreset : 'M20',
        cementParts: form.mixPreset === 'custom' ? Number(form.cementParts) : undefined,
        sandParts: form.mixPreset === 'custom' ? Number(form.sandParts) : undefined,
        aggregateParts:
          form.mixPreset === 'custom'
            ? form.useCase === 'concrete'
              ? Number(form.aggregateParts)
              : 0
            : undefined,
        wastagePercent: Number(form.wastagePercent) || 0,
        densityKgPerM3: Number(form.densityKgPerM3) || DEFAULT_SAND_DENSITY_KG_PER_M3,
        ratePerM3Inr:
          form.rateMode === 'm3' && form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
        ratePerTonneInr:
          form.rateMode === 'tonne' && form.ratePerTonneInr.trim()
            ? Number(form.ratePerTonneInr)
            : null,
      };
      const next = calculateSandQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'sand-calculator',
        methodologyVersionLabel: next.version ?? SAND_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/sand-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'm3',
        result_range_category:
          next.sandVolumeM3 <= 5 ? 'low' : next.sandVolumeM3 <= 50 ? 'mid' : 'high',
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
    const text = `Varnarc sand estimate: ${result.sandVolumeM3} m³ (${result.sandVolumeFt3} ft³) ≈ ${result.estimatedTonnes} t @ ${result.densityKgPerM3} kg/m³. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Sand calculator', text, url: window.location.href });
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
      `Sand volume,${result.sandVolumeM3},m3`,
      `Sand volume,${result.sandVolumeFt3},ft3`,
      `Sand mass (density ${result.densityKgPerM3} kg/m3),${result.estimatedTonnes},tonne`,
      result.estimatedCostInr != null ? `Estimated sand cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-sand-boq-${result.useCase}.csv`;
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
          name: projectName.trim() || 'Sand estimate',
          areaSqft: Math.max(1, Math.round(result.sandVolumeM3 * 10)),
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
        setForm(defaultForm('concrete'));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate sand"
    >
      <UnitSelector
        id="sand-use-case"
        label="Use case"
        value={form.useCase}
        onChange={(v) => changeUseCase(v as SandUseCase)}
        options={[
          { value: 'concrete', label: 'Concrete' },
          { value: 'masonry', label: 'Masonry' },
          { value: 'plaster', label: 'Plaster' },
          { value: 'filling', label: 'Filling' },
          { value: 'generic_volume', label: 'Generic volume' },
        ]}
        className="sm:col-span-2"
      />

      {form.useCase === 'concrete' || form.useCase === 'generic_volume' ? (
        <>
          <CalculatorInput
            id="sand-volume"
            label="Volume"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.volume}
            onChange={(e) => setField('volume', e.target.value)}
          />
          <CalculatorSelect
            id="sand-volume-unit"
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
      ) : null}

      {form.useCase === 'filling' ? (
        <>
          <UnitSelector
            id="sand-fill-mode"
            label="Filling input"
            value={form.fillingMode}
            onChange={(v) => setField('fillingMode', v as 'volume' | 'dimensions')}
            options={[
              { value: 'dimensions', label: 'L × W × D' },
              { value: 'volume', label: 'Volume' },
            ]}
            className="sm:col-span-2"
          />
          {form.fillingMode === 'volume' ? (
            <>
              <CalculatorInput
                id="sand-fill-vol"
                label="Volume"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.volume}
                onChange={(e) => setField('volume', e.target.value)}
              />
              <CalculatorSelect
                id="sand-fill-vol-unit"
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
                id="sand-l"
                label="Length"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.length}
                onChange={(e) => setField('length', e.target.value)}
              />
              <CalculatorSelect
                id="sand-lu"
                label="Length unit"
                value={form.lengthUnit}
                onChange={(e) => setField('lengthUnit', e.target.value as FormState['lengthUnit'])}
                options={[
                  { value: 'm', label: 'm' },
                  { value: 'ft', label: 'ft' },
                  { value: 'cm', label: 'cm' },
                  { value: 'mm', label: 'mm' },
                  { value: 'inch', label: 'inch' },
                ]}
              />
              <CalculatorInput
                id="sand-w"
                label="Width"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.width}
                onChange={(e) => setField('width', e.target.value)}
              />
              <CalculatorSelect
                id="sand-wu"
                label="Width unit"
                value={form.widthUnit}
                onChange={(e) => setField('widthUnit', e.target.value as FormState['widthUnit'])}
                options={[
                  { value: 'm', label: 'm' },
                  { value: 'ft', label: 'ft' },
                  { value: 'cm', label: 'cm' },
                  { value: 'mm', label: 'mm' },
                  { value: 'inch', label: 'inch' },
                ]}
              />
              <CalculatorInput
                id="sand-d"
                label="Depth"
                type="number"
                min={0.001}
                step="any"
                required
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
              />
              <CalculatorSelect
                id="sand-du"
                label="Depth unit"
                value={form.depthUnit}
                onChange={(e) => setField('depthUnit', e.target.value as FormState['depthUnit'])}
                options={[
                  { value: 'm', label: 'm' },
                  { value: 'ft', label: 'ft' },
                  { value: 'cm', label: 'cm' },
                  { value: 'mm', label: 'mm' },
                  { value: 'inch', label: 'inch' },
                ]}
              />
            </>
          )}
        </>
      ) : null}

      {form.useCase === 'masonry' || form.useCase === 'plaster' ? (
        <>
          <CalculatorInput
            id="sand-area"
            label="Area"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.area}
            onChange={(e) => setField('area', e.target.value)}
          />
          <CalculatorSelect
            id="sand-area-unit"
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
            id="sand-thk"
            label="Thickness"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.thickness}
            onChange={(e) => setField('thickness', e.target.value)}
          />
          <CalculatorSelect
            id="sand-thk-unit"
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

      {needsMix ? (
        <>
          <CalculatorSelect
            id="sand-mix"
            label={form.useCase === 'concrete' ? 'Concrete mix' : 'Mortar mix'}
            value={form.mixPreset}
            onChange={(e) => setField('mixPreset', e.target.value as SandMixPreset)}
            options={mixOptions}
            className="sm:col-span-2"
          />
          {form.mixPreset === 'custom' ? (
            <>
              <CalculatorInput
                id="sand-c"
                label="Cement parts"
                type="number"
                min={0.1}
                value={form.cementParts}
                onChange={(e) => setField('cementParts', e.target.value)}
              />
              <CalculatorInput
                id="sand-s"
                label="Sand parts"
                type="number"
                min={0.1}
                value={form.sandParts}
                onChange={(e) => setField('sandParts', e.target.value)}
              />
              {form.useCase === 'concrete' ? (
                <CalculatorInput
                  id="sand-a"
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
        </>
      ) : null}

      <CalculatorInput
        id="sand-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="sand-density"
        label="Bulk density (kg/m³)"
        type="number"
        min={500}
        max={3000}
        required
        value={form.densityKgPerM3}
        onChange={(e) => setField('densityKgPerM3', e.target.value)}
        hint="Editable assumption for tonne estimate"
      />

      <UnitSelector
        id="sand-rate-mode"
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
          id="sand-rate-m3"
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
          id="sand-rate-t"
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
        label="Sand volume"
        value={`${result.sandVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`${result.sandVolumeFt3} ft³ · ${result.estimatedTonnes} t @ ${result.densityKgPerM3} kg/m³. Indicative only.`}
        metrics={[
          { id: 'ft3', label: 'Cubic feet', value: `${result.sandVolumeFt3} ft³` },
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
            <Link href="/construction/cement-calculator" className={cx.secondaryBtn}>
              Related: cement
            </Link>
            <Link href="/construction/aggregate-calculator" className={cx.secondaryBtn}>
              Related: aggregate
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
          { label: 'Sand calculator' },
        ]}
        title="Sand calculator"
        description="Estimate sand for concrete, masonry, plaster, filling and generic volumes — with editable density, wastage, unit conversion and optional cost."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              sand_m³ = wet × dry_factor × (s/Σparts) × (1 + wastage%) · tonnes = m³ × density/1000
            </p>
            <p>
              Density is an editable bulk-density assumption (default{' '}
              {DEFAULT_SAND_DENSITY_KG_PER_M3} kg/m³). Mix dry factors match the cement/concrete
              calculators.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{SAND_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{SAND_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={SAND_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate sand', onClick: () => runCalculate() },
          secondary: { label: 'Cement calculator', href: '/construction/cement-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={SAND_CALC_RELATED} />
      </div>
    </>
  );
}
