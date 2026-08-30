'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  FLOORING_DEFAULT_WASTAGE,
  FLOORING_TYPE_LABELS,
  calculateFlooringQuantity,
  type FlooringCalculatorResult,
  type FlooringMaterialUnit,
  type FlooringType,
  FLOORING_CALC_VERSION,
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
  FLOORING_CALC_FAQS,
  FLOORING_CALC_RELATED,
  FLOORING_CALC_SEO,
  FLOORING_WORKED_EXAMPLE,
} from './content';

const CALC_TYPE = 'flooring_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type RoomForm = {
  id: string;
  name: string;
  length: string;
  width: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
};

type FormState = {
  flooringType: FlooringType;
  customTypeLabel: string;
  inputMode: 'rooms' | 'single';
  rooms: RoomForm[];
  length: string;
  width: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  numberOfRooms: string;
  wastagePercent: string;
  materialUnit: FlooringMaterialUnit;
  coveragePerBox: string;
  coveragePerBoxUnit: 'm2' | 'ft2' | 'yard2';
  rateInr: string;
};

function newRoom(n: number): RoomForm {
  return {
    id: `room-${n}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Room ${n}`,
    length: '4',
    width: '3',
    lengthUnit: 'm',
    widthUnit: 'm',
  };
}

function defaultForm(): FormState {
  return {
    flooringType: 'tiles',
    customTypeLabel: '',
    inputMode: 'rooms',
    rooms: [newRoom(1), newRoom(2)],
    length: '5',
    width: '4',
    lengthUnit: 'm',
    widthUnit: 'm',
    numberOfRooms: '1',
    wastagePercent: String(FLOORING_DEFAULT_WASTAGE.tiles),
    materialUnit: 'm2',
    coveragePerBox: '1.5',
    coveragePerBoxUnit: 'm2',
    rateInr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'inch', label: 'inch' },
];

