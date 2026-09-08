'use client';

import { useState } from 'react';
import {
  ADVANCED_CALC_VERSION,
  calculateExcavation,
  calculateFalseCeiling,
  calculateRoofing,
  calculateStaircase,
  calculateWallArea,
  calculateWaterTank,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { cx } from '@/components/construction/styles';
import { trackCalculatorCompleted, trackCalculatorError } from '@/lib/construction/analytics';
import { publishConstructionCalculationSave } from '@/lib/construction/save-calculation/publish';
import { ADVANCED_CALC_FAQS, ADVANCED_CALC_RELATED } from './content';

const UNIT_OPTIONS = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
];

type ToolId = 'false-ceiling' | 'staircase' | 'water-tank' | 'roofing' | 'wall-area' | 'excavation';

const META: Record<
  ToolId,
  { slug: string; title: string; description: string; lastUpdated: string }
> = {
  'false-ceiling': {
    slug: 'false-ceiling-calculator',
    title: 'False Ceiling Calculator',
    description: 'Calculate gypsum/POP ceiling material and area.',
    lastUpdated: '8 Sep 2026',
  },
  staircase: {
    slug: 'staircase-calculator',
    title: 'Staircase Calculator',
    description: 'Estimate staircase geometry and basic quantities for planning.',
    lastUpdated: '8 Sep 2026',
  },
  'water-tank': {
    slug: 'water-tank-calculator',
    title: 'Water Tank Calculator',
    description: 'Calculate tank capacity from dimensions.',
    lastUpdated: '8 Sep 2026',
  },
  roofing: {
    slug: 'roofing-calculator',
    title: 'Roofing Calculator',
    description: 'Estimate roof area and roofing materials.',
    lastUpdated: '8 Sep 2026',
  },
  'wall-area': {
    slug: 'wall-area-calculator',
    title: 'Wall Area Calculator',
    description: 'Calculate paint/tile/plaster surface area.',
    lastUpdated: '8 Sep 2026',
  },
  excavation: {
    slug: 'excavation-calculator',
    title: 'Excavation Calculator',
    description: 'Estimate excavation volume.',
    lastUpdated: '8 Sep 2026',
  },
};

type FormState = Record<string, string>;

function defaults(tool: ToolId): FormState {
  if (tool === 'false-ceiling') {
    return {
      length: '4',
      width: '3',
      lengthUnit: 'm',
      widthUnit: 'm',
      openingAreaM2: '0',
      wastagePercent: '8',
    };
  }
  if (tool === 'staircase') {
    return {
      floorHeight: '3',
      riserHeight: '0.175',
      treadDepth: '0.28',
      stairWidth: '1',
      waistThickness: '0.15',
      dimensionUnit: 'm',
    };
  }
  if (tool === 'water-tank') {
    return {
      shape: 'rectangular',
      length: '2',
      width: '1.5',
      height: '1.2',
      diameter: '2',
      dimensionUnit: 'm',
      freeboardPercent: '0',
    };
  }
  if (tool === 'roofing') {
    return {
      planLength: '10',
      planWidth: '8',
      dimensionUnit: 'm',
      pitchDegrees: '15',
      wastagePercent: '10',
      sheetLengthM: '3',
      sheetWidthM: '1',
      overlapPercent: '12',
    };
  }
  if (tool === 'wall-area') {
    return {
      wallLength: '5',
      wallHeight: '3',
      wallCount: '4',
      dimensionUnit: 'm',
      openingWidth: '1',
      openingHeight: '2.1',
      openingCount: '2',
      openingUnit: 'm',
    };
  }
  return {
    length: '10',
    width: '4',
    depth: '1.5',
    dimensionUnit: 'm',
    bulkingPercent: '20',
  };
}

type ResultView = {
  label: string;
  value: string;
  unit: string;
  hint: string;
  metrics: Array<{ label: string; value: string }>;
  formula: string;
  assumptions: string[];
  disclaimer: string;
  outputs: Record<string, unknown>;
};

