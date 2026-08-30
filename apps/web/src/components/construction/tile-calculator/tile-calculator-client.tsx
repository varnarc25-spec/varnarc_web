'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateTileQuantity,
  type TileCalcMode,
  type TileCalculatorResult,
  type TileSurface,
  TILE_CALC_VERSION,
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
import { TILE_CALC_FAQS, TILE_CALC_RELATED, TILE_CALC_SEO, TILE_WORKED_EXAMPLE } from './content';
import { TileGridDiagram } from './tile-grid-diagram';

const CALC_TYPE = 'tile_calculator';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  mode: TileCalcMode;
  surface: TileSurface;
  roomLength: string;
  roomWidth: string;
  roomLengthUnit: LengthUnit;
  roomWidthUnit: LengthUnit;
  tileLength: string;
  tileWidth: string;
  tileLengthUnit: LengthUnit;
  tileWidthUnit: LengthUnit;
  groutWidth: string;
  groutWidthUnit: LengthUnit;
  wastagePercent: string;
  numberOfRooms: string;
  tilesPerBox: string;
  availableTiles: string;
  includeCost: boolean;
  priceMode: 'tile' | 'box';
  pricePerTileInr: string;
  pricePerBoxInr: string;
};

function defaultForm(): FormState {
  return {
    mode: 'forward',
    surface: 'floor',
    roomLength: '3',
    roomWidth: '3',
    roomLengthUnit: 'm',
    roomWidthUnit: 'm',
    tileLength: '600',
    tileWidth: '600',
    tileLengthUnit: 'mm',
    tileWidthUnit: 'mm',
    groutWidth: '2',
    groutWidthUnit: 'mm',
    wastagePercent: '10',
    numberOfRooms: '1',
    tilesPerBox: '4',
    availableTiles: '100',
    includeCost: false,
    priceMode: 'box',
    pricePerTileInr: '',
    pricePerBoxInr: '',
  };
}

const LENGTH_OPTS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'inch', label: 'inch' },
  { value: 'ft', label: 'ft' },
];

function formFromShareInputs(inputs: Record<string, unknown>): FormState {
  const next = defaultForm();
  if (inputs.mode === 'forward' || inputs.mode === 'reverse') next.mode = inputs.mode;
  if (inputs.surface === 'floor' || inputs.surface === 'wall') next.surface = inputs.surface;
  if (typeof inputs.roomLength === 'number') next.roomLength = String(inputs.roomLength);
  if (typeof inputs.roomWidth === 'number') next.roomWidth = String(inputs.roomWidth);
  if (typeof inputs.tileLength === 'number') next.tileLength = String(inputs.tileLength);
  if (typeof inputs.tileWidth === 'number') next.tileWidth = String(inputs.tileWidth);
  if (typeof inputs.groutWidth === 'number') next.groutWidth = String(inputs.groutWidth);
  if (typeof inputs.wastagePercent === 'number') {
    next.wastagePercent = String(inputs.wastagePercent);
  }
  if (typeof inputs.numberOfRooms === 'number') {
    next.numberOfRooms = String(inputs.numberOfRooms);
  }
  if (typeof inputs.tilesPerBox === 'number') next.tilesPerBox = String(inputs.tilesPerBox);
  if (typeof inputs.availableTiles === 'number') {
    next.availableTiles = String(inputs.availableTiles);
  }
  if (typeof inputs.pricePerTileInr === 'number') {
    next.pricePerTileInr = String(inputs.pricePerTileInr);
    next.includeCost = true;
    next.priceMode = 'tile';
  }
  if (typeof inputs.pricePerBoxInr === 'number') {
    next.pricePerBoxInr = String(inputs.pricePerBoxInr);
    next.includeCost = true;
    next.priceMode = 'box';
  }
  if (typeof inputs.roomLengthUnit === 'string') {
    next.roomLengthUnit = inputs.roomLengthUnit as LengthUnit;
  }
  if (typeof inputs.roomWidthUnit === 'string') {
    next.roomWidthUnit = inputs.roomWidthUnit as LengthUnit;
  }
  if (typeof inputs.tileLengthUnit === 'string') {
    next.tileLengthUnit = inputs.tileLengthUnit as LengthUnit;
  }
  if (typeof inputs.tileWidthUnit === 'string') {
    next.tileWidthUnit = inputs.tileWidthUnit as LengthUnit;
  }
  if (typeof inputs.groutWidthUnit === 'string') {
    next.groutWidthUnit = inputs.groutWidthUnit as LengthUnit;
  }
  return next;
}

