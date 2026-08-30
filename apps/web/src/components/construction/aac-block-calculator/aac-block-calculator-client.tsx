'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculateAacBlockQuantity,
  listAacBlockPresets,
  type AacBlockPreset,
  type AacCalcMode,
  type AacCalculatorResult,
  AAC_CALC_VERSION,
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
import { MasonryWallDiagram } from '@/components/construction/calculator/masonry-wall-diagram';
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
import { AAC_CALC_FAQS, AAC_CALC_RELATED, AAC_CALC_SEO, AAC_WORKED_EXAMPLE } from './content';

const CALC_TYPE = 'aac_block_calculator';
const COMPARE_AAC_BRICK = '/construction/compare?hint=aac,brick';

const LENGTH_UNITS = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'inch', label: 'inch' },
  { value: 'ft', label: 'ft' },
];

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft';

type FormState = {
  mode: AacCalcMode;
  wallLength: string;
  wallHeight: string;
  wallThickness: string;
  wallLengthUnit: LengthUnit;
  wallHeightUnit: LengthUnit;
  wallThicknessUnit: LengthUnit;
  openingMode: 'area' | 'count';
  openingArea: string;
  openingAreaUnit: 'm2' | 'ft2';
  openingCount: string;
  openingWidth: string;
  openingHeight: string;
  openingWidthUnit: LengthUnit;
  openingHeightUnit: LengthUnit;
  blockPreset: AacBlockPreset;
  blockLength: string;
  blockWidth: string;
  blockHeight: string;
  blockSizeUnit: LengthUnit;
  jointThickness: string;
  jointThicknessUnit: LengthUnit;
  wastagePercent: string;
  pricePerBlockInr: string;
  availableBlocks: string;
  includeAdhesiveEstimate: boolean;
};

function defaultForm(mode: AacCalcMode = 'forward'): FormState {
  return {
    mode,
    wallLength: '10',
    wallHeight: '3',
    wallThickness: '200',
    wallLengthUnit: 'm',
    wallHeightUnit: 'm',
    wallThicknessUnit: 'mm',
    openingMode: 'area',
    openingArea: '4',
    openingAreaUnit: 'm2',
    openingCount: '2',
    openingWidth: '1',
    openingHeight: '2.1',
    openingWidthUnit: 'm',
    openingHeightUnit: 'm',
    blockPreset: 'aac_600x200x200',
    blockLength: '600',
    blockWidth: '200',
    blockHeight: '200',
    blockSizeUnit: 'mm',
    jointThickness: '3',
    jointThicknessUnit: 'mm',
    wastagePercent: '5',
    pricePerBlockInr: '',
    availableBlocks: '500',
    includeAdhesiveEstimate: true,
  };
}

