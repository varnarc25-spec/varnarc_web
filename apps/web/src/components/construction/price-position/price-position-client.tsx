'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
  MATERIAL_PRICE_POSITION_METHODOLOGY,
  MATERIAL_PRICE_POSITION_QUALIFICATION,
  calculateMaterialPricePosition,
  listPricePositionCities,
  listPricePositionMaterials,
  type MaterialPricePositionResult,
  type PriceFreshness,
} from '@varnarc/validation';
import {
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { trackPricePositionViewed } from '@/lib/construction/analytics';
import type { PriceLandingPayload, PriceObservation } from '@/lib/construction/prices-hub/api';
import { PRICE_POSITION_FAQS, PRICE_POSITION_RELATED, PRICE_POSITION_SEO } from './content';
import { PricePositionResultCard } from './price-position-result-card';

const CALC_TYPE = 'material_price_position';

type FormState = {
  materialKey: string;
  locationSlug: string;
  windowDays: string;
  projectQuantity: string;
  projectQuantityUnit: string;
  illustrativeUnitChangeInr: string;
};

function defaultForm(initial?: {
  material?: string;
  location?: string;
  quantity?: string;
  unit?: string;
}): FormState {
  const materials = listPricePositionMaterials();
  const cities = listPricePositionCities();
  return {
    materialKey:
      initial?.material && materials.some((m) => m.key === initial.material)
        ? initial.material
        : (materials[0]?.key ?? 'cement'),
    locationSlug:
      initial?.location && cities.some((c) => c.slug === initial.location)
        ? initial.location
        : (cities[0]?.slug ?? 'hyderabad'),
    windowDays: String(MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS),
    projectQuantity: initial?.quantity ?? '',
    projectQuantityUnit: initial?.unit ?? '',
    illustrativeUnitChangeInr: '5',
  };
}

function toClaimed(obs: PriceObservation): PriceFreshness {
  const c = (obs.claimedFreshness || obs.freshness || 'ESTIMATED').toUpperCase();
  if (c === 'LIVE' || c === 'VERIFIED' || c === 'ESTIMATED' || c === 'STALE') return c;
  return 'ESTIMATED';
}

async function fetchHistory(material: string, city: string): Promise<PriceLandingPayload | null> {
  const res = await fetch(`/api/construction/prices/${material}/${city}/history`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: PriceLandingPayload } | PriceLandingPayload;
  if (json && typeof json === 'object' && 'data' in json) return json.data ?? null;
  return json as PriceLandingPayload;
}

export function PricePositionClient({
  initialParams,
}: {
  initialParams?: {
    material?: string;
    location?: string;
    quantity?: string;
    unit?: string;
  };
}) {
  const [form, setForm] = useState<FormState>(() => defaultForm(initialParams));
  const [result, setResult] = useState<MaterialPricePositionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const materials = listPricePositionMaterials();
  const cities = listPricePositionCities();
  const materialLabel =
    materials.find((m) => m.key === form.materialKey)?.label ?? form.materialKey;
  const cityName = cities.find((c) => c.slug === form.locationSlug)?.name ?? form.locationSlug;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const run = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const history = await fetchHistory(form.materialKey, form.locationSlug);
        if (!history?.history?.length) {
          setResult({
            ok: false,
            reason:
              'No price observations found for this material and city. Try another pair or check the Prices hub.',
            windowDays: Number(form.windowDays) || MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
            observationCount: 0,
            version: '—',
            qualification: MATERIAL_PRICE_POSITION_QUALIFICATION,
            methodology: MATERIAL_PRICE_POSITION_METHODOLOGY,
          });
          setLoading(false);
          return;
        }

        const observations = history.history.map((o) => ({
          id: o.id,
          price: o.price,
          unit: o.unit,
          currency: o.currency,
          claimed: toClaimed(o),
          verifiedAt: o.verifiedAt,
          effectiveFrom: o.effectiveFrom,
        }));

        const qty = form.projectQuantity.trim() ? Number(form.projectQuantity) : null;
        const unitChange = form.illustrativeUnitChangeInr.trim()
          ? Number(form.illustrativeUnitChangeInr)
          : null;

        const next = calculateMaterialPricePosition(
          {
            materialKey: form.materialKey,
            locationSlug: form.locationSlug,
            windowDays: Number(form.windowDays) || MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
            projectQuantity: qty && qty > 0 ? qty : null,
            projectQuantityUnit:
              form.projectQuantityUnit.trim() ||
              history.current?.unit ||
              history.history[0]?.unit ||
              'unit',
            illustrativeUnitChangeInr: unitChange && unitChange > 0 ? unitChange : null,
          },
          observations,
        );

        setResult(next);
        trackPricePositionViewed({
          material_key: form.materialKey,
          location_level: 'city',
          position_band: next.ok ? next.positionBand : 'unavailable',
          path: '/construction/price-position',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not compute price position');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  useEffect(() => {
    void run();
    // Initial load only for deep links
  }, []);

  const formNode = (
    <CalculatorForm
      calculatorType={CALC_TYPE}
      onSubmit={(e) => void run(e)}
      onReset={() => {
        setForm(defaultForm());
        setResult(null);
        setError(null);
      }}
      submitLabel={loading ? 'Updating…' : 'Show price position'}
    >
      <CalculatorSelect
        id="pp-material"
        label="Material"
        value={form.materialKey}
        onChange={(e) => setField('materialKey', e.target.value)}
        options={materials.map((m) => ({ value: m.key, label: m.label }))}
      />
      <CalculatorSelect
        id="pp-city"
        label="Location"
        value={form.locationSlug}
        onChange={(e) => setField('locationSlug', e.target.value)}
        options={cities.map((c) => ({ value: c.slug, label: c.name }))}
      />
      <CalculatorSelect
        id="pp-window"
        label="Historical window"
        value={form.windowDays}
        onChange={(e) => setField('windowDays', e.target.value)}
        options={[
          { value: '30', label: 'Last 30 days' },
          { value: '90', label: 'Last 90 days (default)' },
          { value: '180', label: 'Last 180 days' },
        ]}
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Optional — project material requirement
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Shows how an illustrative ₹/unit change would affect estimated material cost. Not a
          forecast.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <CalculatorInput
            id="pp-qty"
            label="Approx. quantity"
            type="number"
            min={0}
            step="any"
            value={form.projectQuantity}
            onChange={(e) => setField('projectQuantity', e.target.value)}
            placeholder="e.g. 5000"
          />
          <CalculatorInput
            id="pp-qty-unit"
            label="Quantity unit"
            value={form.projectQuantityUnit}
            onChange={(e) => setField('projectQuantityUnit', e.target.value)}
            placeholder="kg / bags / m³"
          />
          <CalculatorInput
            id="pp-delta"
            label="Illustrative ₹/unit change"
            type="number"
            min={0}
            step="any"
            value={form.illustrativeUnitChangeInr}
            onChange={(e) => setField('illustrativeUnitChangeInr', e.target.value)}
            hint="Example sensitivity only"
          />
        </div>
      </div>

      {error ? (
        <p className="sm:col-span-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </CalculatorForm>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <PricePositionResultCard result={result} materialLabel={materialLabel} cityName={cityName} />
    </div>
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Price position' },
        ]}
        title="Material Price Position"
        description={PRICE_POSITION_SEO}
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        methodology={
          <MethodologyPanel
            title="How position is calculated"
            formula="percentile in window · band = Low / Moderate / High · trend = vs ~30-day baseline (historical only)"
            steps={[
              MATERIAL_PRICE_POSITION_METHODOLOGY,
              'Bands: Low (below 33rd percentile), Moderate (33–67), High (above 67) within the selected window.',
              'Never: “Buy now”, “Price will rise”, or any future commodity forecast.',
            ]}
          />
        }
        faqs={PRICE_POSITION_FAQS.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }))}
        relatedTools={PRICE_POSITION_RELATED}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={PRICE_POSITION_RELATED} />
      </div>
    </>
  );
}