function buildTilePayload(form: FormState) {
  return {
    mode: form.mode,
    surface: form.surface,
    roomLength: form.mode === 'forward' ? Number(form.roomLength) : undefined,
    roomWidth: form.mode === 'forward' ? Number(form.roomWidth) : undefined,
    roomLengthUnit: form.roomLengthUnit,
    roomWidthUnit: form.roomWidthUnit,
    tileLength: Number(form.tileLength),
    tileWidth: Number(form.tileWidth),
    tileLengthUnit: form.tileLengthUnit,
    tileWidthUnit: form.tileWidthUnit,
    groutWidth: form.groutWidth.trim() ? Number(form.groutWidth) : null,
    groutWidthUnit: form.groutWidthUnit,
    wastagePercent: Number(form.wastagePercent) || 0,
    numberOfRooms: Number(form.numberOfRooms) || 1,
    tilesPerBox: form.tilesPerBox.trim() ? Number(form.tilesPerBox) : null,
    availableTiles: form.mode === 'reverse' ? Number(form.availableTiles) : undefined,
    pricePerTileInr:
      form.includeCost && form.priceMode === 'tile' && form.pricePerTileInr.trim()
        ? Number(form.pricePerTileInr)
        : null,
    pricePerBoxInr:
      form.includeCost && form.priceMode === 'box' && form.pricePerBoxInr.trim()
        ? Number(form.pricePerBoxInr)
        : null,
  };
}

