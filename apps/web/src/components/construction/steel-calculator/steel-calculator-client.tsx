'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateRebarWeightPerMetre,
  calculateSteelWeight,
  listCommonRebarDiameters,
  type SteelCalculatorResult,
  type SteelLengthUnit,
  STEEL_CALC_VERSION,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
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
import { useRestoreSharedCalculation } from '@/lib/construction/share-calculation/use-restore-shared';
import { STEEL_CALC_FAQS, STEEL_CALC_SEO, STEEL_WORKED_EXAMPLE } from './content';

const CALC_TYPE = 'steel_weight_calculator';

const LENGTH_UNITS: Array<{ value: SteelLengthUnit; label: string }> = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'inch', label: 'inch' },
];

type TableRow = {
  id: string;
  diameterMode: 'standard' | 'custom';
  diameterMm: string;
  length: string;
  lengthUnit: SteelLengthUnit;
  quantity: string;
};

function newRow(partial?: Partial<TableRow>): TableRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    diameterMode: 'standard',
    diameterMm: '12',
    length: '12',
    lengthUnit: 'm',
    quantity: '10',
    ...partial,
  };
}

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function previewUnitWeight(diameterMm: string): string {
  const d = Number(diameterMm);
  if (!Number.isFinite(d) || d <= 0) return '—';
  try {
    return calculateRebarWeightPerMetre(d).toFixed(4);
  } catch {
    return '—';
  }
}

function previewRowWeight(row: TableRow): string {
  const d = Number(row.diameterMm);
  const len = Number(row.length);
  const qty = Number(row.quantity);
  if (![d, len, qty].every((n) => Number.isFinite(n) && n > 0)) return '—';
  try {
    // Preview assumes length already in metres for live feedback when unit is m;
    // full calculate converts units.
    if (row.lengthUnit !== 'm') return '…';
    return (calculateRebarWeightPerMetre(d) * len * qty).toFixed(2);
  } catch {
    return '—';
  }
}

const STANDARD_DIAMETERS = new Set([6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40]);

function stateFromShareInputs(inputs: Record<string, unknown>): {
  rows: TableRow[];
  ratePerKgInr: string;
} {
  const rawRows = Array.isArray(inputs.rows) ? inputs.rows : [];
  const rows: TableRow[] =
    rawRows.length > 0
      ? rawRows.map((raw, i) => {
          const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
          const diameterMm = typeof r.diameterMm === 'number' ? String(r.diameterMm) : '12';
          const dNum = Number(diameterMm);
          return {
            id:
              typeof r.id === 'string' && r.id
                ? r.id
                : `share-row-${i}-${Math.random().toString(36).slice(2, 7)}`,
            diameterMode: STANDARD_DIAMETERS.has(dNum) ? 'standard' : 'custom',
            diameterMm,
            length: typeof r.length === 'number' ? String(r.length) : '12',
            lengthUnit: typeof r.lengthUnit === 'string' ? (r.lengthUnit as SteelLengthUnit) : 'm',
            quantity: typeof r.quantity === 'number' ? String(r.quantity) : '1',
          } satisfies TableRow;
        })
      : [newRow({ diameterMm: '12', length: '12', quantity: '20' })];
  return {
    rows,
    ratePerKgInr: typeof inputs.ratePerKgInr === 'number' ? String(inputs.ratePerKgInr) : '',
  };
}

function buildSteelPayload(rows: TableRow[], ratePerKgInr: string) {
  return {
    rows: rows.map((r) => ({
      id: r.id,
      diameterMm: Number(r.diameterMm),
      length: Number(r.length),
      lengthUnit: r.lengthUnit,
      quantity: Number(r.quantity),
    })),
    ratePerKgInr: ratePerKgInr.trim() ? Number(ratePerKgInr) : null,
  };
}

