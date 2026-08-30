'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  compareConstructionScenarios,
  decodeScenarioSharePayload,
  defaultScenarioConfigs,
  duplicateScenario,
  encodeScenarioSharePayload,
  type ScenarioCompareResult,
  type ScenarioConfig,
  type ConstructionCostQuality,
  type ConstructionCostPropertyType,
} from '@varnarc/validation';
import {
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
} from '@/components/construction/calculator';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { cn, cx } from '@/components/construction/styles';
import {
  ConstructionReportActions,
  reportFromScenarioCompare,
} from '@/components/construction/report';
import {
  categorizeConstructionResultRange,
  trackCalculationAddedToProject,
  trackCalculationShared,
  trackCalculatorCompleted,
  trackComparisonCompleted,
  trackComparisonStarted,
  trackProjectCreated,
} from '@/lib/construction/analytics';
import { SCENARIO_COMPARE_FAQS, SCENARIO_COMPARE_SEO } from './content';

const STORAGE_KEY = 'varnarc.construction.scenario-compare.v1';
const CALC_TYPE = 'construction_scenario_compare';
const SHARE_PARAM = 's';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function autoLabel(c: ScenarioConfig): string {
  const floorLabel = c.floors <= 1 ? 'G' : `G+${c.floors - 1}`;
  return `${c.quality} · ${c.location} · ${floorLabel} · ${c.builtUpArea} ${c.areaUnit}`;
}

function newId(existing: ScenarioConfig[]): string {
  const used = new Set(existing.map((s) => s.id));
  for (let i = 1; i <= 3; i++) {
    if (!used.has(`s${i}`)) return `s${i}`;
  }
  return `s${Date.now()}`;
}