export function TileCalculatorClient({
  initialShareInputs = null,
}: {
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
} = {}) {
  const [form, setForm] = useState<FormState>(() =>
    initialShareInputs ? formFromShareInputs(initialShareInputs) : defaultForm(),
  );
  const [result, setResult] = useState<TileCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Tile estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const nextForm = formFromShareInputs(inputs);
      setForm(nextForm);
      const payload = buildTilePayload(nextForm);
      const next = calculateTileQuantity(payload);
      setResult(next);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'tile-calculator',
        methodologyVersionLabel: next.version ?? TILE_CALC_VERSION,
        inputs: { ...nextForm },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/tile-calculator',
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
    'tile-calculator',
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

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = buildTilePayload(form);
      const next = calculateTileQuantity(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'tile-calculator',
        methodologyVersionLabel: next.version ?? TILE_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/tile-calculator',
      });
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit: form.mode === 'reverse' ? 'm2' : 'tiles',
        result_range_category:
          form.mode === 'reverse'
            ? (next.coverableAreaM2 ?? 0) <= 20
              ? 'low'
              : (next.coverableAreaM2 ?? 0) <= 100
                ? 'mid'
                : 'high'
            : next.totalTiles <= 50
              ? 'low'
              : next.totalTiles <= 500
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
        ? `Varnarc tiles: ${result.totalTiles} tiles cover ≈ ${result.coverableAreaM2} m². Indicative only.`
        : `Varnarc tiles: buy ${result.totalTiles} (${result.baseTiles} + ${result.wastageTiles} wastage)${result.boxesNeeded != null ? ` ≈ ${result.boxesNeeded} boxes` : ''}. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Tile calculator', text, url: window.location.href });
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
      `Surface area,${result.surfaceAreaM2},m2`,
      `Tile area,${result.tileAreaM2},m2`,
      `Base tiles,${result.baseTiles},pcs`,
      `Wastage tiles,${result.wastageTiles},pcs`,
      `Total tiles,${result.totalTiles},pcs`,
      result.boxesNeeded != null ? `Boxes,${result.boxesNeeded},boxes` : '',
      result.estimatedCostInr != null ? `Estimated cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-tile-boq.csv';
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
          name: projectName.trim() || 'Tile estimate',
          areaSqft: Math.max(1, Math.round(result.surfaceAreaFt2)),
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

  const lengthLabel = form.surface === 'wall' ? 'Wall length' : 'Room length';
  const widthLabel = form.surface === 'wall' ? 'Wall height' : 'Room width';
  const roomsLabel = form.surface === 'wall' ? 'Number of walls / rooms' : 'Number of rooms';

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
      submitLabel={form.mode === 'reverse' ? 'Calculate coverable area' : 'Calculate tiles'}
    >
      <UnitSelector
        id="tile-mode"
        label="Mode"
        value={form.mode}
        onChange={(v) => setField('mode', v as TileCalcMode)}
        options={[
          { value: 'forward', label: 'Area → tiles' },
          { value: 'reverse', label: 'Tiles → area' },
        ]}
        className="sm:col-span-2"
      />

      <UnitSelector
        id="tile-surface"
        label="Surface"
        value={form.surface}
        onChange={(v) => setField('surface', v as TileSurface)}
        options={[
          { value: 'floor', label: 'Floor tiles' },
          { value: 'wall', label: 'Wall tiles' },
        ]}
        className="sm:col-span-2"
      />

      {form.mode === 'reverse' ? (
        <CalculatorInput
          id="tile-available"
          label="Available tiles"
          type="number"
          min={1}
          step={1}
          required
          value={form.availableTiles}
          onChange={(e) => setField('availableTiles', e.target.value)}
          className="sm:col-span-2"
        />
      ) : (
        <>
          <CalculatorInput
            id="tile-room-l"
            label={lengthLabel}
            type="number"
            min={0.01}
            step="any"
            required
            value={form.roomLength}
            onChange={(e) => setField('roomLength', e.target.value)}
          />
          <CalculatorSelect
            id="tile-room-lu"
            label="Unit"
            value={form.roomLengthUnit}
            onChange={(e) => {
              const u = e.target.value as LengthUnit;
              setField('roomLengthUnit', u);
              setField('roomWidthUnit', u);
            }}
            options={LENGTH_OPTS}
          />
          <CalculatorInput
            id="tile-room-w"
            label={widthLabel}
            type="number"
            min={0.01}
            step="any"
            required
            value={form.roomWidth}
            onChange={(e) => setField('roomWidth', e.target.value)}
          />
          <CalculatorInput
            id="tile-rooms"
            label={roomsLabel}
            type="number"
            min={1}
            max={200}
            step={1}
            value={form.numberOfRooms}
            onChange={(e) => setField('numberOfRooms', e.target.value)}
          />
        </>
      )}

      <CalculatorInput
        id="tile-tl"
        label="Tile length"
        type="number"
        min={0.01}
        step="any"
        required
        value={form.tileLength}
        onChange={(e) => setField('tileLength', e.target.value)}
      />
      <CalculatorSelect
        id="tile-tlu"
        label="Tile unit"
        value={form.tileLengthUnit}
        onChange={(e) => {
          const u = e.target.value as LengthUnit;
          setField('tileLengthUnit', u);
          setField('tileWidthUnit', u);
        }}
        options={LENGTH_OPTS}
      />
      <CalculatorInput
        id="tile-tw"
        label="Tile width"
        type="number"
        min={0.01}
        step="any"
        required
        value={form.tileWidth}
        onChange={(e) => setField('tileWidth', e.target.value)}
      />
      <CalculatorInput
        id="tile-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />

      <CalculatorInput
        id="tile-grout"
        label="Grout width (optional)"
        type="number"
        min={0}
        step="any"
        value={form.groutWidth}
        onChange={(e) => setField('groutWidth', e.target.value)}
        hint="Leave blank for no joint"
      />
      <CalculatorSelect
        id="tile-grout-u"
        label="Grout unit"
        value={form.groutWidthUnit}
        onChange={(e) => setField('groutWidthUnit', e.target.value as LengthUnit)}
        options={LENGTH_OPTS}
      />

      {form.mode === 'forward' ? (
        <CalculatorInput
          id="tile-per-box"
          label="Tiles per box (optional)"
          type="number"
          min={1}
          step={1}
          value={form.tilesPerBox}
          onChange={(e) => setField('tilesPerBox', e.target.value)}
          className="sm:col-span-2"
        />
      ) : null}

      {form.mode === 'forward' ? (
        <>
          <UnitSelector
            id="tile-cost"
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
              <UnitSelector
                id="tile-price-mode"
                label="Price basis"
                value={form.priceMode}
                onChange={(v) => setField('priceMode', v as 'tile' | 'box')}
                options={[
                  { value: 'box', label: '₹ / box' },
                  { value: 'tile', label: '₹ / tile' },
                ]}
                className="sm:col-span-2"
              />
              {form.priceMode === 'box' ? (
                <CalculatorInput
                  id="tile-box-price"
                  label="Price per box (₹)"
                  type="number"
                  min={1}
                  value={form.pricePerBoxInr}
                  onChange={(e) => setField('pricePerBoxInr', e.target.value)}
                  className="sm:col-span-2"
                  hint="Requires tiles per box"
                />
              ) : (
                <CalculatorInput
                  id="tile-piece-price"
                  label="Price per tile (₹)"
                  type="number"
                  min={1}
                  value={form.pricePerTileInr}
                  onChange={(e) => setField('pricePerTileInr', e.target.value)}
                  className="sm:col-span-2"
                />
              )}
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
        label={result.mode === 'reverse' ? 'Coverable area' : 'Tiles to purchase'}
        value={
          result.mode === 'reverse'
            ? `${result.coverableAreaM2?.toLocaleString('en-IN')} m²`
            : String(result.totalTiles)
        }
        hint={
          result.mode === 'reverse'
            ? `${result.coverableAreaFt2} ft² after ${result.wastagePercent}% wastage. Indicative only.`
            : `${result.baseTiles} base + ${result.wastageTiles} wastage · ${result.surfaceAreaM2} m² ${result.surface}. Indicative only.`
        }
        metrics={[
          {
            id: 'area',
            label: result.surface === 'wall' ? 'Wall area' : 'Floor area',
            value: `${result.surfaceAreaM2} m²`,
            hint: `${result.surfaceAreaFt2} ft²`,
          },
          {
            id: 'tile-area',
            label: 'Individual tile area',
            value: `${result.tileAreaCm2} cm²`,
            hint: `${result.tileAreaM2} m²`,
          },
          ...(result.mode === 'forward'
            ? [
                {
                  id: 'base',
                  label: 'Base tile quantity',
                  value: String(result.baseTiles),
                },
                {
                  id: 'waste',
                  label: 'Wastage quantity',
                  value: String(result.wastageTiles),
                  hint: `${result.wastagePercent}%`,
                },
              ]
            : []),
          ...(result.boxesNeeded != null
            ? [
                {
                  id: 'boxes',
                  label: 'Boxes to buy',
                  value: String(result.boxesNeeded),
                  hint: result.tilesPerBox != null ? `${result.tilesPerBox} tiles/box` : undefined,
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
            <Link href="/construction/flooring-calculator" className={cx.secondaryBtn}>
              Flooring calculator
            </Link>
            <Link href="/construction/materials?search=tile" className={cx.secondaryBtn}>
              Tile materials
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

      {result.reverseDisplay ? <ReverseResultPanel display={result.reverseDisplay} /> : null}

      {result.grid ? <TileGridDiagram grid={result.grid} surface={result.surface} /> : null}

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
          { label: 'Tile calculator' },
        ]}
        title="Tile calculator"
        description="Estimate floor or wall tiles from room size and tile size — optional grout, wastage, boxes, cost, visual grid layout and reverse coverage from a tile count."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              tiles = ceil(L / (tile_L + grout)) × ceil(W / (tile_W + grout)) × rooms · total = base
              + ceil(base × wastage%)
            </p>
            <p>
              Reverse: coverable area = (tiles ÷ (1 + wastage%)) × tile face area. Use wall mode
              with length × height for wall tiles.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{TILE_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{TILE_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={TILE_CALC_FAQS}
        stickyCta={{
          primary: {
            label: form.mode === 'reverse' ? 'Calculate area' : 'Calculate tiles',
            onClick: () => runCalculate(),
          },
          secondary: { label: 'Flooring calculator', href: '/construction/flooring-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={TILE_CALC_RELATED} />
      </div>
    </>
  );
}