export function FlooringCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<FlooringCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Flooring estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function changeType(type: FlooringType) {
    setForm((prev) => ({
      ...prev,
      flooringType: type,
      wastagePercent: String(FLOORING_DEFAULT_WASTAGE[type]),
    }));
    setResult(null);
  }

  function updateRoom(id: string, patch: Partial<RoomForm>) {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        flooringType: form.flooringType,
        customTypeLabel:
          form.flooringType === 'other' && form.customTypeLabel.trim()
            ? form.customTypeLabel.trim()
            : null,
        rooms:
          form.inputMode === 'rooms'
            ? form.rooms.map((r) => ({
                id: r.id,
                name: r.name,
                length: Number(r.length),
                width: Number(r.width),
                lengthUnit: r.lengthUnit,
                widthUnit: r.widthUnit,
              }))
            : undefined,
        length: form.inputMode === 'single' ? Number(form.length) : undefined,
        width: form.inputMode === 'single' ? Number(form.width) : undefined,
        lengthUnit: form.lengthUnit,
        widthUnit: form.widthUnit,
        numberOfRooms: form.inputMode === 'single' ? Number(form.numberOfRooms) || 1 : 1,
        wastagePercent: Number(form.wastagePercent) || 0,
        materialUnit: form.materialUnit,
        coveragePerBox:
          form.materialUnit === 'box' && form.coveragePerBox.trim()
            ? Number(form.coveragePerBox)
            : null,
        coveragePerBoxUnit: form.coveragePerBoxUnit,
        rateInr: form.rateInr.trim() ? Number(form.rateInr) : null,
      };
      const next = calculateFlooringQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'flooring-calculator',
        methodologyVersionLabel: next.version ?? FLOORING_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/flooring-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: next.materialUnit,
        result_range_category:
          next.purchaseAreaM2 <= 20 ? 'low' : next.purchaseAreaM2 <= 100 ? 'mid' : 'high',
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
    const text = `Varnarc flooring (${result.flooringTypeLabel}): net ${result.netFloorAreaM2} m², buy ${result.purchaseAreaM2} m² → ${result.materialQuantity} ${result.materialUnitLabel}. Indicative only — not a product recommendation.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Flooring calculator',
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
      `Net floor area,${result.netFloorAreaM2},m2`,
      `Purchase area,${result.purchaseAreaM2},m2`,
      `Material (${result.flooringTypeLabel}),${result.materialQuantity},${result.materialUnit}`,
      ...result.rooms.map((r) => `${r.name},${r.areaM2},m2`),
      result.estimatedCostInr != null ? `Estimated cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-flooring-boq.csv';
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
          name: projectName.trim() || 'Flooring estimate',
          areaSqft: Math.max(1, Math.round(result.netFloorAreaFt2)),
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
        setForm(defaultForm());
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel="Calculate flooring"
    >
      <CalculatorSelect
        id="floor-type"
        label="Flooring type"
        value={form.flooringType}
        onChange={(e) => changeType(e.target.value as FlooringType)}
        options={(Object.keys(FLOORING_TYPE_LABELS) as FlooringType[]).map((k) => ({
          value: k,
          label: FLOORING_TYPE_LABELS[k],
        }))}
        className="sm:col-span-2"
        hint="Category for wastage defaults only — not a product pick"
      />
      {form.flooringType === 'other' ? (
        <CalculatorInput
          id="floor-custom"
          label="Custom type label"
          value={form.customTypeLabel}
          onChange={(e) => setField('customTypeLabel', e.target.value)}
          className="sm:col-span-2"
          hint="Optional name for your material (no brands required)"
        />
      ) : null}

      <UnitSelector
        id="floor-input-mode"
        label="Room input"
        value={form.inputMode}
        onChange={(v) => setField('inputMode', v as 'rooms' | 'single')}
        options={[
          { value: 'rooms', label: 'Multiple rooms' },
          { value: 'single', label: 'Single size × count' },
        ]}
        className="sm:col-span-2"
      />

      {form.inputMode === 'rooms' ? (
        <div className="sm:col-span-2 space-y-4">
          {form.rooms.map((room, idx) => (
            <fieldset key={room.id} className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <legend className="px-1 text-sm font-semibold text-[#0b1f3a]">
                {room.name || `Room ${idx + 1}`}
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <CalculatorInput
                  id={`${room.id}-name`}
                  label="Name"
                  value={room.name}
                  onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                  className="sm:col-span-2"
                />
                <CalculatorInput
                  id={`${room.id}-l`}
                  label="Length"
                  type="number"
                  min={0.01}
                  step="any"
                  value={room.length}
                  onChange={(e) => updateRoom(room.id, { length: e.target.value })}
                />
                <CalculatorSelect
                  id={`${room.id}-lu`}
                  label="Unit"
                  value={room.lengthUnit}
                  onChange={(e) => {
                    const u = e.target.value as LengthUnit;
                    updateRoom(room.id, { lengthUnit: u, widthUnit: u });
                  }}
                  options={LENGTH_OPTS}
                />
                <CalculatorInput
                  id={`${room.id}-w`}
                  label="Width"
                  type="number"
                  min={0.01}
                  step="any"
                  value={room.width}
                  onChange={(e) => updateRoom(room.id, { width: e.target.value })}
                />
              </div>
              {form.rooms.length > 1 ? (
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-red-600"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      rooms: prev.rooms.filter((r) => r.id !== room.id),
                    }))
                  }
                >
                  Remove room
                </button>
              ) : null}
            </fieldset>
          ))}
          <button
            type="button"
            className={cx.secondaryBtn}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                rooms: [...prev.rooms, newRoom(prev.rooms.length + 1)],
              }))
            }
          >
            Add room
          </button>
        </div>
      ) : (
        <>
          <CalculatorInput
            id="floor-l"
            label="Length"
            type="number"
            min={0.01}
            step="any"
            required
            value={form.length}
            onChange={(e) => setField('length', e.target.value)}
          />
          <CalculatorSelect
            id="floor-lu"
            label="Unit"
            value={form.lengthUnit}
            onChange={(e) => {
              const u = e.target.value as LengthUnit;
              setField('lengthUnit', u);
              setField('widthUnit', u);
            }}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="floor-w"
            label="Width"
            type="number"
            min={0.01}
            step="any"
            required
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
          <CalculatorInput
            id="floor-count"
            label="Number of rooms"
            type="number"
            min={1}
            max={200}
            value={form.numberOfRooms}
            onChange={(e) => setField('numberOfRooms', e.target.value)}
          />
        </>
      )}

      <CalculatorInput
        id="floor-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
        hint={`Suggested for ${FLOORING_TYPE_LABELS[form.flooringType]}: ${FLOORING_DEFAULT_WASTAGE[form.flooringType]}%`}
      />
      <CalculatorSelect
        id="floor-unit"
        label="Material unit"
        value={form.materialUnit}
        onChange={(e) => setField('materialUnit', e.target.value as FlooringMaterialUnit)}
        options={[
          { value: 'm2', label: 'm²' },
          { value: 'ft2', label: 'ft²' },
          { value: 'yard2', label: 'sq yard' },
          { value: 'box', label: 'Box' },
        ]}
      />

      {form.materialUnit === 'box' ? (
        <>
          <CalculatorInput
            id="floor-box-cov"
            label="Coverage per box"
            type="number"
            min={0.01}
            step="any"
            required
            value={form.coveragePerBox}
            onChange={(e) => setField('coveragePerBox', e.target.value)}
          />
          <CalculatorSelect
            id="floor-box-cov-u"
            label="Coverage unit"
            value={form.coveragePerBoxUnit}
            onChange={(e) =>
              setField('coveragePerBoxUnit', e.target.value as FormState['coveragePerBoxUnit'])
            }
            options={[
              { value: 'm2', label: 'm²' },
              { value: 'ft2', label: 'ft²' },
              { value: 'yard2', label: 'sq yard' },
            ]}
          />
        </>
      ) : null}

      <CalculatorInput
        id="floor-rate"
        label={`Rate ₹ / ${form.materialUnit === 'box' ? 'box' : form.materialUnit === 'ft2' ? 'ft²' : form.materialUnit === 'yard2' ? 'sq yd' : 'm²'} (optional)`}
        type="number"
        min={1}
        value={form.rateInr}
        onChange={(e) => setField('rateInr', e.target.value)}
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
        label="Purchase area"
        value={`${result.purchaseAreaM2.toLocaleString('en-IN')} m²`}
        hint={`Net ${result.netFloorAreaM2} m² + ${result.wastagePercent}% wastage. ${result.flooringTypeLabel} — indicative only.`}
        metrics={[
          {
            id: 'net',
            label: 'Net floor area',
            value: `${result.netFloorAreaM2} m²`,
            hint: `${result.netFloorAreaFt2} ft²`,
          },
          {
            id: 'qty',
            label: 'Material quantity',
            value: `${result.materialQuantity} ${result.materialUnitLabel}`,
          },
          {
            id: 'waste',
            label: 'Wastage area',
            value: `${result.wastageAreaM2} m²`,
          },
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'cost',
                  label: 'Estimated cost',
                  value: formatInr(result.estimatedCostInr),
                  hint:
                    result.rateInr != null
                      ? `₹${result.rateInr} / ${result.materialUnitLabel}`
                      : undefined,
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/construction/compare" className={cx.primaryBtn}>
              Compare flooring materials
            </Link>
            <Link href="/construction/tile-calculator" className={cx.secondaryBtn}>
              Tile piece calculator
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

      {result.rooms.length > 0 ? (
        <aside className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Room breakdown</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {result.rooms.map((room) => (
              <li key={room.id} className="flex flex-wrap justify-between gap-2">
                <span className="font-medium text-[#0b1f3a]">{room.name}</span>
                <span className="tabular-nums">
                  {room.areaM2} m² ({room.areaFt2} ft²)
                </span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <aside className={cn(cx.card, 'border-[#f97316]/30 bg-orange-50/40 p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Compare flooring options</h3>
        <p className="mt-2 text-sm text-slate-600">
          This tool estimates quantity and cost from your inputs. It does not recommend brands or
          products. Use Compare to review materials side by side on attributes you choose.
        </p>
        <Link href="/construction/compare" className={cn(cx.primaryBtn, 'mt-3 inline-flex')}>
          Open material comparison
        </Link>
      </aside>

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
          { label: 'Flooring calculator' },
        ]}
        title="Flooring calculator"
        description="Estimate net and purchase floor area for tiles, marble, granite, wood/laminate, vinyl or custom types — with multi-room rows, wastage, units and rates. No product endorsements."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              A_net = Σ(L × W) · A_buy = A_net × (1 + wastage%) · qty = convert(A_buy) · cost = qty
              × rate
            </p>
            <p>
              Flooring type only sets a suggested wastage default. Compare materials separately —
              this calculator does not endorse products.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{FLOORING_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{FLOORING_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={FLOORING_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate flooring', onClick: () => runCalculate() },
          secondary: { label: 'Compare materials', href: '/construction/compare' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={FLOORING_CALC_RELATED} />
      </div>
    </>
  );
}