export function AdvancedPlanningCalculatorClient({ tool }: { tool: ToolId }) {
  const meta = META[tool];
  const [form, setForm] = useState<FormState>(() => defaults(tool));
  const [result, setResult] = useState<ResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const n = (key: string) => Number(form[key]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const next = run(tool, form, n);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: meta.slug,
        methodologyVersionLabel: ADVANCED_CALC_VERSION,
        inputs: { ...form },
        outputs: next.outputs,
        assumptions: next.assumptions,
        sourcePath: `/construction/${meta.slug}`,
      });
      trackCalculatorCompleted({
        calculator_type: meta.slug.replace(/-/g, '_'),
        logged_in: false,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Calculation failed');
      trackCalculatorError({
        calculator_type: meta.slug.replace(/-/g, '_'),
        error_code: 'calc_failed',
        logged_in: false,
      });
    }
  }

  return (
    <CalculatorShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: meta.title },
      ]}
      title={meta.title}
      description={meta.description}
      lastUpdated={meta.lastUpdated}
      form={
        <CalculatorForm
          calculatorType={meta.slug.replace(/-/g, '_')}
          onSubmit={onSubmit}
          onReset={() => {
            setForm(defaults(tool));
            setResult(null);
            setError(null);
          }}
        >
          <ToolFields tool={tool} form={form} setForm={setForm} />
          {error ? <p className={cx.error}>{error}</p> : null}
        </CalculatorForm>
      }
      result={
        result ? (
          <CalculationResult
            label={result.label}
            value={result.value}
            unit={result.unit}
            hint={result.disclaimer}
            metrics={result.metrics}
          />
        ) : null
      }
      methodology={
        result ? (
          <MethodologyPanel formula={result.formula} steps={result.assumptions} />
        ) : (
          <MethodologyPanel
            formula="Enter dimensions and calculate for the planning formula."
            steps={['Indicative quantities only. Confirm with drawings and suppliers.']}
          />
        )
      }
      faqs={(ADVANCED_CALC_FAQS[meta.slug] ?? []).map((f, i) => ({
        id: `${meta.slug}-${i}`,
        question: f.question,
        answer: f.answer,
      }))}
      relatedTools={ADVANCED_CALC_RELATED[meta.slug] ?? []}
    />
  );
}

