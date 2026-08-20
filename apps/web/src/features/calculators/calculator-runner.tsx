'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  isCalculatorFieldVisible,
  LOAN_CALCULATOR_FIELD_VISIBILITY,
  LOAN_CALCULATOR_SLUG,
  resolveLoanCalculatorInputs,
  syncLoanAmountFromPrice,
  type FieldVisibilityMap,
} from '@varnarc/validation';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { CalculatorAiAssistant } from '@/components/calculators/calculator-ai-assistant';
import { Spinner } from '@/components/shared/spinner';
import { DateInput, openDatePicker } from '@/components/shared/date-input';
import {
  applyCalculatorParamsToFieldValues,
  buildShareableCalculatorUrl,
  parseCalculatorParams,
} from '@/lib/calculator-query';

type Field = {
  key: string;
  label: string;
  fieldType: string;
  defaultValue?: string | null;
  required?: boolean;
  options?: unknown;
  validation?: { min?: number; max?: number; step?: number } | null;
};

type ResultCard = { key: string; label: string; format?: string };
type ResultTable = { title?: string; rows: Array<{ label: string; key: string; format?: string }> };
type ResultChart = {
  title?: string;
  type?: 'bar' | 'donut';
  keys: string[];
  labels?: Record<string, string>;
};
type ResultBreakdown = {
  title?: string;
  items: Array<{ label: string; key: string; format?: string }>;
};
type ResultTemplate = {
  cards?: ResultCard[];
  table?: ResultTable;
  chart?: ResultChart;
  breakdown?: ResultBreakdown;
  recommendations?: boolean;
};

type WizardStep = { title: string; fields: string[] };

const LOAN_TYPE_LABELS: Record<string, string> = {
  home: 'Home loan',
  personal: 'Personal loan',
  car: 'Car loan',
  education: 'Education loan',
};

