'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  RCC_ELEMENT_LABELS,
  RCC_PRELIMINARY_STEEL_KG_PER_M3,
  RCC_STRUCTURAL_DISCLAIMER,
  calculateRccQuantity,
  type RccCalculatorResult,
  type RccElement,
  type RccGrade,
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
import { RCC_CALC_FAQS, RCC_CALC_RELATED, RCC_CALC_SEO, RCC_WORKED_EXAMPLE } from './content';

const CALC_TYPE = 'rcc_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  element: RccElement;
  length: string;
  width: string;
  thickness: string;
  height: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  thicknessUnit: LengthUnit;
  heightUnit: LengthUnit;
  quantity: string;
  grade: RccGrade;
  cementParts: string;
  sandParts: string;
  aggregateParts: string;
  wastagePercent: string;
  includeMaterialBreakdown: boolean;
  includeSteelEstimate: boolean;
  steelKgPerM3: string;
  ratePerM3Inr: string;
};

function defaultsFor(element: RccElement): FormState {
  const band = RCC_PRELIMINARY_STEEL_KG_PER_M3[element];
  if (element === 'slab') {
    return {
      element,
      length: '5',
      width: '4',
      thickness: '150',
      height: '3',
      lengthUnit: 'm',
      widthUnit: 'm',
      thicknessUnit: 'mm',
      heightUnit: 'm',
      quantity: '1',
      grade: 'M20',
      cementParts: '1',
      sandParts: '1.5',
      aggregateParts: '3',
      wastagePercent: '5',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      steelKgPerM3: String(band.typical),
      ratePerM3Inr: '',
    };
  }
  if (element === 'beam') {
    return {
      element,
      length: '4',
      width: '230',
      thickness: '450',
      height: '3',
      lengthUnit: 'm',
      widthUnit: 'mm',
      thicknessUnit: 'mm',
      heightUnit: 'm',
      quantity: '1',
      grade: 'M20',
      cementParts: '1',
      sandParts: '1.5',
      aggregateParts: '3',
      wastagePercent: '5',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      steelKgPerM3: String(band.typical),
      ratePerM3Inr: '',
    };
  }
  if (element === 'column') {
    return {
      element,
      length: '300',
      width: '300',
      thickness: '150',
      height: '3',
      lengthUnit: 'mm',
      widthUnit: 'mm',
      thicknessUnit: 'mm',
      heightUnit: 'm',
      quantity: '4',
      grade: 'M25',
      cementParts: '1',
      sandParts: '1',
      aggregateParts: '2',
      wastagePercent: '5',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      steelKgPerM3: String(band.typical),
      ratePerM3Inr: '',
    };
  }
  return {
    element: 'footing',
    length: '1.5',
    width: '1.5',
    thickness: '300',
    height: '3',
    lengthUnit: 'm',
    widthUnit: 'm',
    thicknessUnit: 'mm',
    heightUnit: 'm',
    quantity: '1',
    grade: 'M20',
    cementParts: '1',
    sandParts: '1.5',
    aggregateParts: '3',
    wastagePercent: '5',
    includeMaterialBreakdown: true,
    includeSteelEstimate: false,
    steelKgPerM3: String(band.typical),
    ratePerM3Inr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'm', label: 'm' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft' },
  { value: 'inch', label: 'inch' },
];

export function RccCalculatorClient({
  defaultElement = 'slab',
  pageTitle,
}: {
  defaultElement?: RccElement;
  pageTitle?: string;
}) {
  const [form, setForm] = useState<FormState>(() => defaultsFor(defaultElement));
  const [result, setResult] = useState<RccCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('RCC estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function changeElement(element: RccElement) {
    setForm(defaultsFor(element));
    setResult(null);
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        element: form.element,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.element === 'column' ? undefined : Number(form.thickness),
        height: form.element === 'column' ? Number(form.height) : undefined,
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        thicknessUnit: form.thicknessUnit,
        heightUnit: form.heightUnit,
        quantity: Number(form.quantity) || 1,
        grade: form.grade,
        cementParts: form.grade === 'custom' ? Number(form.cementParts) : undefined,
        sandParts: form.grade === 'custom' ? Number(form.sandParts) : undefined,
        aggregateParts: form.grade === 'custom' ? Number(form.aggregateParts) : undefined,
        wastagePercent: Number(form.wastagePercent) || 0,
        includeMaterialBreakdown: form.includeMaterialBreakdown,
        includeSteelEstimate: form.includeSteelEstimate,
        steelKgPerM3:
          form.includeSteelEstimate && form.steelKgPerM3.trim() ? Number(form.steelKgPerM3) : null,
        ratePerM3Inr: form.ratePerM3Inr.trim() ? Number(form.ratePerM3Inr) : null,
      };
      const next = calculateRccQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'rcc-calculator',
        methodologyVersionLabel: next.version ?? RCC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/rcc-calculator',
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
    const text = `Varnarc RCC (${result.elementLabel}): wet ${result.wetVolumeM3} m³, order ${result.orderVolumeM3} m³. Preliminary only — reinforcement must follow engineer drawings.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'RCC calculator', text, url: window.location.href });
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
      `Wet concrete,${result.wetVolumeM3},m3`,
      `Order concrete,${result.orderVolumeM3},m3`,
      result.materials ? `Cement,${result.materials.cementBags},bags` : '',
      result.materials ? `Sand,${result.materials.sandM3},m3` : '',
      result.materials ? `Aggregate,${result.materials.aggregateM3},m3` : '',
      result.steel
        ? `Indicative steel (typical preliminary),${result.steel.steelKgTypical},kg`
        : '',
      result.estimatedCostInr != null
        ? `Estimated concrete cost,${result.estimatedCostInr},INR`
        : '',
      `NOTE,"${RCC_STRUCTURAL_DISCLAIMER.replace(/"/g, "'")}",`,
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-rcc-${result.element}-boq.csv`;
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
          name: projectName.trim() || 'RCC estimate',
          areaSqft: Math.max(1, Math.round(result.orderVolumeM3 * 50)),
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

  const lengthLabel =
    form.element === 'column'
      ? 'Breadth (B)'
      : form.element === 'beam'
        ? 'Length (span)'
        : 'Length';
  const widthLabel =
    form.element === 'column' ? 'Depth (D)' : form.element === 'beam' ? 'Width (B)' : 'Width';
  const thicknessLabel =
    form.element === 'footing' ? 'Depth (D)' : form.element === 'beam' ? 'Depth (D)' : 'Thickness';

  const steelBand = RCC_PRELIMINARY_STEEL_KG_PER_M3[form.element];

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={runCalculate}
      onReset={() => {
        setForm(defaultsFor(defaultElement));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate RCC"
    >
      <aside className="sm:col-span-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-bold text-amber-950">Important</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-950/90">
          {RCC_STRUCTURAL_DISCLAIMER}
        </p>
      </aside>

      <UnitSelector
        id="rcc-element"
        label="Structural element"
        value={form.element}
        onChange={(v) => changeElement(v as RccElement)}
        options={(Object.keys(RCC_ELEMENT_LABELS) as RccElement[]).map((k) => ({
          value: k,
          label: RCC_ELEMENT_LABELS[k],
        }))}
        className="sm:col-span-2"
      />

      <CalculatorInput
        id="rcc-l"
        label={lengthLabel}
        type="number"
        min={0.001}
        step="any"
        required
        value={form.length}
        onChange={(e) => setField('length', e.target.value)}
      />
      <CalculatorSelect
        id="rcc-lu"
        label="Unit"
        value={form.lengthUnit}
        onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="rcc-w"
        label={widthLabel}
        type="number"
        min={0.001}
        step="any"
        required
        value={form.width}
        onChange={(e) => setField('width', e.target.value)}
      />
      <CalculatorSelect
        id="rcc-wu"
        label="Unit"
        value={form.widthUnit}
        onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />

      {form.element === 'column' ? (
        <>
          <CalculatorInput
            id="rcc-h"
            label="Height (H)"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.height}
            onChange={(e) => setField('height', e.target.value)}
          />
          <CalculatorSelect
            id="rcc-hu"
            label="Height unit"
            value={form.heightUnit}
            onChange={(e) => setField('heightUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
        </>
      ) : (
        <>
          <CalculatorInput
            id="rcc-t"
            label={thicknessLabel}
            type="number"
            min={0.001}
            step="any"
            required
            value={form.thickness}
            onChange={(e) => setField('thickness', e.target.value)}
          />
          <CalculatorSelect
            id="rcc-tu"
            label="Unit"
            value={form.thicknessUnit}
            onChange={(e) => setField('thicknessUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
        </>
      )}

      <CalculatorInput
        id="rcc-qty"
        label="Quantity (number of elements)"
        type="number"
        min={1}
        step={1}
        value={form.quantity}
        onChange={(e) => setField('quantity', e.target.value)}
      />
      <CalculatorSelect
        id="rcc-grade"
        label="Concrete grade"
        value={form.grade}
        onChange={(e) => setField('grade', e.target.value as RccGrade)}
        options={[
          { value: 'M15', label: 'M15 (1:2:4)' },
          { value: 'M20', label: 'M20 (1:1.5:3)' },
          { value: 'M25', label: 'M25 (1:1:2)' },
          { value: 'M30', label: 'M30 (1:1:1.5 indicative)' },
          { value: 'custom', label: 'Custom mix' },
        ]}
      />

      {form.grade === 'custom' ? (
        <>
          <CalculatorInput
            id="rcc-c"
            label="Cement parts"
            type="number"
            min={0.1}
            value={form.cementParts}
            onChange={(e) => setField('cementParts', e.target.value)}
          />
          <CalculatorInput
            id="rcc-s"
            label="Sand parts"
            type="number"
            min={0.1}
            value={form.sandParts}
            onChange={(e) => setField('sandParts', e.target.value)}
          />
          <CalculatorInput
            id="rcc-a"
            label="Aggregate parts"
            type="number"
            min={0}
            value={form.aggregateParts}
            onChange={(e) => setField('aggregateParts', e.target.value)}
            className="sm:col-span-2"
          />
        </>
      ) : null}

      <CalculatorInput
        id="rcc-waste"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="rcc-rate"
        label="Concrete rate ₹ / m³ (optional)"
        type="number"
        min={1}
        value={form.ratePerM3Inr}
        onChange={(e) => setField('ratePerM3Inr', e.target.value)}
      />

      <UnitSelector
        id="rcc-mats"
        label="Cement / sand / aggregate"
        value={form.includeMaterialBreakdown ? 'yes' : 'no'}
        onChange={(v) => setField('includeMaterialBreakdown', v === 'yes')}
        options={[
          { value: 'yes', label: 'Include (transparent mix)' },
          { value: 'no', label: 'Volume only' },
        ]}
        className="sm:col-span-2"
      />

      <UnitSelector
        id="rcc-steel"
        label="Indicative steel (preliminary)"
        value={form.includeSteelEstimate ? 'yes' : 'no'}
        onChange={(v) => setField('includeSteelEstimate', v === 'yes')}
        options={[
          { value: 'no', label: 'Off (recommended default)' },
          { value: 'yes', label: 'Show thumb-rule range' },
        ]}
        className="sm:col-span-2"
      />
      {form.includeSteelEstimate ? (
        <>
          <p className="sm:col-span-2 text-xs text-slate-600">
            Default for {RCC_ELEMENT_LABELS[form.element]}: {steelBand.min}–{steelBand.max} kg/m³
            (typical {steelBand.typical}). Override typical below. This does not replace structural
            design.
          </p>
          <CalculatorInput
            id="rcc-steel-ratio"
            label="Typical steel kg / m³ (override)"
            type="number"
            min={1}
            value={form.steelKgPerM3}
            onChange={(e) => setField('steelKgPerM3', e.target.value)}
            className="sm:col-span-2"
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
      <aside className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-bold text-amber-950">Structural design note</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-950/90">
          {result.structuralDisclaimer}
        </p>
      </aside>

      <CalculationResult
        label="Order concrete volume"
        value={`${result.orderVolumeM3.toLocaleString('en-IN')} m³`}
        hint={`Wet ${result.wetVolumeM3} m³ + ${result.wastagePercent}% wastage · ${result.elementLabel} × ${result.quantity}. Indicative only.`}
        metrics={[
          {
            id: 'wet',
            label: 'Wet volume',
            value: `${result.wetVolumeM3} m³`,
            hint:
              result.quantity > 1
                ? `${result.wetVolumeOneM3} m³ each × ${result.quantity}`
                : undefined,
          },
          {
            id: 'grade',
            label: 'Grade',
            value: result.grade,
            hint: result.materials?.mixLabel,
          },
          ...(result.materials
            ? [
                {
                  id: 'cement',
                  label: 'Cement',
                  value: `${result.materials.cementBags} bags`,
                  hint: `${result.materials.cementKg} kg`,
                },
                {
                  id: 'sand',
                  label: 'Sand',
                  value: `${result.materials.sandM3} m³`,
                },
                {
                  id: 'agg',
                  label: 'Aggregate',
                  value: `${result.materials.aggregateM3} m³`,
                },
              ]
            : []),
          ...(result.steel
            ? [
                {
                  id: 'steel',
                  label: 'Indicative steel (preliminary)',
                  value: `${result.steel.steelKgMin}–${result.steel.steelKgMax} kg`,
                  hint: `Typical ${result.steel.steelKgTypical} kg (${result.steel.steelTonnesTypical} t) @ ${result.steel.kgPerM3Min}–${result.steel.kgPerM3Max} kg/m³ — not design`,
                },
              ]
            : []),
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'cost',
                  label: 'Estimated concrete cost',
                  value: formatInr(result.estimatedCostInr),
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/construction/slab-calculator" className={cx.secondaryBtn}>
              Slab
            </Link>
            <Link href="/construction/beam-calculator" className={cx.secondaryBtn}>
              Beam
            </Link>
            <Link href="/construction/column-calculator" className={cx.secondaryBtn}>
              Column
            </Link>
            <Link href="/construction/footing-calculator" className={cx.secondaryBtn}>
              Footing
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

  const title = pageTitle ?? 'RCC calculator';

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: title },
        ]}
        title={title}
        description="Preliminary RCC concrete volume for slabs, beams, columns and footings — optional mix materials and labelled steel thumb-rule ranges. Not a substitute for structural design."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              V_wet = geometry × qty · V_order = V_wet × (1 + wastage%) · materials from dry × 1.54
              × mix shares
            </p>
            <p>
              Indicative steel (optional) = V_order × preliminary kg/m³ band for the element. Actual
              reinforcement must follow structural drawings by a qualified engineer.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{RCC_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{RCC_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={RCC_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate RCC', onClick: () => runCalculate() },
          secondary: {
            label: 'Concrete calculator',
            href: '/construction/concrete-calculator',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={RCC_CALC_RELATED} />
      </div>
    </>
  );
}
