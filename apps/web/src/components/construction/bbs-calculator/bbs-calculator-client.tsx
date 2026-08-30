'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BBS_BAR_SHAPE_LABELS,
  BBS_CALC_VERSION,
  calculateBbsSchedule,
  calculateRebarWeightPerMetre,
  listCommonRebarDiameters,
  type BbsBarShape,
  type BbsLengthUnit,
  type BbsScheduleResult,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import {
  trackBoqGenerated,
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
import { csvEscape, downloadCsv, printConstructionPage } from '@/lib/construction/export';
import { BBS_CALC_FAQS, BBS_CALC_RELATED, BBS_CALC_SEO, BBS_WORKED_EXAMPLE } from './content';

const CALC_TYPE = 'bbs_calculator';

const LENGTH_UNITS: Array<{ value: BbsLengthUnit; label: string }> = [
  { value: 'm', label: 'm' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft' },
  { value: 'inch', label: 'inch' },
];

const SHAPE_OPTS = (Object.keys(BBS_BAR_SHAPE_LABELS) as BbsBarShape[]).map((value) => ({
  value,
  label: BBS_BAR_SHAPE_LABELS[value]!,
}));

type TableRow = {
  id: string;
  barMark: string;
  member: string;
  diameterMm: string;
  shape: BbsBarShape;
  quantity: string;
  cuttingLength: string;
  cuttingLengthUnit: BbsLengthUnit;
  notes: string;
};

function newRow(partial?: Partial<TableRow>): TableRow {
  return {
    id: `bbs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    barMark: 'B1',
    member: 'Beam B1',
    diameterMm: '12',
    shape: 'straight',
    quantity: '10',
    cuttingLength: '4.2',
    cuttingLengthUnit: 'm',
    notes: '',
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

export function BbsCalculatorClient() {
  const [rows, setRows] = useState<TableRow[]>([
    newRow({
      barMark: 'B1',
      member: 'Beam B1',
      diameterMm: '12',
      quantity: '10',
      cuttingLength: '4.2',
    }),
    newRow({
      barMark: 'S1',
      member: 'Beam B1',
      diameterMm: '8',
      shape: 'stirrup',
      quantity: '40',
      cuttingLength: '1.1',
    }),
  ]);
  const [projectName, setProjectName] = useState('Bar bending schedule');
  const [ratePerKgInr, setRatePerKgInr] = useState('');
  const [result, setResult] = useState<BbsScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const diameterOptions = useMemo(() => listCommonRebarDiameters(), []);

  function updateRow(id: string, patch: Partial<TableRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        newRow(
          last
            ? {
                barMark: last.barMark,
                member: last.member,
                diameterMm: last.diameterMm,
                shape: last.shape,
                cuttingLengthUnit: last.cuttingLengthUnit,
                quantity: '1',
                cuttingLength: '',
                notes: '',
              }
            : undefined,
        ),
      ];
    });
  }

  function duplicateRow(id: string) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const source = prev[idx]!;
      const { id: _id, ...rest } = source;
      const copy = newRow({
        ...rest,
        barMark: `${source.barMark}-copy`,
      });
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  function runCalculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    try {
      const payload = {
        projectName: projectName.trim() || null,
        rows: rows.map((r) => ({
          id: r.id,
          barMark: r.barMark.trim() || '—',
          member: r.member.trim() || '—',
          diameterMm: Number(r.diameterMm),
          shape: r.shape,
          quantity: Number(r.quantity),
          cuttingLength: Number(r.cuttingLength),
          cuttingLengthUnit: r.cuttingLengthUnit,
          notes: r.notes.trim() || null,
        })),
        ratePerKgInr: ratePerKgInr.trim() ? Number(ratePerKgInr) : null,
      };
      const next = calculateBbsSchedule(payload);
      setResult(next);
      publishConstructionCalculationSave({
        calculatorSlug: 'bar-bending-schedule',
        methodologyVersionLabel: next.version ?? BBS_CALC_VERSION,
        inputs: { rows, ratePerKgInr, projectName },
        normalizedInputs: payload as unknown as Record<string, unknown>,
        outputs: next,
        assumptions: next.assumptions ?? null,
        sourcePath: '/construction/bar-bending-schedule',
      });
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'kg',
        result_range_category:
          next.overall.totalWeightKg <= 500
            ? 'low'
            : next.overall.totalWeightKg <= 5000
              ? 'mid'
              : 'high',
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

  function exportSchedule() {
    if (!result) {
      runCalculate();
      setActionMsg('Calculate the schedule first, then export.');
      return;
    }
    const lines = [
      'Bar_mark,Member,Diameter_mm,Shape,Quantity,Cutting_length_m,Unit_weight_kg_per_m,Total_length_m,Total_weight_kg,Notes',
      ...result.rows.map((r) =>
        [
          csvEscape(r.barMark),
          csvEscape(r.member),
          r.diameterMm,
          csvEscape(r.shapeLabel),
          r.quantity,
          r.cuttingLengthM,
          r.unitWeightKgPerM,
          r.totalLengthM,
          r.totalWeightKg,
          csvEscape(r.notes),
        ].join(','),
      ),
      '',
      'Totals_by_diameter,Label,Total_length_m,Total_weight_kg,Bars',
      ...result.totalsByDiameter.map(
        (g) => `diameter,${csvEscape(g.label)},${g.totalLengthM},${g.totalWeightKg},${g.barCount}`,
      ),
      '',
      'Totals_by_member,Label,Total_length_m,Total_weight_kg,Bars',
      ...result.totalsByMember.map(
        (g) => `member,${csvEscape(g.label)},${g.totalLengthM},${g.totalWeightKg},${g.barCount}`,
      ),
      '',
      `OVERALL,,,${result.overall.totalLengthM},${result.overall.totalWeightKg}`,
      result.estimatedCostInr != null ? `Estimated_cost_INR,,,${result.estimatedCostInr}` : '',
      'NOTE,"Quantity organization from user-entered details — not structural design.",,,',
    ].filter(Boolean);
    downloadCsv('varnarc-bar-bending-schedule.csv', lines);
    trackBoqGenerated({
      logged_in: false,
      item_count_bucket: result.rows.length <= 5 ? 'few' : 'many',
    });
    setActionMsg('Schedule CSV exported.');
  }

  async function shareResult() {
    if (!result) return;
    const text = `Varnarc BBS: ${result.overall.rowCount} rows, ${result.overall.totalLengthM} m, ${result.overall.totalWeightKg} kg. User-entered quantities only — not structural design.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bar bending schedule',
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setActionMsg('Copied schedule summary to clipboard.');
      }
      trackCalculationShared({ calculator_type: CALC_TYPE });
    } catch {
      setActionMsg('Could not share — copy the URL manually.');
    }
  }

  async function addToProject() {
    if (!result) {
      setActionMsg('Calculate the schedule before saving.');
      return;
    }
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Bar bending schedule',
          areaSqft: Math.max(1, Math.round(result.overall.totalWeightKg)),
          region: 'India',
          quality: 'standard',
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to save this schedule to a project.');
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
    <form className={cn(cx.card, 'space-y-4 p-4 sm:p-5')} onSubmit={runCalculate}>
      <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Quantity organization only</p>
        <p className="mt-1 text-sm text-slate-600">
          Enter reinforcement details from drawings. This workspace does not invent bars from
          architectural dimensions or perform structural design.
        </p>
      </aside>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Schedule / project name</span>
          <input
            className={cx.input}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Optional steel rate ₹ / kg</span>
          <input
            className={cx.input}
            type="number"
            min={1}
            step="any"
            value={ratePerKgInr}
            onChange={(e) => setRatePerKgInr(e.target.value)}
            placeholder="Skip for weight only"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2 font-semibold">Mark</th>
              <th className="px-2 py-2 font-semibold">Member</th>
              <th className="px-2 py-2 font-semibold">Ø mm</th>
              <th className="px-2 py-2 font-semibold">Shape</th>
              <th className="px-2 py-2 font-semibold">Qty</th>
              <th className="px-2 py-2 font-semibold">Cutting length</th>
              <th className="px-2 py-2 font-semibold">Unit</th>
              <th className="px-2 py-2 font-semibold">kg/m</th>
              <th className="px-2 py-2 font-semibold">Notes</th>
              <th className="px-2 py-2 font-semibold print:hidden"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <input
                    className={cn(cx.input, 'min-w-[4.5rem]')}
                    value={row.barMark}
                    onChange={(e) => updateRow(row.id, { barMark: e.target.value })}
                    aria-label="Bar mark"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className={cn(cx.input, 'min-w-[7rem]')}
                    value={row.member}
                    onChange={(e) => updateRow(row.id, { member: e.target.value })}
                    aria-label="Member"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className={cx.input}
                    value={
                      diameterOptions.some((d) => String(d.value) === row.diameterMm)
                        ? row.diameterMm
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value === 'custom') return;
                      updateRow(row.id, { diameterMm: e.target.value });
                    }}
                    aria-label="Diameter"
                  >
                    {diameterOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                    <option value="custom">Custom…</option>
                  </select>
                  {!diameterOptions.some((d) => String(d.value) === row.diameterMm) ? (
                    <input
                      className={cn(cx.input, 'mt-1')}
                      type="number"
                      min={1}
                      step="any"
                      value={row.diameterMm}
                      onChange={(e) => updateRow(row.id, { diameterMm: e.target.value })}
                      aria-label="Custom diameter mm"
                    />
                  ) : null}
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className={cx.input}
                    value={row.shape}
                    onChange={(e) => updateRow(row.id, { shape: e.target.value as BbsBarShape })}
                    aria-label="Shape"
                  >
                    {SHAPE_OPTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className={cn(cx.input, 'w-20')}
                    type="number"
                    min={1}
                    step={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                    aria-label="Quantity"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className={cn(cx.input, 'w-24')}
                    type="number"
                    min={0.001}
                    step="any"
                    value={row.cuttingLength}
                    onChange={(e) => updateRow(row.id, { cuttingLength: e.target.value })}
                    aria-label="Cutting length"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className={cx.input}
                    value={row.cuttingLengthUnit}
                    onChange={(e) =>
                      updateRow(row.id, {
                        cuttingLengthUnit: e.target.value as BbsLengthUnit,
                      })
                    }
                    aria-label="Cutting length unit"
                  >
                    {LENGTH_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5 tabular-nums text-slate-600">
                  {previewUnitWeight(row.diameterMm)}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className={cn(cx.input, 'min-w-[6rem]')}
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                    aria-label="Notes"
                    placeholder="Optional"
                  />
                </td>
                <td className="px-2 py-1.5 print:hidden">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="text-xs font-medium text-[#0b1f3a] underline"
                      onClick={() => duplicateRow(row.id)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 underline disabled:opacity-40"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(row.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" className={cx.secondaryBtn} onClick={addRow}>
          Add row
        </button>
        <button type="submit" className={cx.primaryBtn}>
          Calculate schedule
        </button>
        <button
          type="button"
          className={cx.secondaryBtn}
          onClick={() => {
            setRows([
              newRow({
                barMark: 'B1',
                member: 'Beam B1',
                diameterMm: '12',
                quantity: '10',
                cuttingLength: '4.2',
              }),
            ]);
            setResult(null);
            setError(null);
            setActionMsg(null);
            clearConstructionCalculationSave();
          }}
        >
          Reset
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <CalculationResult
        label="Overall project steel"
        value={`${result.overall.totalWeightKg.toLocaleString('en-IN')} kg`}
        hint={`${result.overall.totalLengthM} m · ${result.overall.totalBars} bars · ${result.overall.rowCount} rows · ${result.overall.totalWeightTonnes} t. From user-entered details only.`}
        metrics={[
          {
            id: 'len',
            label: 'Total length',
            value: `${result.overall.totalLengthM} m`,
          },
          {
            id: 'bars',
            label: 'Total bars',
            value: String(result.overall.totalBars),
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
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" className={cx.primaryBtn} onClick={exportSchedule}>
              Export CSV
            </button>
            <button
              type="button"
              className={cx.secondaryBtn}
              onClick={() => printConstructionPage()}
            >
              Print
            </button>
            <button
              type="button"
              className={cx.secondaryBtn}
              disabled={saveLoading}
              onClick={() => void addToProject()}
            >
              {saveLoading ? 'Saving…' : 'Save to project'}
            </button>
            <button type="button" className={cx.secondaryBtn} onClick={() => void shareResult()}>
              Share
            </button>
            <Link href="/construction/steel-calculator" className={cx.secondaryBtn}>
              Steel weight
            </Link>
          </div>
        }
      />

      <div className={cn(cx.card, 'overflow-x-auto p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Schedule rows</h3>
        <table className="mt-3 min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Mark</th>
              <th className="px-2 py-2 text-left">Member</th>
              <th className="px-2 py-2 text-left">Ø</th>
              <th className="px-2 py-2 text-left">Shape</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">CL m</th>
              <th className="px-2 py-2 text-right">kg/m</th>
              <th className="px-2 py-2 text-right">Length m</th>
              <th className="px-2 py-2 text-right">Weight kg</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5 font-medium">{r.barMark}</td>
                <td className="px-2 py-1.5">{r.member}</td>
                <td className="px-2 py-1.5">{r.diameterMm}</td>
                <td className="px-2 py-1.5">{r.shapeLabel}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.quantity}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.cuttingLengthM}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.unitWeightKgPerM}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.totalLengthM}</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                  {r.totalWeightKg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Totals by diameter</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {result.totalsByDiameter.map((g) => (
              <li key={g.key} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-medium text-slate-800">{g.label}</span>
                <span className="tabular-nums text-slate-600">
                  {g.totalLengthM} m · {g.totalWeightKg} kg · {g.barCount} bars
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={cn(cx.card, 'p-4 sm:p-5')}>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Totals by member</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {result.totalsByMember.map((g) => (
              <li key={g.key} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-medium text-slate-800">{g.label}</span>
                <span className="tabular-nums text-slate-600">
                  {g.totalLengthM} m · {g.totalWeightKg} kg · {g.barCount} bars
                </span>
              </li>
            ))}
          </ul>
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
          { label: 'Bar bending schedule' },
        ]}
        title="Bar bending schedule"
        description="Organize reinforcement quantities from user-entered bar marks, members, diameters, shapes, quantities and cutting lengths. Calculate length and weight with totals by diameter, member and project — not structural design."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              Total length = cutting length × qty · Unit weight w = d²/162 kg/m · Weight = w × total
              length
            </p>
            <p>
              Shape/type is for organization only. Cutting lengths must be entered from drawings —
              this tool does not invent reinforcement from architectural dimensions.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{BBS_CALC_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{BBS_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={BBS_CALC_FAQS}
        stickyCta={{
          primary: { label: 'Calculate schedule', onClick: () => runCalculate() },
          secondary: { label: 'Export CSV', onClick: () => exportSchedule() },
        }}
      />
      <div className="site-container pb-12 print:hidden">
        <ConstructionRelatedLinks calculators={BBS_CALC_RELATED} />
      </div>
    </>
  );
}
