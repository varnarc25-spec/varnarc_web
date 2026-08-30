'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PAINT_COVERAGE_M2_PER_L,
  DEFAULT_PAINT_PACKAGE_SIZES_L,
  DEFAULT_PRIMER_COVERAGE_M2_PER_L,
  DEFAULT_PUTTY_KG_PER_M2,
  calculatePaintQuantity,
  type PaintCalcMode,
  type PaintCalculatorResult,
  type PaintScope,
  PAINT_CALC_VERSION,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
  ReverseResultPanel,
  UnitSelector,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
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
  PAINT_CALC_FAQS,
  PAINT_CALC_RELATED,
  PAINT_CALC_SEO,
  PAINT_WORKED_EXAMPLE,
} from './content';

const CALC_TYPE = 'paint_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';
type AreaUnit = 'm2' | 'ft2' | 'yard2';
type CoverageUnit = 'm2_per_l' | 'ft2_per_l';

type RoomForm = {
  id: string;
  name: string;
  length: string;
  width: string;
  height: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  heightUnit: LengthUnit;
  doors: string;
  windows: string;
  includeCeiling: boolean;
};

type FormState = {
  mode: PaintCalcMode;
  scope: PaintScope;
  length: string;
  width: string;
  height: string;
  lengthUnit: LengthUnit;
  widthUnit: LengthUnit;
  heightUnit: LengthUnit;
  doors: string;
  windows: string;
  includeCeiling: boolean;
  wallArea: string;
  wallAreaUnit: AreaUnit;
  ceilingArea: string;
  ceilingAreaUnit: AreaUnit;
  rooms: RoomForm[];
  coats: string;
  coveragePerLitre: string;
  coverageUnit: CoverageUnit;
  includePrimer: boolean;
  primerCoats: string;
  primerCoveragePerLitre: string;
  includePutty: boolean;
  puttyKgPerM2: string;
  wastagePercent: string;
  availableLitres: string;
  packageSizes: string;
  includeCost: boolean;
  paintPricePerLitreInr: string;
  primerPricePerLitreInr: string;
  puttyPricePerKgInr: string;
};

function newRoom(n: number): RoomForm {
  return {
    id: `room-${n}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Room ${n}`,
    length: '4',
    width: '3',
    height: '3',
    lengthUnit: 'm',
    widthUnit: 'm',
    heightUnit: 'm',
    doors: '1',
    windows: '2',
    includeCeiling: false,
  };
}

function defaultForm(): FormState {
  return {
    mode: 'forward',
    scope: 'room',
    length: '4',
    width: '3',
    height: '3',
    lengthUnit: 'm',
    widthUnit: 'm',
    heightUnit: 'm',
    doors: '1',
    windows: '2',
    includeCeiling: false,
    wallArea: '100',
    wallAreaUnit: 'm2',
    ceilingArea: '',
    ceilingAreaUnit: 'm2',
    rooms: [newRoom(1), newRoom(2)],
    coats: '2',
    coveragePerLitre: String(DEFAULT_PAINT_COVERAGE_M2_PER_L),
    coverageUnit: 'm2_per_l',
    includePrimer: false,
    primerCoats: '1',
    primerCoveragePerLitre: String(DEFAULT_PRIMER_COVERAGE_M2_PER_L),
    includePutty: false,
    puttyKgPerM2: String(DEFAULT_PUTTY_KG_PER_M2),
    wastagePercent: '10',
    availableLitres: '20',
    packageSizes: DEFAULT_PAINT_PACKAGE_SIZES_L.join(', '),
    includeCost: false,
    paintPricePerLitreInr: '',
    primerPricePerLitreInr: '',
    puttyPricePerKgInr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'inch', label: 'inch' },
];