export function ScenarioCompareClient({
  initialEncoded,
  isAuthenticated = false,
}: {
  initialEncoded?: string | null;
  isAuthenticated?: boolean;
}) {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(() => {
    if (initialEncoded) {
      const decoded = decodeScenarioSharePayload(initialEncoded);
      if (decoded?.length) return decoded;
    }
    return defaultScenarioConfigs();
  });
  const [result, setResult] = useState<ScenarioCompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Preferred construction scenario');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const startedRef = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (initialEncoded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { scenarios?: ScenarioConfig[] };
        if (saved.scenarios?.length) setScenarios(saved.scenarios.slice(0, 3));
      }
    } catch {
      /* ignore */
    }
    trackComparisonStarted({ comparison_item_count: 2 });
  }, [initialEncoded]);

  const runCompare = useCallback(
    (list: ScenarioConfig[] = scenarios) => {
      setError(null);
      setActionMsg(null);
      try {
        if (!startedRef.current) {
          startedRef.current = true;
        }
        const next = compareConstructionScenarios({ scenarios: list });
        setResult(next);
        if (!preferredId || !list.some((s) => s.id === preferredId)) {
          setPreferredId(next.highlights.lowestCostScenarioId);
        }
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ scenarios: list, savedAt: Date.now() }),
          );
        } catch {
          /* ignore */
        }
        trackCalculatorCompleted({
          calculator_type: CALC_TYPE,
          result_range_category: categorizeConstructionResultRange(
            next.scenarios[0]?.estimatedTotal ?? null,
          ),
          logged_in: isAuthenticated,
        });
        trackComparisonCompleted({
          comparison_item_count: list.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed');
        setResult(null);
      }
    },
    [scenarios, preferredId, isAuthenticated],
  );

  useEffect(() => {
    // Auto-compare on mount when shared or defaults present
    runCompare(scenarios);
  }, []);

  function updateScenario(id: string, patch: Partial<ScenarioConfig>) {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if (!patch.label) next.label = autoLabel(next);
        return next;
      }),
    );
  }

  function handleDuplicate(id: string) {
    setScenarios((prev) => {
      if (prev.length >= 3) {
        setError('You can compare up to 3 scenarios. Remove one to duplicate.');
        return prev;
      }
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      const copy = duplicateScenario(src, {
        id: newId(prev),
        label: `${src.label} (copy)`,
      });
      setEditingId(copy.id);
      setActionMsg('Duplicated — change only the attributes you need.');
      return [...prev, copy];
    });
  }

  function handleRemove(id: string) {
    setScenarios((prev) => {
      if (prev.length <= 1) {
        setError('Keep at least one scenario.');
        return prev;
      }
      return prev.filter((s) => s.id !== id);
    });
  }

  function handleAddBlank() {
    setScenarios((prev) => {
      if (prev.length >= 3) {
        setError('Maximum of 3 scenarios.');
        return prev;
      }
      const base = prev[0] ?? defaultScenarioConfigs()[0]!;
      const copy = duplicateScenario(base, {
        id: newId(prev),
        label: autoLabel({ ...base, id: 'tmp' }),
      });
      setEditingId(copy.id);
      return [...prev, copy];
    });
  }

  function saveComparisonLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ scenarios, resultSummary: result?.highlights, savedAt: Date.now() }),
      );
      setActionMsg('Comparison saved in this browser.');
    } catch {
      setActionMsg('Could not save locally.');
    }
  }

  async function shareComparison() {
    const encoded = encodeScenarioSharePayload(scenarios);
    const url = `${window.location.origin}/construction/scenario-compare?${SHARE_PARAM}=${encoded}`;
    // Replace state so the shareable URL is stable but remains noindex via query
    window.history.replaceState({}, '', `${window.location.pathname}?${SHARE_PARAM}=${encoded}`);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Varnarc construction scenario comparison',
          text: 'Indicative construction scenario comparison (not a quote).',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setActionMsg('Share link copied. This link is not indexed by search engines.');
      }
      trackCalculationShared({ calculator_type: CALC_TYPE, logged_in: isAuthenticated });
    } catch {
      setActionMsg('Copy the URL from the address bar to share.');
    }
  }

  async function addPreferredToProject() {
    const preferred =
      result?.scenarios.find((s) => s.config.id === preferredId) ?? result?.scenarios[0];
    if (!preferred) return;
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const quality =
        preferred.config.quality === 'luxury'
          ? 'premium'
          : preferred.config.quality === 'basic'
            ? 'basic'
            : preferred.config.quality === 'premium'
              ? 'premium'
              : 'standard';
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || preferred.config.label,
          areaSqft: preferred.areaSqft,
          region: preferred.config.location,
          quality,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (res.status === 401) {
        setActionMsg('Sign in to add the preferred scenario to a project.');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setActionMsg('Preferred scenario added to your projects.');
      trackProjectCreated({ logged_in: true });
      trackCalculationAddedToProject({
        calculator_type: CALC_TYPE,
        logged_in: true,
      });
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  const rows = useMemo(() => {
    if (!result) return [];
    const cols = result.scenarios;
    const h = result.highlights;
    type Row = {
      id: string;
      label: string;
      values: Array<{ text: string; highlight?: 'lowest' | 'highest-diff' | 'driver' }>;
    };
    const mk = (
      id: string,
      label: string,
      pick: (s: (typeof cols)[0]) => string,
      opts?: { moneyKey?: keyof (typeof cols)[0] },
    ): Row => ({
      id,
      label,
      values: cols.map((s) => {
        let highlight: 'lowest' | 'highest-diff' | 'driver' | undefined;
        if (opts?.moneyKey === 'estimatedTotal') {
          if (s.config.id === h.lowestCostScenarioId) highlight = 'lowest';
          else if (s.config.id === h.highestDifferenceScenarioId && h.maxAbsoluteDifference > 0) {
            highlight = 'highest-diff';
          }
        }
        return { text: pick(s), highlight };
      }),
    });

    return [
      mk('total', 'Total estimated cost', (s) => formatInr(s.estimatedTotal), {
        moneyKey: 'estimatedTotal',
      }),
      mk('psf', 'Cost per sq ft', (s) => formatInr(s.costPerSqft)),
      mk('mat', 'Material cost', (s) => formatInr(s.materialCost)),
      mk('lab', 'Labour cost', (s) => formatInr(s.labourCost)),
      mk(
        'cont',
        'Contingency',
        (s) => `${formatInr(s.contingencyAmount)} (${s.contingencyPercent}%)`,
      ),
      mk('dur', 'Construction duration', (s) => `${s.durationMonths} months`),
      mk('cement', 'Cement (bags)', (s) => String(s.materials.cementBags)),
      mk('steel', 'Steel (kg)', (s) => String(s.materials.steelKg)),
      mk('sand', 'Sand (cu ft)', (s) => String(s.materials.sandCft)),
      mk('agg', 'Aggregate (cu ft)', (s) => String(s.materials.aggregateCft)),
      mk('bricks', 'Bricks / blocks', (s) => String(s.materials.bricks)),
      {
        id: 'driver',
        label: 'Largest cost driver',
        values: cols.map((s) => ({
          text: s.topDriver ? `${s.topDriver.label} (${formatInr(s.topDriver.amount)})` : '—',
          highlight: 'driver' as const,
        })),
      },
    ];
  }, [result]);

  const formNode = (
    <div className={cn(cx.card, 'space-y-4 p-4 sm:p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#0b1f3a]">Scenarios (max 3)</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cx.secondaryBtn} onClick={handleAddBlank}>
            Add scenario
          </button>
          <button type="button" className={cx.primaryBtn} onClick={() => runCompare()}>
            Compare
          </button>
        </div>
      </div>

      <ul className="space-y-4">
        {scenarios.map((s, index) => {
          const open = editingId === s.id || scenarios.length <= 2;
          return (
            <li key={s.id} className="rounded-lg border border-slate-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Scenario {index + 1}
                  </p>
                  <p className="text-sm font-bold text-[#0b1f3a]">{s.label}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className={cx.link}
                    onClick={() => setEditingId(open && editingId === s.id ? null : s.id)}
                  >
                    {open ? 'Hide fields' : 'Edit'}
                  </button>
                  <button type="button" className={cx.link} onClick={() => handleDuplicate(s.id)}>
                    Duplicate
                  </button>
                  <button type="button" className={cx.link} onClick={() => handleRemove(s.id)}>
                    Remove
                  </button>
                </div>
              </div>

              {open ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CalculatorInput
                    id={`${s.id}-label`}
                    label="Label"
                    value={s.label}
                    onChange={(e) => updateScenario(s.id, { label: e.target.value })}
                    className="sm:col-span-2"
                  />
                  <CalculatorInput
                    id={`${s.id}-loc`}
                    label="Location"
                    value={s.location}
                    onChange={(e) => updateScenario(s.id, { location: e.target.value })}
                  />
                  <CalculatorSelect
                    id={`${s.id}-quality`}
                    label="Quality"
                    value={s.quality}
                    onChange={(e) =>
                      updateScenario(s.id, {
                        quality: e.target.value as ConstructionCostQuality,
                      })
                    }
                    options={[
                      { value: 'basic', label: 'Basic' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'premium', label: 'Premium' },
                      { value: 'luxury', label: 'Luxury' },
                    ]}
                  />
                  <CalculatorInput
                    id={`${s.id}-area`}
                    label="Built-up area"
                    type="number"
                    min={1}
                    value={String(s.builtUpArea)}
                    onChange={(e) =>
                      updateScenario(s.id, { builtUpArea: Number(e.target.value) || 1 })
                    }
                  />
                  <CalculatorSelect
                    id={`${s.id}-unit`}
                    label="Area unit"
                    value={s.areaUnit}
                    onChange={(e) =>
                      updateScenario(s.id, {
                        areaUnit: e.target.value as 'sqft' | 'sqm',
                      })
                    }
                    options={[
                      { value: 'sqft', label: 'sq ft' },
                      { value: 'sqm', label: 'sq m' },
                    ]}
                  />
                  <CalculatorInput
                    id={`${s.id}-floors`}
                    label="Floors (G+n → n+1)"
                    type="number"
                    min={1}
                    max={50}
                    value={String(s.floors)}
                    onChange={(e) =>
                      updateScenario(s.id, {
                        floors: Math.max(1, Math.round(Number(e.target.value) || 1)),
                      })
                    }
                    hint="1 = ground only, 2 = G+1, 3 = G+2"
                  />
                  <CalculatorSelect
                    id={`${s.id}-ptype`}
                    label="Property type"
                    value={s.propertyType}
                    onChange={(e) =>
                      updateScenario(s.id, {
                        propertyType: e.target.value as ConstructionCostPropertyType,
                      })
                    }
                    options={[
                      { value: 'independent_house', label: 'Independent house' },
                      { value: 'villa', label: 'Villa' },
                      { value: 'apartment', label: 'Apartment' },
                      { value: 'duplex', label: 'Duplex' },
                      { value: 'commercial', label: 'Commercial' },
                    ]}
                  />
                  <CalculatorInput
                    id={`${s.id}-cont`}
                    label="Contingency %"
                    type="number"
                    min={0}
                    max={40}
                    value={String(s.contingencyPercent)}
                    onChange={(e) =>
                      updateScenario(s.id, {
                        contingencyPercent: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Highlights</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Lowest estimated cost:{' '}
            <strong>
              {
                result.scenarios.find((s) => s.config.id === result.highlights.lowestCostScenarioId)
                  ?.config.label
              }
            </strong>{' '}
            (
            {formatInr(
              result.scenarios.find((s) => s.config.id === result.highlights.lowestCostScenarioId)
                ?.estimatedTotal ?? 0,
            )}
            )
          </li>
          <li>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            Highest difference vs lowest:{' '}
            <strong>
              {
                result.scenarios.find(
                  (s) => s.config.id === result.highlights.highestDifferenceScenarioId,
                )?.config.label
              }
            </strong>{' '}
            (+{formatInr(result.highlights.maxAbsoluteDifference)})
          </li>
          <li>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#f97316]" />
            Largest cost drivers:{' '}
            {result.highlights.largestCostDrivers
              .map((d) => `${d.driverLabel} in ${d.scenarioLabel}`)
              .join('; ') || '—'}
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">{result.disclaimer}</p>
      </div>

      <div className={cn(cx.card, 'overflow-x-auto')}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-3 py-3 font-semibold text-[#0b1f3a] sm:px-4">Dimension</th>
              {result.scenarios.map((s) => (
                <th key={s.config.id} className="px-3 py-3 font-semibold text-[#0b1f3a] sm:px-4">
                  {s.config.label}
                  {s.config.id === result.highlights.lowestCostScenarioId ? (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Lowest cost
                    </span>
                  ) : null}
                  {s.config.id === result.highlights.highestDifferenceScenarioId &&
                  result.highlights.maxAbsoluteDifference > 0 &&
                  s.config.id !== result.highlights.lowestCostScenarioId ? (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-amber-600">
                      Highest difference
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <th scope="row" className="px-3 py-2.5 font-medium text-slate-600 sm:px-4">
                  {row.label}
                </th>
                {row.values.map((cell, i) => (
                  <td
                    key={`${row.id}-${i}`}
                    className={cn(
                      'px-3 py-2.5 tabular-nums text-[#0b1f3a] sm:px-4',
                      cell.highlight === 'lowest' && 'bg-emerald-50 font-semibold',
                      cell.highlight === 'highest-diff' && 'bg-amber-50 font-semibold',
                      cell.highlight === 'driver' && row.id === 'driver' && 'text-slate-800',
                    )}
                  >
                    {cell.text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn(cx.card, 'space-y-3 p-4 sm:p-5 print:hidden')}>
        <h3 className="text-sm font-bold text-[#0b1f3a]">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cx.secondaryBtn} onClick={saveComparisonLocal}>
            Save comparison
          </button>
          <button type="button" className={cx.secondaryBtn} onClick={() => void shareComparison()}>
            Share comparison
          </button>
          <ConstructionReportActions
            data={reportFromScenarioCompare({ result })}
            label="Print report"
          />
        </div>
        <div className="border-t border-slate-100 pt-3">
          <label className={cx.label} htmlFor="preferred-scenario">
            Preferred scenario for project
          </label>
          <select
            id="preferred-scenario"
            className={cx.input}
            value={preferredId ?? ''}
            onChange={(e) => setPreferredId(e.target.value)}
          >
            {result.scenarios.map((s) => (
              <option key={s.config.id} value={s.config.id}>
                {s.config.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              className={cx.input}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              aria-label="Project name"
              placeholder="Project name"
            />
            <button
              type="button"
              className={cx.primaryBtn}
              disabled={saveLoading}
              onClick={() => void addPreferredToProject()}
            >
              {saveLoading ? 'Saving…' : 'Add preferred to project'}
            </button>
          </div>
        </div>
        {actionMsg ? <p className="text-xs text-slate-600">{actionMsg}</p> : null}
        <p className="text-xs text-slate-500">
          Shared links use a compact <code className="rounded bg-slate-100 px-1">?s=</code> payload
          and are <strong>noindex</strong> — they will not create indexable pages for each
          configuration.
        </p>
      </div>
    </div>
  ) : (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      Configure scenarios and click Compare.
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Scenario comparison' },
        ]}
        title="Construction scenario comparison"
        description="Compare up to three build configurations side by side — quality, city, floors and area — with cost, contingency, duration and indicative material quantities. Duplicate a scenario to change only selected attributes."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Each scenario runs through the Varnarc construction cost model. Material quantities
              use indicative per-sq-ft factors adjusted lightly by quality. Duration is estimated
              from floor count for planning cash flow — not a contractor schedule.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{SCENARIO_COMPARE_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Example comparisons</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Standard vs Premium construction (same city and area)</li>
              <li>Hyderabad vs Bengaluru (same quality and floors)</li>
              <li>G+1 vs G+2</li>
              <li>1500 sqft vs 1800 sqft</li>
            </ul>
            <p>
              Prefer starting from the{' '}
              <Link href="/construction/cost-calculator" className={cx.link}>
                cost calculator
              </Link>
              , then duplicate scenarios here to isolate one change at a time.
            </p>
          </div>
        }
        faqs={SCENARIO_COMPARE_FAQS}
        stickyCta={{
          primary: { label: 'Compare scenarios', onClick: () => runCompare() },
          secondary: { label: 'Cost calculator', href: '/construction/cost-calculator' },
        }}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedSection entityId="tool:scenario" surface="scenario-compare" />
      </div>
    </>
  );
}