export function AacBlockCalculatorClient() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<AacCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('AAC block estimate');
  const [saveLoading, setSaveLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const blockOptions = useMemo(() => listAacBlockPresets(), []);

  const openingRatioPreview = useMemo(() => {
    const L = Number(form.wallLength) || 0;
    const H = Number(form.wallHeight) || 0;
    const gross = L * H;
    if (gross <= 0) return 0;
    if (form.openingMode === 'area') {
      return Math.min(0.7, (Number(form.openingArea) || 0) / gross);
    }
    const count = Number(form.openingCount) || 0;
    const ow = Number(form.openingWidth) || 0;
    const oh = Number(form.openingHeight) || 0;
    return Math.min(0.7, (count * ow * oh) / gross);
  }, [form]);

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        mode: form.mode,
        wallLength: form.mode === 'forward' ? Number(form.wallLength) : undefined,
        wallHeight: form.mode === 'forward' ? Number(form.wallHeight) : undefined,
        wallThickness: Number(form.wallThickness),
        wallLengthUnit: form.wallLengthUnit,
        wallHeightUnit: form.wallHeightUnit,
        wallThicknessUnit: form.wallThicknessUnit,
        openingArea:
          form.mode === 'forward' && form.openingMode === 'area'
            ? Number(form.openingArea) || 0
            : null,
        openingAreaUnit: form.openingAreaUnit,
        openingCount:
          form.mode === 'forward' && form.openingMode === 'count'
            ? Number(form.openingCount) || 0
            : null,
        openingWidth:
          form.mode === 'forward' && form.openingMode === 'count'
            ? Number(form.openingWidth)
            : null,
        openingHeight:
          form.mode === 'forward' && form.openingMode === 'count'
            ? Number(form.openingHeight)
            : null,
        openingWidthUnit: form.openingWidthUnit,
        openingHeightUnit: form.openingHeightUnit,
        blockPreset: form.blockPreset,
        blockLength: form.blockPreset === 'custom' ? Number(form.blockLength) : undefined,
        blockWidth: form.blockPreset === 'custom' ? Number(form.blockWidth) : undefined,
        blockHeight: form.blockPreset === 'custom' ? Number(form.blockHeight) : undefined,
        blockSizeUnit: form.blockSizeUnit,
        jointThickness: Number(form.jointThickness) || 0,
        jointThicknessUnit: form.jointThicknessUnit,
        wastagePercent: Number(form.wastagePercent) || 0,
        pricePerBlockInr: form.pricePerBlockInr.trim() ? Number(form.pricePerBlockInr) : null,
        availableBlocks: form.mode === 'reverse' ? Number(form.availableBlocks) : undefined,
        includeAdhesiveEstimate: form.mode === 'forward' && form.includeAdhesiveEstimate,
      };
      const next = calculateAacBlockQuantity(
        payload as Parameters<typeof calculateAacBlockQuantity>[0],
      );
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'aac-block-calculator',
        methodologyVersionLabel: next.version ?? AAC_CALC_VERSION,
        inputs: { ...form },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/aac-block-calculator',
      });
      trackCalculatorModeCompleted({
        mode: form.mode,
        calculator_type: CALC_TYPE,
        unit: form.mode === 'reverse' ? 'm2' : 'blocks',
        result_range_category:
          form.mode === 'reverse'
            ? (next.buildableAreaM2 ?? 0) <= 20
              ? 'low'
              : (next.buildableAreaM2 ?? 0) <= 100
                ? 'mid'
                : 'high'
            : next.blocksRequired <= 500
              ? 'low'
              : next.blocksRequired <= 5000
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
        ? `Varnarc AAC reverse: ${result.blocksRequired} blocks → ≈ ${result.buildableAreaM2} m². Indicative only.`
        : `Varnarc AAC estimate: ${result.blocksRequired} blocks for ${result.netWallAreaM2} m² net wall. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AAC block calculator', text, url: window.location.href });
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
      `AAC blocks,${result.blocksRequired},nos`,
      result.netWallAreaM2 != null ? `Net wall area,${result.netWallAreaM2},m2` : '',
      result.netWallVolumeM3 != null ? `Material volume,${result.netWallVolumeM3},m3` : '',
      result.buildableAreaM2 != null ? `Buildable area,${result.buildableAreaM2},m2` : '',
      result.adhesive ? `Adhesive,${result.adhesive.adhesiveKg},kg` : '',
      result.adhesive ? `Adhesive bags,${result.adhesive.adhesiveBags},bags` : '',
      result.estimatedCostInr != null ? `Estimated AAC cost,${result.estimatedCostInr},INR` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varnarc-aac-boq-${result.mode}.csv`;
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
          name: projectName.trim() || 'AAC block estimate',
          areaSqft: Math.max(
            1,
            Math.round((result.netWallAreaM2 ?? result.buildableAreaM2 ?? 1) * 10.764),
          ),
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
        setForm(defaultForm('forward'));
        setResult(null);
        setError(null);
        setActionMsg(null);
        clearConstructionCalculationSave();
      }}
      submitLabel={form.mode === 'reverse' ? 'Calculate coverage' : 'Calculate AAC blocks'}
    >
      <UnitSelector
        id="aac-mode"
        label="Mode"
        value={form.mode}
        onChange={(v) => {
          setField('mode', v as AacCalcMode);
          setResult(null);
        }}
        options={[
          { value: 'forward', label: 'Wall → blocks' },
          { value: 'reverse', label: 'Blocks → wall area' },
        ]}
        className="sm:col-span-2"
      />

      {form.mode === 'forward' ? (
        <div className="sm:col-span-2">
          <MasonryWallDiagram
            openingRatio={openingRatioPreview}
            caption="AAC wall · openings deducted"
          />
        </div>
      ) : null}

      {form.mode === 'forward' ? (
        <>
          <CalculatorInput
            id="aac-length"
            label="Wall length"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.wallLength}
            onChange={(e) => setField('wallLength', e.target.value)}
          />
          <CalculatorSelect
            id="aac-length-unit"
            label="Length unit"
            value={form.wallLengthUnit}
            onChange={(e) => setField('wallLengthUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
          <CalculatorInput
            id="aac-height"
            label="Wall height"
            type="number"
            min={0.001}
            step="any"
            required
            value={form.wallHeight}
            onChange={(e) => setField('wallHeight', e.target.value)}
          />
          <CalculatorSelect
            id="aac-height-unit"
            label="Height unit"
            value={form.wallHeightUnit}
            onChange={(e) => setField('wallHeightUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : (
        <CalculatorInput
          id="aac-available"
          label="I have this many AAC blocks"
          type="number"
          min={1}
          required
          value={form.availableBlocks}
          onChange={(e) => setField('availableBlocks', e.target.value)}
          className="sm:col-span-2"
        />
      )}

      <CalculatorInput
        id="aac-thickness"
        label="Wall thickness"
        type="number"
        min={0.001}
        step="any"
        required
        value={form.wallThickness}
        onChange={(e) => setField('wallThickness', e.target.value)}
      />
      <CalculatorSelect
        id="aac-thickness-unit"
        label="Thickness unit"
        value={form.wallThicknessUnit}
        onChange={(e) => setField('wallThicknessUnit', e.target.value as LengthUnit)}
        options={LENGTH_UNITS}
      />

      {form.mode === 'forward' ? (
        <>
          <UnitSelector
            id="aac-opening-mode"
            label="Openings"
            value={form.openingMode}
            onChange={(v) => setField('openingMode', v as 'area' | 'count')}
            options={[
              { value: 'area', label: 'Total area' },
              { value: 'count', label: 'Count × size' },
            ]}
            className="sm:col-span-2"
          />
          {form.openingMode === 'area' ? (
            <>
              <CalculatorInput
                id="aac-open-area"
                label="Opening area"
                type="number"
                min={0}
                step="any"
                value={form.openingArea}
                onChange={(e) => setField('openingArea', e.target.value)}
              />
              <CalculatorSelect
                id="aac-open-area-unit"
                label="Area unit"
                value={form.openingAreaUnit}
                onChange={(e) => setField('openingAreaUnit', e.target.value as 'm2' | 'ft2')}
                options={[
                  { value: 'm2', label: 'm²' },
                  { value: 'ft2', label: 'ft²' },
                ]}
              />
            </>
          ) : (
            <>
              <CalculatorInput
                id="aac-open-count"
                label="Number of openings"
                type="number"
                min={0}
                value={form.openingCount}
                onChange={(e) => setField('openingCount', e.target.value)}
              />
              <CalculatorInput
                id="aac-open-w"
                label="Opening width"
                type="number"
                min={0.001}
                step="any"
                value={form.openingWidth}
                onChange={(e) => setField('openingWidth', e.target.value)}
              />
              <CalculatorInput
                id="aac-open-h"
                label="Opening height"
                type="number"
                min={0.001}
                step="any"
                value={form.openingHeight}
                onChange={(e) => setField('openingHeight', e.target.value)}
              />
              <CalculatorSelect
                id="aac-open-unit"
                label="Opening size unit"
                value={form.openingWidthUnit}
                onChange={(e) => {
                  const u = e.target.value as LengthUnit;
                  setField('openingWidthUnit', u);
                  setField('openingHeightUnit', u);
                }}
                options={LENGTH_UNITS}
              />
            </>
          )}
        </>
      ) : null}

      <CalculatorSelect
        id="aac-size"
        label="AAC block size"
        value={form.blockPreset}
        onChange={(e) => setField('blockPreset', e.target.value as AacBlockPreset)}
        options={blockOptions}
        className="sm:col-span-2"
      />

      {form.blockPreset === 'custom' ? (
        <>
          <CalculatorInput
            id="aac-bl"
            label="Block length"
            type="number"
            min={0.001}
            value={form.blockLength}
            onChange={(e) => setField('blockLength', e.target.value)}
          />
          <CalculatorInput
            id="aac-bw"
            label="Block width (thickness)"
            type="number"
            min={0.001}
            value={form.blockWidth}
            onChange={(e) => setField('blockWidth', e.target.value)}
          />
          <CalculatorInput
            id="aac-bh"
            label="Block height"
            type="number"
            min={0.001}
            value={form.blockHeight}
            onChange={(e) => setField('blockHeight', e.target.value)}
          />
          <CalculatorSelect
            id="aac-bunit"
            label="Block size unit"
            value={form.blockSizeUnit}
            onChange={(e) => setField('blockSizeUnit', e.target.value as LengthUnit)}
            options={LENGTH_UNITS}
          />
        </>
      ) : null}

      <CalculatorInput
        id="aac-joint"
        label="Joint thickness (thin-bed)"
        type="number"
        min={0}
        value={form.jointThickness}
        onChange={(e) => setField('jointThickness', e.target.value)}
        hint="Typically 2–3 mm adhesive"
      />
      <CalculatorSelect
        id="aac-joint-unit"
        label="Joint unit"
        value={form.jointThicknessUnit}
        onChange={(e) => setField('jointThicknessUnit', e.target.value as LengthUnit)}
        options={LENGTH_UNITS}
      />

      <CalculatorInput
        id="aac-wastage"
        label="Wastage %"
        type="number"
        min={0}
        max={40}
        value={form.wastagePercent}
        onChange={(e) => setField('wastagePercent', e.target.value)}
      />
      <CalculatorInput
        id="aac-price"
        label="Price per block (₹, optional)"
        type="number"
        min={0.01}
        value={form.pricePerBlockInr}
        onChange={(e) => setField('pricePerBlockInr', e.target.value)}
      />

      {form.mode === 'forward' ? (
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="aac-adhesive"
            type="checkbox"
            checked={form.includeAdhesiveEstimate}
            onChange={(e) => setField('includeAdhesiveEstimate', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#0b1f3a] focus:ring-[#f97316]"
          />
          <label htmlFor="aac-adhesive" className="text-sm font-medium text-[#0b1f3a]">
            Include thin-bed adhesive estimate
          </label>
        </div>
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
        label={result.mode === 'reverse' ? 'Buildable net wall area' : 'AAC blocks required'}
        value={
          result.mode === 'reverse'
            ? `${result.buildableAreaM2?.toLocaleString('en-IN')} m²`
            : result.blocksRequired.toLocaleString('en-IN')
        }
        hint={
          result.mode === 'reverse'
            ? `${result.blocksRequired.toLocaleString('en-IN')} blocks · ≈ ${result.buildableVolumeM3} m³ · ${result.blockLabel}. Indicative only.`
            : `${result.blockLabel} · net ${result.netWallAreaM2} m² · volume ${result.netWallVolumeM3} m³. Indicative only.`
        }
        metrics={
          result.mode === 'forward'
            ? [
                { id: 'gross', label: 'Gross wall area', value: `${result.grossWallAreaM2} m²` },
                { id: 'open', label: 'Opening deductions', value: `${result.openingAreaM2} m²` },
                { id: 'net', label: 'Net wall area', value: `${result.netWallAreaM2} m²` },
                {
                  id: 'vol',
                  label: 'Material volume',
                  value: `${result.netWallVolumeM3} m³`,
                },
                {
                  id: 'waste',
                  label: 'Wastage blocks',
                  value: String(result.wastageBlocks),
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
              ]
            : [
                {
                  id: 'vol',
                  label: 'Buildable volume',
                  value: `${result.buildableVolumeM3} m³`,
                },
                {
                  id: 'usable',
                  label: 'Usable blocks (after wastage reserve)',
                  value: String(result.blocksBeforeWastage),
                },
                {
                  id: 'thick',
                  label: 'Wall thickness',
                  value: `${result.wallThicknessM} m`,
                },
              ]
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={COMPARE_AAC_BRICK} className={cx.primaryBtn}>
              Compare AAC blocks vs red bricks
            </Link>
            <Link href="/construction/brick-calculator" className={cx.secondaryBtn}>
              Brick calculator
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

      {result.adhesive ? (
        <CalculationBreakdown
          title={`Adhesive estimate (${result.adhesive.mixLabel})`}
          rows={[
            {
              id: 'av',
              label: 'Adhesive / joint volume',
              value: `${result.adhesive.adhesiveVolumeM3} m³`,
            },
            { id: 'ak', label: 'Adhesive mass', value: `${result.adhesive.adhesiveKg} kg` },
            { id: 'ab', label: 'Adhesive bags', value: String(result.adhesive.adhesiveBags) },
          ]}
        />
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
            {saveLoading ? 'Saving…' : 'Save to project'}
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
          { label: 'AAC block calculator' },
        ]}
        title="AAC block calculator"
        description="Estimate AAC blocks for masonry walls — openings, thin-bed joints, wastage, adhesive and cost. Reverse mode: how much wall can X blocks cover?"
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              N = ceil((A_gross − A_open) × T / V_modular × (1 + wastage%))
            </p>
            <p>
              Powered by the shared Varnarc masonry-wall engine (also used by the brick calculator).
              AAC defaults to thin-bed adhesive joints (~3 mm).
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{AAC_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{AAC_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={AAC_CALC_FAQS}
        stickyCta={{
          primary: {
            label: form.mode === 'reverse' ? 'Calculate coverage' : 'Calculate AAC blocks',
            onClick: () => runCalculate(),
          },
          secondary: { label: 'Compare vs bricks', href: COMPARE_AAC_BRICK },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={AAC_CALC_RELATED} />
      </div>
    </>
  );
}