function optionLabel(value: string) {
  return (
    LOAN_TYPE_LABELS[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function buildVisibilityInputs(
  values: Record<string, string>,
  fields: Field[],
): Record<string, unknown> {
  const snapshot = { ...values } as Record<string, unknown>;
  if (!snapshot.loanType) {
    const loanField = fields.find((f) => f.key === 'loanType');
    snapshot.loanType = loanField?.defaultValue ?? 'home';
  }
  return snapshot;
}

function resolveFieldVisibility(
  calculatorSlug: string,
  settings?: { fieldVisibility?: FieldVisibilityMap } | null,
): FieldVisibilityMap | null {
  const fromSettings = settings?.fieldVisibility;
  if (fromSettings && Object.keys(fromSettings).length > 0) {
    return fromSettings;
  }
  if (calculatorSlug === LOAN_CALCULATOR_SLUG) {
    return LOAN_CALCULATOR_FIELD_VISIBILITY;
  }
  return null;
}

function buildDefaultValues(fields: Field[]) {
  const today = new Date().toISOString().slice(0, 10);
  const defaults: Record<string, string> = {};
  for (const f of fields) {
    if (f.defaultValue != null) defaults[f.key] = String(f.defaultValue);
    else if (f.fieldType === 'date' && f.key === 'endDate') defaults[f.key] = today;
    else if (f.fieldType === 'checkbox') defaults[f.key] = '0';
  }
  return defaults;
}

function formatValue(value: number, format?: string) {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (format === 'percent') {
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}%`;
  }
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(value);
}

const CHART_COLORS = ['#0b1f3a', '#f97316', '#38bdf8', '#22c55e', '#a855f7'];

function resolveChartType(chart: ResultChart): 'bar' | 'donut' {
  if (chart.type === 'donut' || chart.type === 'bar') return chart.type;
  const keys = new Set(chart.keys);
  if (keys.has('principal') && keys.has('totalInterest')) return 'donut';
  if (keys.has('invested') && keys.has('gains')) return 'donut';
  return 'bar';
}

function DonutChart({ outputs, chart }: { outputs: Record<string, number>; chart: ResultChart }) {
  const segments = chart.keys
    .filter((k) => outputs[k] != null && !Number.isNaN(Number(outputs[k])))
    .map((key, index) => ({
      key,
      label: chart.labels?.[key] || key,
      value: Math.abs(Number(outputs[key])),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((seg) => seg.value > 0);

  if (!segments.length) return null;

  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
  let angle = 0;
  const gradientParts = segments
    .map((seg) => {
      const start = angle;
      angle += (seg.value / total) * 360;
      return `${seg.color} ${start}deg ${angle}deg`;
    })
    .join(', ');

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      {chart.title ? (
        <p className="mb-4 text-sm font-semibold text-[#0b1f3a]">{chart.title}</p>
      ) : null}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
        <div
          className="relative h-44 w-44 shrink-0 rounded-full shadow-inner"
          style={{ background: `conic-gradient(${gradientParts})` }}
          role="img"
          aria-label={chart.title || 'Breakdown chart'}
        >
          <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white px-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-sm font-bold leading-tight text-[#0b1f3a]">
              {formatValue(total, 'currency')}
            </p>
          </div>
        </div>
        <ul className="w-full max-w-xs space-y-3">
          {segments.map((seg) => {
            const pct = (seg.value / total) * 100;
            return (
              <li key={seg.key} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-700">{seg.label}</p>
                  <p className="text-[#0b1f3a]">
                    <span className="font-semibold">{formatValue(seg.value, 'currency')}</span>
                    <span className="ml-1 text-xs text-slate-500">({pct.toFixed(1)}%)</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ResultChartView({
  outputs,
  chart,
}: {
  outputs: Record<string, number>;
  chart: ResultChart;
}) {
  if (resolveChartType(chart) === 'donut') {
    return <DonutChart outputs={outputs} chart={chart} />;
  }
  return <BarChart outputs={outputs} chart={chart} />;
}

function BarChart({ outputs, chart }: { outputs: Record<string, number>; chart: ResultChart }) {
  const keys = chart.keys.filter((k) => outputs[k] != null && !Number.isNaN(Number(outputs[k])));
  if (!keys.length) return null;

  const values = keys.map((k) => Math.abs(Number(outputs[k])));
  const max = Math.max(...values, 1);
  const trackHeight = 140;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      {chart.title ? (
        <p className="mb-4 text-sm font-semibold text-[#0b1f3a]">{chart.title}</p>
      ) : null}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}
      >
        {keys.map((key) => {
          const v = Number(outputs[key] ?? 0);
          const barHeight = Math.max(20, Math.round((Math.abs(v) / max) * trackHeight));
          const label = chart.labels?.[key] || key;
          return (
            <div key={key} className="flex flex-col items-center text-center">
              <p className="mb-2 min-h-[2rem] text-xs font-semibold leading-tight text-slate-700">
                {formatValue(v)}
              </p>
              <div className="flex w-full items-end justify-center" style={{ height: trackHeight }}>
                <div
                  className="rounded-t-lg bg-[#f97316] shadow-sm"
                  style={{
                    height: barHeight,
                    width: '72%',
                    minWidth: 48,
                    maxWidth: 120,
                  }}
                  title={`${label}: ${formatValue(v)}`}
                  aria-label={`${label}: ${formatValue(v)}`}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const validation = field.validation as
    { options?: unknown; min?: number; max?: number; step?: number } | null | undefined;
  const opts = field.options ?? validation?.options;
  const min = field.validation?.min ?? validation?.min;
  const max = field.validation?.max ?? validation?.max;
  const step = field.validation?.step ?? validation?.step;

  if (field.fieldType === 'hidden' || field.fieldType === 'computed') {
    return <input type="hidden" value={value} readOnly />;
  }

  if (field.fieldType === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === '1' || value === 'true'}
          onChange={(e) => onChange(e.target.checked ? '1' : '0')}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (
    (field.fieldType === 'dropdown' ||
      field.fieldType === 'radio' ||
      field.fieldType === 'select') &&
    Array.isArray(opts)
  ) {
    if (field.fieldType === 'radio') {
      return (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-slate-700">{field.label}</legend>
          {(opts as Array<string | { value: string; label: string }>).map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? optionLabel(opt) : opt.label;
            return (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.key}
                  checked={value === v}
                  onChange={() => onChange(v)}
                />
                {label}
              </label>
            );
          })}
        </fieldset>
      );
    }
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">{field.label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 px-3"
          required={field.required !== false}
        >
          <option value="">Select…</option>
          {(opts as Array<string | { value: string; label: string }>).map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? optionLabel(opt) : opt.label;
            return (
              <option key={v} value={v}>
                {label}
              </option>
            );
          })}
        </select>
      </label>
    );
  }

  if (field.fieldType === 'slider') {
    return (
      <label className="block text-sm">
        <span className="mb-1 flex justify-between font-medium text-slate-700">
          <span>{field.label}</span>
          <span>{value}</span>
        </span>
        <input
          type="range"
          min={min ?? 0}
          max={max ?? 100}
          step={step ?? 1}
          value={value || '0'}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      </label>
    );
  }

  if (field.fieldType === 'date' || field.fieldType === 'month') {
    return (
      <label
        className="block cursor-pointer text-sm"
        onClick={(e) => {
          const input = e.currentTarget.querySelector('input');
          if (input instanceof HTMLInputElement && e.target !== input) {
            openDatePicker(input);
          }
        }}
      >
        <span className="mb-1 block font-medium text-slate-700">{field.label}</span>
        <div className="relative">
          <DateInput
            type={field.fieldType === 'month' ? 'month' : 'date'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-[#f97316]"
            required={field.required !== false}
          />
        </div>
      </label>
    );
  }

  const inputType =
    field.fieldType === 'year'
      ? 'number'
      : ['number', 'currency', 'percentage'].includes(field.fieldType)
        ? 'number'
        : 'text';

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{field.label}</span>
      <input
        type={inputType}
        step={step ?? 'any'}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-[#f97316]"
        required={field.required !== false && field.fieldType !== 'hidden'}
      />
    </label>
  );
}

export function CalculatorRunner({
  calculatorId,
  name,
  calculatorSlug,
  fields,
  resultTemplate,
  settings,
}: {
  calculatorId: string;
  name: string;
  calculatorSlug: string;
  fields: Field[];
  resultTemplate?: ResultTemplate | null;
  settings?: {
    mode?: string;
    steps?: WizardStep[];
    fieldVisibility?: FieldVisibilityMap;
  } | null;
}) {
  const searchParams = useSearchParams();
  const parsedQuery = useMemo(() => parseCalculatorParams(searchParams), [searchParams]);
  const fieldVisibility = resolveFieldVisibility(calculatorSlug, settings);

  const wizardSteps = settings?.mode === 'wizard' && settings.steps?.length ? settings.steps : null;
  const [stepIndex, setStepIndex] = useState(0);

  const [values, setValues] = useState<Record<string, string>>(() =>
    applyCalculatorParamsToFieldValues(fields, parsedQuery, buildDefaultValues(fields)),
  );
  const [outputs, setOutputs] = useState<Record<string, number> | null>(null);
  const [recommendations, setRecommendations] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState(`${name} result`);

  const visibleFields = useMemo(() => {
    const inputSnapshot = buildVisibilityInputs(values, fields);
    let list = fields.filter((f) =>
      isCalculatorFieldVisible(f.key, inputSnapshot, fieldVisibility),
    );
    if (wizardSteps) {
      const keys = new Set(wizardSteps[stepIndex]?.fields ?? []);
      list = list.filter((f) => keys.has(f.key));
    }
    return list;
  }, [fields, fieldVisibility, values, wizardSteps, stepIndex]);

  useEffect(() => {
    const defaults = buildDefaultValues(fields);
    setValues(
      applyCalculatorParamsToFieldValues(fields, parseCalculatorParams(searchParams), defaults),
    );
  }, [fields, searchParams]);

  useEffect(() => {
    if (calculatorSlug !== LOAN_CALCULATOR_SLUG) return;
    setValues((prev) => syncLoanAmountFromPrice(prev.loanType ?? 'home', prev));
  }, [calculatorSlug, fields]);

  function buildPayload() {
    const payload: Record<string, number | string | boolean> = {};
    const inputSnapshot = buildVisibilityInputs(values, fields);
    for (const f of fields) {
      if (!isCalculatorFieldVisible(f.key, inputSnapshot, fieldVisibility)) continue;
      const raw = values[f.key] ?? '';
      if (f.fieldType === 'checkbox') {
        payload[f.key] = raw === '1' || raw === 'true';
      } else if (['number', 'currency', 'percentage', 'slider', 'year'].includes(f.fieldType)) {
        payload[f.key] = Number(raw);
      } else {
        payload[f.key] = raw;
      }
    }
    if (calculatorSlug === LOAN_CALCULATOR_SLUG) {
      return resolveLoanCalculatorInputs(payload) as Record<string, number | string | boolean>;
    }
    return payload;
  }

  function updateFieldValue(key: string, value: string) {
    setValues((prev) => {
      let next = { ...prev, [key]: value };
      if (calculatorSlug === LOAN_CALCULATOR_SLUG && key === 'loanType') {
        next = syncLoanAmountFromPrice(value, next);
      } else if (
        calculatorSlug === LOAN_CALCULATOR_SLUG &&
        ['propertyValue', 'downPayment', 'onRoadPrice', 'courseFee', 'loanPercent'].includes(key)
      ) {
        next = syncLoanAmountFromPrice(next.loanType ?? 'personal', next);
      }
      return next;
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculator-field-change', { detail: { key, value } }));
    }
  }

  async function runCalculate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setOutputs(null);
    try {
      const res = await fetch(`/api/calculators/${calculatorId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: buildPayload(),
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : null,
        }),
      });
      const json = (await res.json()) as {
        data?: {
          outputs?: Record<string, number>;
          recommendations?: Array<{ id: string; name: string; slug: string }>;
        };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Calculation failed');
      setOutputs(json.data?.outputs ?? null);
      setRecommendations(json.data?.recommendations ?? []);
      trackAnalyticsEvent({
        eventType: 'calculator_usage',
        entityType: 'calculator',
        entityId: calculatorId,
        metadata: { name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (wizardSteps && stepIndex < wizardSteps.length - 1) {
      setStepIndex((s) => s + 1);
      return;
    }
    await runCalculate();
  }

  async function saveResult() {
    setMessage(null);
    try {
      const res = await fetch('/api/calculators/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorId,
          name: saveName || name,
          inputs: buildPayload(),
          outputs,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (res.status === 401) {
        setMessage('Sign in to save calculations');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage('Saved to your account');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function shareResult() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = buildShareableCalculatorUrl(calculatorSlug, values, origin, {
      product: parsedQuery.product ?? undefined,
      lender: parsedQuery.lender ?? undefined,
      category: parsedQuery.category ?? undefined,
    });
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `Share calculation — ${name}`,
          url: shareUrl,
        });
        setMessage('Shared');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setMessage('Share calculation link copied');
      }
    } catch {
      setMessage('Unable to share');
    }
  }

  const cards = resultTemplate?.cards?.length
    ? resultTemplate.cards
    : outputs
      ? Object.keys(outputs).map((key) => ({ key, label: key, format: 'number' as const }))
      : [];

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-extrabold text-[#0b1f3a]">{name}</h2>

      {wizardSteps ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {wizardSteps.map((s, i) => (
            <span
              key={s.title}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                i === stepIndex ? 'bg-[#f97316] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {i + 1}. {s.title}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 grid-cols-1">
        {visibleFields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={values[f.key] ?? ''}
            onChange={(v) => updateFieldValue(f.key, v)}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {wizardSteps && stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStepIndex((s) => s - 1)}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold"
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" label="Calculating" />
              Calculating…
            </span>
          ) : wizardSteps && stepIndex < wizardSteps.length - 1 ? (
            'Next'
          ) : (
            'Calculate'
          )}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}

      {outputs ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.key} className="rounded-xl bg-[#fff4eb] px-4 py-3">
                <p className="text-xs font-medium text-slate-600">{card.label}</p>
                <p className="mt-1 text-lg font-extrabold text-[#0b1f3a]">
                  {formatValue(outputs[card.key] ?? 0, card.format)}
                </p>
              </div>
            ))}
          </div>

          {resultTemplate?.chart?.keys?.length ? (
            <ResultChartView outputs={outputs} chart={resultTemplate.chart} />
          ) : null}

          {!resultTemplate?.chart?.keys?.length && resultTemplate?.breakdown?.items?.length ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-semibold">
                {resultTemplate.breakdown.title || 'Breakdown'}
              </p>
              <ul className="space-y-2 text-sm">
                {resultTemplate.breakdown.items.map((item) => (
                  <li key={item.key} className="flex justify-between gap-4">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold">
                      {formatValue(outputs[item.key] ?? 0, item.format)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!resultTemplate?.chart?.keys?.length && resultTemplate?.table?.rows?.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {resultTemplate.table.rows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-4 py-2">{row.label}</td>
                      <td className="px-4 py-2 font-semibold">
                        {formatValue(outputs[row.key] ?? 0, row.format)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <CalculatorAiAssistant
            calculatorName={name}
            calculatorSlug={calculatorSlug}
            inputs={buildPayload()}
            outputs={outputs}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Save as</span>
                <input
                  className="h-10 rounded-lg border border-slate-200 px-3"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => void saveResult()}
                className="h-10 rounded-lg bg-[#0b1f3a] px-4 text-sm font-semibold text-white"
              >
                Save calculation
              </button>
              <button
                type="button"
                onClick={() => void shareResult()}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold"
              >
                Share calculation
              </button>
            </div>
            <Link
              href="/saved-calculations"
              className="ml-auto shrink-0 self-center text-sm font-medium text-[#f97316] hover:underline"
            >
              View saved →
            </Link>
          </div>

          {(resultTemplate?.recommendations !== false && recommendations.length > 0) ||
          recommendations.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">Related calculators</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/calculators/${r.slug}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:border-[#f97316]"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