function run(tool: ToolId, form: FormState, n: (k: string) => number): ResultView {
  if (tool === 'false-ceiling') {
    const r = calculateFalseCeiling({
      length: n('length'),
      width: n('width'),
      lengthUnit: form.lengthUnit as 'm',
      widthUnit: form.widthUnit as 'm',
      openingAreaM2: n('openingAreaM2') || 0,
      wastagePercent: n('wastagePercent') || 0,
    });
    return {
      label: 'Boards required',
      value: String(r.boardsRequired),
      unit: 'boards',
      hint: r.disclaimer,
      metrics: [
        { label: 'Net area', value: `${r.netAreaM2} m²` },
        { label: 'Gross area', value: `${r.grossAreaM2} m²` },
        { label: 'Perimeter', value: `${r.perimeterM} m` },
      ],
      formula: r.formula,
      assumptions: r.assumptions,
      disclaimer: r.disclaimer,
      outputs: { boards: r.boardsRequired, netAreaM2: r.netAreaM2 },
    };
  }
  if (tool === 'staircase') {
    const r = calculateStaircase({
      floorHeight: n('floorHeight'),
      riserHeight: n('riserHeight'),
      treadDepth: n('treadDepth'),
      stairWidth: n('stairWidth'),
      waistThickness: n('waistThickness'),
      dimensionUnit: form.dimensionUnit as 'm',
    });
    return {
      label: 'Risers',
      value: String(r.risers),
      unit: 'nos',
      hint: r.disclaimer,
      metrics: [
        { label: 'Treads', value: String(r.treads) },
        { label: 'Actual riser', value: `${r.actualRiserM} m` },
        { label: 'Going', value: `${r.goingM} m` },
        { label: 'Indicative waist volume', value: `${r.indicativeWaistVolumeM3} m³` },
      ],
      formula: r.formula,
      assumptions: r.assumptions,
      disclaimer: r.disclaimer,
      outputs: { risers: r.risers, volumeM3: r.indicativeWaistVolumeM3 },
    };
  }
  if (tool === 'water-tank') {
    const r = calculateWaterTank({
      shape: form.shape as 'rectangular' | 'circular',
      length: n('length'),
      width: n('width'),
      height: n('height'),
      diameter: n('diameter'),
      dimensionUnit: form.dimensionUnit as 'm',
      freeboardPercent: n('freeboardPercent') || 0,
    });
    return {
      label: 'Capacity',
      value: String(r.capacityLitres),
      unit: 'litres',
      hint: r.disclaimer,
      metrics: [
        { label: 'Geometric volume', value: `${r.volumeM3} m³` },
        { label: 'Usable volume', value: `${r.usableVolumeM3} m³` },
      ],
      formula: r.formula,
      assumptions: r.assumptions,
      disclaimer: r.disclaimer,
      outputs: { litres: r.capacityLitres, volumeM3: r.usableVolumeM3 },
    };
  }
  if (tool === 'roofing') {
    const r = calculateRoofing({
      planLength: n('planLength'),
      planWidth: n('planWidth'),
      dimensionUnit: form.dimensionUnit as 'm',
      pitchDegrees: n('pitchDegrees'),
      wastagePercent: n('wastagePercent'),
      sheetLengthM: n('sheetLengthM'),
      sheetWidthM: n('sheetWidthM'),
      overlapPercent: n('overlapPercent'),
    });
    return {
      label: 'Sheets required',
      value: String(r.sheetsRequired),
      unit: 'sheets',
      hint: r.disclaimer,
      metrics: [
        { label: 'Plan area', value: `${r.planAreaM2} m²` },
        { label: 'Roof area', value: `${r.roofAreaM2} m²` },
        { label: 'Slope factor', value: String(r.slopeFactor) },
      ],
      formula: r.formula,
      assumptions: r.assumptions,
      disclaimer: r.disclaimer,
      outputs: { sheets: r.sheetsRequired, roofAreaM2: r.roofAreaM2 },
    };
  }
  if (tool === 'wall-area') {
    const r = calculateWallArea({
      wallLength: n('wallLength'),
      wallHeight: n('wallHeight'),
      wallCount: Math.round(n('wallCount')),
      dimensionUnit: form.dimensionUnit as 'm',
      openingWidth: n('openingWidth') || 0,
      openingHeight: n('openingHeight') || 0,
      openingCount: Math.round(n('openingCount') || 0),
      openingUnit: form.openingUnit as 'm',
    });
    return {
      label: 'Net wall area',
      value: String(r.netAreaM2),
      unit: 'm²',
      hint: r.disclaimer,
      metrics: [
        { label: 'Gross area', value: `${r.grossAreaM2} m²` },
        { label: 'Openings', value: `${r.openingAreaM2} m²` },
        { label: 'Net area', value: `${r.netAreaSqft} sq ft` },
      ],
      formula: r.formula,
      assumptions: r.assumptions,
      disclaimer: r.disclaimer,
      outputs: { netAreaM2: r.netAreaM2 },
    };
  }
  const r = calculateExcavation({
    length: n('length'),
    width: n('width'),
    depth: n('depth'),
    dimensionUnit: form.dimensionUnit as 'm',
    bulkingPercent: n('bulkingPercent') || 0,
  });
  return {
    label: 'In-situ volume',
    value: String(r.inSituVolumeM3),
    unit: 'm³',
    hint: r.disclaimer,
    metrics: [
      { label: 'Loose volume', value: `${r.looseVolumeM3} m³` },
      { label: 'In-situ', value: `${r.inSituVolumeM3} m³` },
    ],
    formula: r.formula,
    assumptions: r.assumptions,
    disclaimer: r.disclaimer,
    outputs: { volumeM3: r.inSituVolumeM3, looseVolumeM3: r.looseVolumeM3 },
  };
}