function parsePackageSizes(raw: string): number[] {
  const sizes = raw
    .split(/[,/\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return sizes.length ? sizes : [...DEFAULT_PAINT_PACKAGE_SIZES_L];
}

function roomFromShare(raw: unknown, index: number): RoomForm {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = newRoom(index + 1);
  if (typeof r.id === 'string' && r.id) base.id = r.id;
  if (typeof r.name === 'string' && r.name) base.name = r.name;
  if (typeof r.length === 'number') base.length = String(r.length);
  if (typeof r.width === 'number') base.width = String(r.width);
  if (typeof r.height === 'number') base.height = String(r.height);
  if (typeof r.lengthUnit === 'string') base.lengthUnit = r.lengthUnit as LengthUnit;
  if (typeof r.widthUnit === 'string') base.widthUnit = r.widthUnit as LengthUnit;
  if (typeof r.heightUnit === 'string') base.heightUnit = r.heightUnit as LengthUnit;
  if (typeof r.doors === 'number') base.doors = String(r.doors);
  if (typeof r.windows === 'number') base.windows = String(r.windows);
  if (typeof r.includeCeiling === 'boolean') base.includeCeiling = r.includeCeiling;
  return base;
}

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const mode = inputs.mode === 'reverse' ? 'reverse' : 'forward';
  const next = defaultForm();
  next.mode = mode;
  if (
    inputs.scope === 'room' ||
    inputs.scope === 'rooms' ||
    inputs.scope === 'house' ||
    inputs.scope === 'direct_area'
  ) {
    next.scope = inputs.scope;
  }
  const str = (key: keyof FormState, value: unknown) => {
    if (typeof value === 'number' || typeof value === 'string') {
      (next[key] as string) = String(value);
    }
  };
  str('length', inputs.length);
  str('width', inputs.width);
  str('height', inputs.height);
  str('doors', inputs.doors);
  str('windows', inputs.windows);
  str('wallArea', inputs.wallArea);
  str('ceilingArea', inputs.ceilingArea);
  str('coats', inputs.coats);
  str('coveragePerLitre', inputs.coveragePerLitre);
  str('primerCoats', inputs.primerCoats);
  str('primerCoveragePerLitre', inputs.primerCoveragePerLitre);
  str('puttyKgPerM2', inputs.puttyKgPerM2);
  str('wastagePercent', inputs.wastagePercent);
  str('availableLitres', inputs.availableLitres);
  if (typeof inputs.lengthUnit === 'string') next.lengthUnit = inputs.lengthUnit as LengthUnit;
  if (typeof inputs.widthUnit === 'string') next.widthUnit = inputs.widthUnit as LengthUnit;
  if (typeof inputs.heightUnit === 'string') next.heightUnit = inputs.heightUnit as LengthUnit;
  if (typeof inputs.wallAreaUnit === 'string') next.wallAreaUnit = inputs.wallAreaUnit as AreaUnit;
  if (typeof inputs.ceilingAreaUnit === 'string') {
    next.ceilingAreaUnit = inputs.ceilingAreaUnit as AreaUnit;
  }
  if (typeof inputs.coverageUnit === 'string') {
    next.coverageUnit = inputs.coverageUnit as CoverageUnit;
  }
  if (typeof inputs.includeCeiling === 'boolean') next.includeCeiling = inputs.includeCeiling;
  if (typeof inputs.includePrimer === 'boolean') next.includePrimer = inputs.includePrimer;
  if (typeof inputs.includePutty === 'boolean') next.includePutty = inputs.includePutty;
  if (Array.isArray(inputs.rooms) && inputs.rooms.length > 0) {
    next.rooms = inputs.rooms.map((r, i) => roomFromShare(r, i));
  }
  if (Array.isArray(inputs.packageSizesLitres)) {
    const sizes = inputs.packageSizesLitres.filter(
      (n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0,
    );
    if (sizes.length) next.packageSizes = sizes.join(', ');
  }
  if (typeof inputs.paintPricePerLitreInr === 'number') {
    next.paintPricePerLitreInr = String(inputs.paintPricePerLitreInr);
    next.includeCost = true;
  }
  if (typeof inputs.primerPricePerLitreInr === 'number') {
    next.primerPricePerLitreInr = String(inputs.primerPricePerLitreInr);
    next.includeCost = true;
  }
  if (typeof inputs.puttyPricePerKgInr === 'number') {
    next.puttyPricePerKgInr = String(inputs.puttyPricePerKgInr);
    next.includeCost = true;
  }
  return next;
}

function buildPaintPayload(form: FormState) {
  const packages = parsePackageSizes(form.packageSizes);
  const useRooms = form.mode === 'forward' && (form.scope === 'rooms' || form.scope === 'house');
  const useDirect = form.mode === 'forward' && form.scope === 'direct_area';
  const useSingleRoom = form.mode === 'forward' && form.scope === 'room';

  return {
    mode: form.mode,
    scope: form.scope,
    availableLitres: form.mode === 'reverse' ? Number(form.availableLitres) : undefined,
    length: useSingleRoom ? Number(form.length) : undefined,
    width: useSingleRoom ? Number(form.width) : undefined,
    height: useSingleRoom ? Number(form.height) : undefined,
    lengthUnit: form.lengthUnit,
    widthUnit: form.widthUnit,
    heightUnit: form.heightUnit,
    doors: useSingleRoom || useDirect ? Number(form.doors) || 0 : 0,
    windows: useSingleRoom || useDirect ? Number(form.windows) || 0 : 0,
    includeCeiling: useSingleRoom ? form.includeCeiling : false,
    rooms: useRooms
      ? form.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          length: Number(r.length),
          width: Number(r.width),
          height: Number(r.height),
          lengthUnit: r.lengthUnit,
          widthUnit: r.widthUnit,
          heightUnit: r.heightUnit,
          doors: Number(r.doors) || 0,
          windows: Number(r.windows) || 0,
          includeCeiling: r.includeCeiling,
        }))
      : undefined,
    wallArea: useDirect ? Number(form.wallArea) : undefined,
    wallAreaUnit: form.wallAreaUnit,
    ceilingArea: useDirect && form.ceilingArea.trim() ? Number(form.ceilingArea) : null,
    ceilingAreaUnit: form.ceilingAreaUnit,
    coats: Number(form.coats) || 1,
    coveragePerLitre: Number(form.coveragePerLitre) || DEFAULT_PAINT_COVERAGE_M2_PER_L,
    coverageUnit: form.coverageUnit,
    includePrimer: form.mode === 'forward' && form.includePrimer,
    primerCoats: Number(form.primerCoats) || 1,
    primerCoveragePerLitre: Number(form.primerCoveragePerLitre) || DEFAULT_PRIMER_COVERAGE_M2_PER_L,
    includePutty: form.mode === 'forward' && form.includePutty,
    puttyKgPerM2: Number(form.puttyKgPerM2) || DEFAULT_PUTTY_KG_PER_M2,
    wastagePercent: Number(form.wastagePercent) || 0,
    packageSizesLitres: packages,
    paintPricePerLitreInr:
      form.includeCost && form.paintPricePerLitreInr.trim()
        ? Number(form.paintPricePerLitreInr)
        : null,
    primerPricePerLitreInr:
      form.includeCost && form.primerPricePerLitreInr.trim()
        ? Number(form.primerPricePerLitreInr)
        : null,
    puttyPricePerKgInr:
      form.includeCost && form.puttyPricePerKgInr.trim() ? Number(form.puttyPricePerKgInr) : null,
  };
}