export function SteelCalculatorClient({
  initialShareInputs = null,
}: {
  /** Sanitized public share state from `?s=` / flat query (no project/user data). */
  initialShareInputs?: Record<string, unknown> | null;
} = {}) {
  const initial = initialShareInputs ? stateFromShareInputs(initialShareInputs) : null;
  const [rows, setRows] = useState<TableRow[]>(
    () =>
      initial?.rows ?? [
        newRow({ diameterMm: '12', length: '12', quantity: '20' }),
        newRow({ diameterMm: '16', length: '10', quantity: '10' }),
      ],
  );
  const [ratePerKgInr, setRatePerKgInr] = useState(initial?.ratePerKgInr ?? '');
  const [result, setResult] = useState<SteelCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Steel weight estimate');
  const [saveLoading, setSaveLoading] = useState(false);
  const shareApplied = useRef(false);

  const diameterOptions = useMemo(() => listCommonRebarDiameters(), []);

  const applyShareInputs = useCallback((inputs: Record<string, unknown>) => {
    try {
      const next = stateFromShareInputs(inputs);
      setRows(next.rows);
      setRatePerKgInr(next.ratePerKgInr);
      const payload = buildSteelPayload(next.rows, next.ratePerKgInr);
      const calc = calculateSteelWeight(payload);
      setResult(calc);
      setError(null);
      publishConstructionCalculationSave({
        calculatorSlug: 'steel-calculator',
        methodologyVersionLabel: calc.version ?? STEEL_CALC_VERSION,
        inputs: { rows: next.rows, ratePerKgInr: next.ratePerKgInr },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: calc,
        assumptions: calc.assumptions ?? null,
        sourcePath: '/construction/steel-calculator',
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
    'steel-calculator',
    useCallback(
      (inputs) => {
        if (shareApplied.current) return;
        shareApplied.current = true;
        applyShareInputs(inputs);
      },
      [applyShareInputs],
    ),
  );

  function updateRow(id: string, patch: Partial<TableRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = buildSteelPayload(rows, ratePerKgInr);
      const next = calculateSteelWeight(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'steel-calculator',
        methodologyVersionLabel: next.version ?? STEEL_CALC_VERSION,
        inputs: { rows, ratePerKgInr },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/steel-calculator',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'kg',
        result_range_category:
          next.totalWeightKg <= 500 ? 'low' : next.totalWeightKg <= 5000 ? 'mid' : 'high',
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
    const text = `Varnarc steel weight: ${result.totalWeightKg} kg (${result.totalWeightTonnes} t). Formula ${result.formula}. Indicative only.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Steel weight calculator',
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
      'Diameter_mm,Length_m,Quantity,Unit_weight_kg_per_m,Total_weight_kg',
      ...result.rows.map(
        (r) =>
          `${r.diameterMm},${r.lengthM},${r.quantity},${r.unitWeightKgPerM},${r.totalWeightKg}`,
      ),
      `TOTAL,,,,${result.totalWeightKg}`,
      result.estimatedCostInr != null ? `Estimated cost INR,,,${result.estimatedCostInr}` : '',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'varnarc-steel-weight-boq.csv';
    a.click();
    URL.revokeObjectURL(url);
    setActionMsg('BOQ CSV exported.');
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
          name: projectName.trim() || 'Steel weight estimate',
          areaSqft: Math.max(1, Math.round(result.totalWeightKg)),
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
    <form onSubmit={runCalculate} className={cn(cx.card, 'space-y-4 p-4 sm:p-5')} noValidate>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#0b1f3a]">Bar schedule</h2>
          <p className="mt-1 text-xs text-slate-500">
            Add rows for each diameter. Use quantity = 1 with total length for a single-run total.
          </p>
        </div>
        <button type="button" className={cx.secondaryBtn} onClick={addRow}>
          Add row
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Diameter</th>
              <th className="px-3 py-2">Length</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Unit wt (kg/m)</th>
              <th className="px-3 py-2">Total wt*</th>
              <th className="px-3 py-2 sr-only">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-2 py-2 align-top">
                  <div className="flex min-w-[7.5rem] flex-col gap-1">
                    <select
                      className={cn(cx.input, 'text-sm')}
                      value={
                        row.diameterMode === 'custom'
                          ? 'custom'
                          : diameterOptions.some((o) => String(o.value) === row.diameterMm)
                            ? row.diameterMm
                            : 'custom'
                      }
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          updateRow(row.id, { diameterMode: 'custom' });
                        } else {
                          updateRow(row.id, {
                            diameterMode: 'standard',
                            diameterMm: e.target.value,
                          });
                        }
                      }}
                      aria-label="Bar diameter"
                    >
                      {diameterOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                      <option value="custom">Custom mm</option>
                    </select>
                    {row.diameterMode === 'custom' ||
                    !diameterOptions.some((o) => String(o.value) === row.diameterMm) ? (
                      <input
                        type="number"
                        min={1}
                        step="any"
                        className={cn(cx.input, 'text-sm')}
                        value={row.diameterMm}
                        onChange={(e) =>
                          updateRow(row.id, {
                            diameterMode: 'custom',
                            diameterMm: e.target.value,
                          })
                        }
                        aria-label="Custom diameter mm"
                        placeholder="mm"
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    required
                    className={cn(cx.input, 'min-w-[5rem] text-sm')}
                    value={row.length}
                    onChange={(e) => updateRow(row.id, { length: e.target.value })}
                    aria-label="Bar length"
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <select
                    className={cn(cx.input, 'text-sm')}
                    value={row.lengthUnit}
                    onChange={(e) =>
                      updateRow(row.id, {
                        lengthUnit: e.target.value as SteelLengthUnit,
                      })
                    }
                    aria-label="Length unit"
                  >
                    {LENGTH_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 align-top">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    className={cn(cx.input, 'min-w-[4.5rem] text-sm')}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                    aria-label="Quantity"
                  />
                </td>
                <td className="px-3 py-2 align-middle tabular-nums text-[#0b1f3a]">
                  {previewUnitWeight(row.diameterMm)}
                </td>
                <td className="px-3 py-2 align-middle tabular-nums text-[#0b1f3a]">
                  {previewRowWeight(row)}
                </td>
                <td className="px-2 py-2 align-top">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(row.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        * Live total weight preview assumes length in metres. Click Calculate for full unit
        conversion and footers.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="steel-rate" className={cx.label}>
            Steel rate ₹/kg (optional)
          </label>
          <input
            id="steel-rate"
            type="number"
            min={1}
            step="any"
            className={cx.input}
            value={ratePerKgInr}
            onChange={(e) => setRatePerKgInr(e.target.value)}
            placeholder="e.g. 55"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        <button type="submit" className={cx.primaryBtn}>
          Calculate steel weight
        </button>
        <button
          type="button"
          className={cx.secondaryBtn}
          onClick={() => {
            setRows([newRow({ diameterMm: '12', length: '12', quantity: '20' })]);
            setRatePerKgInr('');
            setResult(null);
            setError(null);
            setActionMsg(null);
            clearConstructionCalculationSave();
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <CalculationResult
        label="Total steel weight"
        value={`${result.totalWeightKg.toLocaleString('en-IN')} kg`}
        hint={`${result.totalWeightTonnes} tonnes · ${result.totalLengthM} m total bar length. Indicative only.`}
        metrics={[
          {
            id: 'tonnes',
            label: 'Total tonnes',
            value: String(result.totalWeightTonnes),
          },
          {
            id: 'length',
            label: 'Total bar length',
            value: `${result.totalLengthM} m`,
          },
          ...(result.estimatedCostInr != null
            ? [
                {
                  id: 'cost',
                  label: 'Estimated material cost',
                  value: formatInr(result.estimatedCostInr),
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx.secondaryBtn} onClick={downloadBoq}>
              Add to BOQ / Export CSV
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => window.print()}>
              Print
            </button>
            <Link href="/construction/materials?search=steel" className={cx.secondaryBtn}>
              Check steel prices
            </Link>
          </div>
        }
      />

      <div className={cn(cx.card, 'overflow-hidden')}>
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-[#0b1f3a]">Schedule totals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-2">Diameter</th>
                <th className="px-4 py-2">Length (m)</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Unit wt (kg/m)</th>
                <th className="px-4 py-2 text-right">Total wt (kg)</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-[#0b1f3a]">Ø{r.diameterMm} mm</td>
                  <td className="px-4 py-2 tabular-nums">{r.lengthM}</td>
                  <td className="px-4 py-2 tabular-nums">{r.quantity}</td>
                  <td className="px-4 py-2 tabular-nums">{r.unitWeightKgPerM}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">
                    {r.totalWeightKg}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#0b1f3a]/bg-slate-50">
                <td className="px-4 py-3 font-bold text-[#0b1f3a]" colSpan={4}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-[#0b1f3a]">
                  {result.totalWeightKg} kg
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
          { label: 'Steel calculator' },
        ]}
        title="Steel weight calculator"
        description="Calculate TMT / rebar weight with the standard formula w = d²/162. Edit multiple diameter rows in one session — kg/m, total kg, tonnes and optional cost."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              w (kg/m) = d² / 162 · Total = w × L(m) × qty
            </p>
            <p>
              {`d is bar diameter in millimetres. The divisor 162 approximates π/4 × 7850 kg/m³ steel
              density.`}
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{STEEL_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{STEEL_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={STEEL_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate steel weight', onClick: () => runCalculate() },
          secondary: {
            label: 'Steel prices',
            href: '/construction/materials?search=steel',
          },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="calc:steel" surface="steel-calculator" />
      </div>
    </>
  );
}