function ToolFields({
  tool,
  form,
  setForm,
}: {
  tool: ToolId;
  form: FormState;
  setForm: (next: FormState | ((p: FormState) => FormState)) => void;
}) {
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  if (tool === 'false-ceiling') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <CalculatorInput
          id="length"
          label="Length"
          value={form.length}
          onChange={(e) => set('length', e.target.value)}
          required
        />
        <CalculatorSelect
          id="lengthUnit"
          label="Length unit"
          options={UNIT_OPTIONS}
          value={form.lengthUnit}
          onChange={(e) => set('lengthUnit', e.target.value)}
        />
        <CalculatorInput
          id="width"
          label="Width"
          value={form.width}
          onChange={(e) => set('width', e.target.value)}
          required
        />
        <CalculatorSelect
          id="widthUnit"
          label="Width unit"
          options={UNIT_OPTIONS}
          value={form.widthUnit}
          onChange={(e) => set('widthUnit', e.target.value)}
        />
        <CalculatorInput
          id="openingAreaM2"
          label="Openings (m²)"
          value={form.openingAreaM2}
          onChange={(e) => set('openingAreaM2', e.target.value)}
        />
        <CalculatorInput
          id="wastagePercent"
          label="Wastage %"
          value={form.wastagePercent}
          onChange={(e) => set('wastagePercent', e.target.value)}
        />
      </div>
    );
  }
  if (tool === 'staircase') {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Planning and geometry only. Structural design, loads and reinforcement must be verified by
          a qualified engineer.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <CalculatorInput
            id="floorHeight"
            label="Floor-to-floor height"
            value={form.floorHeight}
            onChange={(e) => set('floorHeight', e.target.value)}
            required
          />
          <CalculatorSelect
            id="dimensionUnit"
            label="Dimension unit"
            options={UNIT_OPTIONS}
            value={form.dimensionUnit}
            onChange={(e) => set('dimensionUnit', e.target.value)}
          />
          <CalculatorInput
            id="riserHeight"
            label="Target riser"
            value={form.riserHeight}
            onChange={(e) => set('riserHeight', e.target.value)}
            required
          />
          <CalculatorInput
            id="treadDepth"
            label="Tread depth"
            value={form.treadDepth}
            onChange={(e) => set('treadDepth', e.target.value)}
            required
          />
          <CalculatorInput
            id="stairWidth"
            label="Stair width"
            value={form.stairWidth}
            onChange={(e) => set('stairWidth', e.target.value)}
            required
          />
          <CalculatorInput
            id="waistThickness"
            label="Waist thickness (planning)"
            value={form.waistThickness}
            onChange={(e) => set('waistThickness', e.target.value)}
          />
        </div>
      </div>
    );
  }
  if (tool === 'water-tank') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <CalculatorSelect
          id="shape"
          label="Shape"
          options={[
            { value: 'rectangular', label: 'Rectangular' },
            { value: 'circular', label: 'Circular' },
          ]}
          value={form.shape}
          onChange={(e) => set('shape', e.target.value)}
        />
        <CalculatorSelect
          id="dimensionUnit"
          label="Dimension unit"
          options={UNIT_OPTIONS}
          value={form.dimensionUnit}
          onChange={(e) => set('dimensionUnit', e.target.value)}
        />
        {form.shape === 'circular' ? (
          <CalculatorInput
            id="diameter"
            label="Diameter"
            value={form.diameter}
            onChange={(e) => set('diameter', e.target.value)}
            required
          />
        ) : (
          <>
            <CalculatorInput
              id="length"
              label="Length"
              value={form.length}
              onChange={(e) => set('length', e.target.value)}
              required
            />
            <CalculatorInput
              id="width"
              label="Width"
              value={form.width}
              onChange={(e) => set('width', e.target.value)}
              required
            />
          </>
        )}
        <CalculatorInput
          id="height"
          label="Height / depth"
          value={form.height}
          onChange={(e) => set('height', e.target.value)}
          required
        />
        <CalculatorInput
          id="freeboardPercent"
          label="Freeboard %"
          value={form.freeboardPercent}
          onChange={(e) => set('freeboardPercent', e.target.value)}
        />
      </div>
    );
  }
  if (tool === 'roofing') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <CalculatorInput
          id="planLength"
          label="Plan length"
          value={form.planLength}
          onChange={(e) => set('planLength', e.target.value)}
          required
        />
        <CalculatorInput
          id="planWidth"
          label="Plan width"
          value={form.planWidth}
          onChange={(e) => set('planWidth', e.target.value)}
          required
        />
        <CalculatorSelect
          id="dimensionUnit"
          label="Dimension unit"
          options={UNIT_OPTIONS}
          value={form.dimensionUnit}
          onChange={(e) => set('dimensionUnit', e.target.value)}
        />
        <CalculatorInput
          id="pitchDegrees"
          label="Pitch (degrees)"
          value={form.pitchDegrees}
          onChange={(e) => set('pitchDegrees', e.target.value)}
        />
        <CalculatorInput
          id="sheetLengthM"
          label="Sheet length (m)"
          value={form.sheetLengthM}
          onChange={(e) => set('sheetLengthM', e.target.value)}
        />
        <CalculatorInput
          id="sheetWidthM"
          label="Sheet width (m)"
          value={form.sheetWidthM}
          onChange={(e) => set('sheetWidthM', e.target.value)}
        />
        <CalculatorInput
          id="overlapPercent"
          label="Overlap %"
          value={form.overlapPercent}
          onChange={(e) => set('overlapPercent', e.target.value)}
        />
        <CalculatorInput
          id="wastagePercent"
          label="Wastage %"
          value={form.wastagePercent}
          onChange={(e) => set('wastagePercent', e.target.value)}
        />
      </div>
    );
  }
  if (tool === 'wall-area') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <CalculatorInput
          id="wallLength"
          label="Wall length"
          value={form.wallLength}
          onChange={(e) => set('wallLength', e.target.value)}
          required
        />
        <CalculatorInput
          id="wallHeight"
          label="Wall height"
          value={form.wallHeight}
          onChange={(e) => set('wallHeight', e.target.value)}
          required
        />
        <CalculatorInput
          id="wallCount"
          label="Number of walls"
          value={form.wallCount}
          onChange={(e) => set('wallCount', e.target.value)}
          required
        />
        <CalculatorSelect
          id="dimensionUnit"
          label="Wall unit"
          options={UNIT_OPTIONS}
          value={form.dimensionUnit}
          onChange={(e) => set('dimensionUnit', e.target.value)}
        />
        <CalculatorInput
          id="openingWidth"
          label="Opening width"
          value={form.openingWidth}
          onChange={(e) => set('openingWidth', e.target.value)}
        />
        <CalculatorInput
          id="openingHeight"
          label="Opening height"
          value={form.openingHeight}
          onChange={(e) => set('openingHeight', e.target.value)}
        />
        <CalculatorInput
          id="openingCount"
          label="Opening count"
          value={form.openingCount}
          onChange={(e) => set('openingCount', e.target.value)}
        />
        <CalculatorSelect
          id="openingUnit"
          label="Opening unit"
          options={UNIT_OPTIONS}
          value={form.openingUnit}
          onChange={(e) => set('openingUnit', e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CalculatorInput
        id="length"
        label="Length"
        value={form.length}
        onChange={(e) => set('length', e.target.value)}
        required
      />
      <CalculatorInput
        id="width"
        label="Width"
        value={form.width}
        onChange={(e) => set('width', e.target.value)}
        required
      />
      <CalculatorInput
        id="depth"
        label="Depth"
        value={form.depth}
        onChange={(e) => set('depth', e.target.value)}
        required
      />
      <CalculatorSelect
        id="dimensionUnit"
        label="Dimension unit"
        options={UNIT_OPTIONS}
        value={form.dimensionUnit}
        onChange={(e) => set('dimensionUnit', e.target.value)}
      />
      <CalculatorInput
        id="bulkingPercent"
        label="Bulking %"
        hint="Planning allowance for loose soil"
        value={form.bulkingPercent}
        onChange={(e) => set('bulkingPercent', e.target.value)}
      />
    </div>
  );
}