export function PaintCalculatorClient({
  initialShareInputs = null,
}: {
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
} = {}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : defaultForm(),
  );
  const [result, setResult] = useState<PaintCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Paint estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const payload = buildPaintPayload(nextForm);
      const next = calculatePaintQuantity(payload);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'paint-calculator',
        methodologyVersionLabel: next.version ?? PAINT_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/paint-calculator',
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
    'paint-calculator',
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
      const payload = buildPaintPayload(form);
      const next = calculatePaintQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'paint-calculator',
        methodologyVersionLabel: next.version ?? PAINT_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/paint-calculator',
      });
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit: form.mode === 'reverse' ? 'm2' : 'L',
        result_range_category:
          form.mode === 'reverse'
            ? next.netPaintableAreaM2 <= 50
              ? 'low'
              : next.netPaintableAreaM2 <= 200
                ? 'mid'
                : 'high'
            : next.paintLitres <= 5
              ? 'low'
              : next.paintLitres <= 40
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
        ? `Varnarc paint reverse: ${result.paintLitres} L covers ≈ ${result.netPaintableAreaM2} m² (${result.netPaintableAreaFt2} ft²) at ${result.coats} coat(s). Indicative only.`
        : `Varnarc paint: ${result.paintLitres} L exact, buy ${result.paintPurchaseLitres} L; net area ${result.netPaintableAreaM2} m². Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Paint calculator', text, url: window.location.href });
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
      `Net paintable area,${result.netPaintableAreaM2},m2`,
      `Paint (exact),${result.paintLitres},L`,
      `Paint (purchase),${result.paintPurchaseLitres},L`,
      ...result.paintPackages.map((p) => `Paint tin ${p.sizeLitres}L,${p.count},tins`),
      result.primerLitres != null ? `Primer (exact),${result.primerLitres},L` : '',
      result.primerPurchaseLitres != null
        ? `Primer (purchase),${result.primerPurchaseLitres},L`
        : '',
      result.puttyKg != null ? `Putty,${result.puttyKg},kg` : '',
      result.estimatedCostInr != null ? `Estimated cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-paint-boq.csv';
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
          name: projectName.trim() || 'Paint estimate',
          areaSqft: Math.max(1, Math.round(result.netPaintableAreaFt2)),
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

  const showRooms = form.mode === 'forward' && (form.scope === 'rooms' || form.scope === 'house');
  const showDirect = form.mode === 'forward' && form.scope === 'direct_area';

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
      submitLabel={form.mode === 'reverse' ? 'Calculate coverable area' : 'Calculate paint'}
    >
      <UnitSelector
        id="paint-mode"
        label="Mode"
        value={form.mode}
        onChange={(v) => setField('mode', v as PaintCalcMode)}
        options={[
          { value: 'forward', label: 'Area → litres' },
          { value: 'reverse', label: 'Litres → area' },
        ]}
        className="sm:col-span-2"
      />

      {form.mode === 'forward' ? (
        <UnitSelector
          id="paint-scope"
          label="Scope"
          value={
            form.scope === 'direct_area'
              ? 'direct_area'
              : form.scope === 'house'
                ? 'house'
                : form.scope === 'rooms'
                  ? 'rooms'
                  : 'room'
          }
          onChange={(v) => setField('scope', v as PaintScope)}
          options={[
            { value: 'room', label: 'Single room' },
            { value: 'rooms', label: 'Room-by-room' },
            { value: 'house', label: 'Whole house' },
            { value: 'direct_area', label: 'Direct wall area' },
          ]}
          className="sm:col-span-2"
        />
      ) : null}

      {form.mode === 'reverse' ? (
        <CalculatorInput
          id="paint-avail"
          label="Available paint (litres)"
          type="number"
          min={0.01}
          step="any"
          required
          value={form.availableLitres}
          onChange={(e) => setField('availableLitres', e.target.value)}
          className="sm:col-span-2"
        />
      ) : null}

      {form.mode === 'forward' && form.scope === 'room' ? (
        <>
          <CalculatorInput
            id="paint-l"
            label="Length"
            type="number"
            min={0.1}
            step="any"
            required
            value={form.length}
            onChange={(e) => setField('length', e.target.value)}
          />
          <CalculatorSelect
            id="paint-lu"
            label="Length unit"
            value={form.lengthUnit}
            onChange={(e) => setField('lengthUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="paint-w"
            label="Width"
            type="number"
            min={0.1}
            step="any"
            required
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
          <CalculatorSelect
            id="paint-wu"
            label="Width unit"
            value={form.widthUnit}
            onChange={(e) => setField('widthUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="paint-h"
            label="Height"
            type="number"
            min={0.1}
            step="any"
            required
            value={form.height}
            onChange={(e) => setField('height', e.target.value)}
          />
          <CalculatorSelect
            id="paint-hu"
            label="Height unit"
            value={form.heightUnit}
            onChange={(e) => setField('heightUnit', e.target.value as LengthUnit)}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="paint-doors"
            label="Doors"
            type="number"
            min={0}
            step={1}
            value={form.doors}
            onChange={(e) => setField('doors', e.target.value)}
          />
          <CalculatorInput
            id="paint-windows"
            label="Windows"
            type="number"
            min={0}
            step={1}
            value={form.windows}
            onChange={(e) => setField('windows', e.target.value)}
          />
          <UnitSelector
            id="paint-ceiling"
            label="Include ceiling"
            value={form.includeCeiling ? 'yes' : 'no'}
            onChange={(v) => setField('includeCeiling', v === 'yes')}
            options={[
              { value: 'no', label: 'Walls only' },
              { value: 'yes', label: 'Walls + ceiling' },
            ]}
            className="sm:col-span-2"
          />
        </>
      ) : null}

      {showRooms ? (
        <div className="sm:col-span-2 space-y-4">
          <p className="text-xs text-slate-500">
            {form.scope === 'house'
              ? 'Add every room in the house. Totals sum wall (and optional ceiling) areas after door/window deductions.'
              : 'Add rooms one by one. Each room can include its own ceiling and openings.'}
          </p>
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
                  min={0.1}
                  step="any"
                  value={room.length}
                  onChange={(e) => updateRoom(room.id, { length: e.target.value })}
                />
                <CalculatorSelect
                  id={`${room.id}-lu`}
                  label="Unit"
                  value={room.lengthUnit}
                  onChange={(e) =>
                    updateRoom(room.id, {
                      lengthUnit: e.target.value as LengthUnit,
                      widthUnit: e.target.value as LengthUnit,
                      heightUnit: e.target.value as LengthUnit,
                    })
                  }
                  options={LENGTH_OPTS}
                />
                <CalculatorInput
                  id={`${room.id}-w`}
                  label="Width"
                  type="number"
                  min={0.1}
                  step="any"
                  value={room.width}
                  onChange={(e) => updateRoom(room.id, { width: e.target.value })}
                />
                <CalculatorInput
                  id={`${room.id}-h`}
                  label="Height"
                  type="number"
                  min={0.1}
                  step="any"
                  value={room.height}
                  onChange={(e) => updateRoom(room.id, { height: e.target.value })}
                />
                <CalculatorInput
                  id={`${room.id}-d`}
                  label="Doors"
                  type="number"
                  min={0}
                  value={room.doors}
                  onChange={(e) => updateRoom(room.id, { doors: e.target.value })}
                />
                <CalculatorInput
                  id={`${room.id}-win`}
                  label="Windows"
                  type="number"
                  min={0}
                  value={room.windows}
                  onChange={(e) => updateRoom(room.id, { windows: e.target.value })}
                />
                <UnitSelector
                  id={`${room.id}-ceil`}
                  label="Ceiling"
                  value={room.includeCeiling ? 'yes' : 'no'}
                  onChange={(v) => updateRoom(room.id, { includeCeiling: v === 'yes' })}
                  options={[
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' },
                  ]}
                  className="sm:col-span-2"
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
      ) : null}

      {showDirect ? (
        <>
          <CalculatorInput
            id="paint-wall-area"
            label="Wall area"
            type="number"
            min={0.1}
            step="any"
            required
            value={form.wallArea}
            onChange={(e) => setField('wallArea', e.target.value)}
          />
          <CalculatorSelect
            id="paint-wall-unit"
            label="Area unit"
            value={form.wallAreaUnit}
            onChange={(e) => setField('wallAreaUnit', e.target.value as AreaUnit)}
            options={[
              { value: 'm2', label: 'm²' },
              { value: 'ft2', label: 'ft²' },
              { value: 'yard2', label: 'sq yard' },
            ]}
          />
          <CalculatorInput
            id="paint-ceil-area"
            label="Ceiling area (optional)"
            type="number"
            min={0}
            step="any"
            value={form.ceilingArea}
            onChange={(e) => setField('ceilingArea', e.target.value)}
          />
          <CalculatorSelect
            id="paint-ceil-unit"
            label="Ceiling unit"
            value={form.ceilingAreaUnit}
            onChange={(e) => setField('ceilingAreaUnit', e.target.value as AreaUnit)}
            options={[
              { value: 'm2', label: 'm²' },
              { value: 'ft2', label: 'ft²' },
              { value: 'yard2', label: 'sq yard' },
            ]}
          />
          <CalculatorInput
            id="paint-doors-da"
            label="Doors to deduct"
            type="number"
            min={0}
            value={form.doors}
            onChange={(e) => setField('doors', e.target.value)}
          />
          <CalculatorInput
            id="paint-windows-da"
            label="Windows to deduct"
            type="number"
            min={0}
            value={form.windows}
            onChange={(e) => setField('windows', e.target.value)}
          />
        </>
      ) : null}

      <CalculatorInput
        id="paint-coats"
        label="Number of coats"
        type="number"
        min={1}
        max={10}
        step={1}
        required
        value={form.coats}
        onChange={(e) => setField('coats', e.target.value)}
      />
      <CalculatorInput
        id="paint-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <CalculatorInput
        id="paint-coverage"
        label="Paint coverage / litre"
        type="number"
        min={0.1}
        step="any"
        required
        value={form.coveragePerLitre}
        onChange={(e) => setField('coveragePerLitre', e.target.value)}
        hint={`Override manufacturer value (default ${DEFAULT_PAINT_COVERAGE_M2_PER_L} m²/L)`}
      />
      <CalculatorSelect
        id="paint-coverage-unit"
        label="Coverage unit"
        value={form.coverageUnit}
        onChange={(e) => setField('coverageUnit', e.target.value as CoverageUnit)}
        options={[
          { value: 'm2_per_l', label: 'm² per litre' },
          { value: 'ft2_per_l', label: 'ft² per litre' },
        ]}
      />

      {form.mode === 'forward' ? (
        <>
          <UnitSelector
            id="paint-primer"
            label="Primer"
            value={form.includePrimer ? 'yes' : 'no'}
            onChange={(v) => setField('includePrimer', v === 'yes')}
            options={[
              { value: 'no', label: 'Skip' },
              { value: 'yes', label: 'Include' },
            ]}
          />
          <UnitSelector
            id="paint-putty"
            label="Putty"
            value={form.includePutty ? 'yes' : 'no'}
            onChange={(v) => setField('includePutty', v === 'yes')}
            options={[
              { value: 'no', label: 'Skip' },
              { value: 'yes', label: 'Include' },
            ]}
          />
          {form.includePrimer ? (
            <>
              <CalculatorInput
                id="paint-primer-coats"
                label="Primer coats"
                type="number"
                min={1}
                max={5}
                value={form.primerCoats}
                onChange={(e) => setField('primerCoats', e.target.value)}
              />
              <CalculatorInput
                id="paint-primer-cov"
                label="Primer coverage (m²/L)"
                type="number"
                min={0.1}
                value={form.primerCoveragePerLitre}
                onChange={(e) => setField('primerCoveragePerLitre', e.target.value)}
              />
            </>
          ) : null}
          {form.includePutty ? (
            <CalculatorInput
              id="paint-putty-rate"
              label="Putty kg / m²"
              type="number"
              min={0.1}
              step="any"
              value={form.puttyKgPerM2}
              onChange={(e) => setField('puttyKgPerM2', e.target.value)}
              className="sm:col-span-2"
              hint={`Default ${DEFAULT_PUTTY_KG_PER_M2} kg/m²`}
            />
          ) : null}
          <CalculatorInput
            id="paint-packs"
            label="Package sizes (litres)"
            value={form.packageSizes}
            onChange={(e) => setField('packageSizes', e.target.value)}
            className="sm:col-span-2"
            hint="Comma-separated, e.g. 1, 4, 10, 20"
          />
          <UnitSelector
            id="paint-cost"
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
                id="paint-price"
                label="Paint ₹ / litre"
                type="number"
                min={1}
                value={form.paintPricePerLitreInr}
                onChange={(e) => setField('paintPricePerLitreInr', e.target.value)}
              />
              <CalculatorInput
                id="primer-price"
                label="Primer ₹ / litre"
                type="number"
                min={1}
                value={form.primerPricePerLitreInr}
                onChange={(e) => setField('primerPricePerLitreInr', e.target.value)}
              />
              <CalculatorInput
                id="putty-price"
                label="Putty ₹ / kg"
                type="number"
                min={1}
                value={form.puttyPricePerKgInr}
                onChange={(e) => setField('puttyPricePerKgInr', e.target.value)}
                className="sm:col-span-2"
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
        label={result.mode === 'reverse' ? 'Coverable area' : 'Paint required'}
        value={
          result.mode === 'reverse'
            ? `${result.netPaintableAreaM2.toLocaleString('en-IN')} m²`
            : `${result.paintLitres.toLocaleString('en-IN')} L`
        }
        hint={
          result.mode === 'reverse'
            ? `${result.netPaintableAreaFt2} ft² at ${result.coats} coat(s) · coverage ${result.coverageM2PerLitre} m²/L. Indicative only.`
            : `Buy ${result.paintPurchaseLitres} L in tins · net ${result.netPaintableAreaM2} m². Indicative only.`
        }
        metrics={[
          ...(result.mode === 'forward'
            ? [
                {
                  id: 'area',
                  label: 'Net paintable area',
                  value: `${result.netPaintableAreaM2} m²`,
                  hint: `${result.netPaintableAreaFt2} ft² · openings ${result.openingM2} m²`,
                },
                {
                  id: 'buy',
                  label: 'Recommended purchase',
                  value: `${result.paintPurchaseLitres} L`,
                  hint: result.paintPackages.map((p) => `${p.count}×${p.sizeLitres} L`).join(' + '),
                },
              ]
            : [
                {
                  id: 'one-coat',
                  label: 'One-coat equivalent',
                  value: `${result.reverseAreaOneCoatM2} m²`,
                },
              ]),
          ...(result.primerLitres != null
            ? [
                {
                  id: 'primer',
                  label: 'Primer',
                  value: `${result.primerLitres} L`,
                  hint:
                    result.primerPurchaseLitres != null
                      ? `Buy ${result.primerPurchaseLitres} L`
                      : undefined,
                },
              ]
            : []),
          ...(result.puttyKg != null
            ? [
                {
                  id: 'putty',
                  label: 'Putty',
                  value: `${result.puttyKg} kg`,
                },
              ]
            : []),
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
            <Link href="/construction/materials?search=paint" className={cx.secondaryBtn}>
              Paint materials
            </Link>
            <Link href="/construction/plaster-calculator" className={cx.secondaryBtn}>
              Related: plaster
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
                  {room.netPaintableM2} m²
                  {room.ceilingM2 > 0 ? ` (ceil ${room.ceilingM2})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </aside>
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
          { label: 'Paint calculator' },
        ]}
        title="Paint calculator"
        description="Estimate paint litres from rooms or wall area — with doors, windows, ceiling, coats, overridable manufacturer coverage, primer, putty, tin sizes and reverse coverage mode."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              A_net = 2(L+W)H − doors×A_d − windows×A_w [+ L×W] · paint_L = A_net × coats / coverage
              × (1+w%)
            </p>
            <p>
              Reverse: A_net = (litres × coverage / coats) / (1+w%). Coverage defaults to{' '}
              {DEFAULT_PAINT_COVERAGE_M2_PER_L} m²/L — always override to the manufacturer value on
              the tin.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{PAINT_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{PAINT_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={PAINT_CALC_FAQS}
        stickyCta={{
          primary: {
            label: form.mode === 'reverse' ? 'Calculate area' : 'Calculate paint',
            onClick: () => runCalculate(),
          },
          secondary: {
            label: 'Paint materials',
            href: '/construction/materials?search=paint',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={PAINT_CALC_RELATED} />
      </div>
    </>
  );
}
