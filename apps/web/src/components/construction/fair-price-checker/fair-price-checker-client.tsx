'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  FAIR_PRICE_CHECKER_QUALIFICATION,
  FAIR_PRICE_METHODOLOGY,
  FAIR_PRICE_UNITS,
  getFairPriceCityOptions,
  getFairPriceMaterialOptions,
} from '@varnarc/validation';
import {
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn } from '@/components/construction/styles';
import {
  checkFairPrice,
  fetchFairPriceMeta,
  type FairPriceMeta,
  type FairPriceResult,
} from '@/lib/construction/fair-price-checker/api';
import { FAIR_PRICE_FAQS, FAIR_PRICE_RELATED } from './content';

function money(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function signedMoney(n: number, currency = 'INR') {
  const abs = money(Math.abs(n), currency);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

function signedPct(n: number) {
  if (n > 0) return `+${n}%`;
  if (n < 0) return `−${Math.abs(n)}%`;
  return `${n}%`;
}

type Props = {
  initialParams?: {
    material?: string;
    location?: string;
    unit?: string;
    price?: string;
    quantity?: string;
  };
};

export function FairPriceCheckerClient({ initialParams }: Props) {
  const fallbackMaterials = useMemo(() => getFairPriceMaterialOptions(), []);
  const fallbackCities = useMemo(() => getFairPriceCityOptions(), []);

  const [meta, setMeta] = useState<FairPriceMeta | null>(null);
  const [materialKey, setMaterialKey] = useState(
    initialParams?.material ?? fallbackMaterials[0]?.key ?? 'cement',
  );
  const [locationSlug, setLocationSlug] = useState(
    initialParams?.location ?? fallbackCities[0]?.slug ?? 'hyderabad',
  );
  const [quotedUnit, setQuotedUnit] = useState(initialParams?.unit ?? 'bag');
  const [quotedPrice, setQuotedPrice] = useState(initialParams?.price ?? '');
  const [quantity, setQuantity] = useState(initialParams?.quantity ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FairPriceResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const m = await fetchFairPriceMeta();
      if (!cancelled && m) setMeta(m);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const materials = meta?.materials ?? fallbackMaterials;
  const cities = meta?.cities ?? fallbackCities;
  const units = meta?.units ?? FAIR_PRICE_UNITS.map((u) => ({ key: u.key, label: u.label }));
  const selectedMaterial = materials.find((m) => m.key === materialKey);

  function applyMaterialUnitHint(key: string) {
    setMaterialKey(key);
    const hint = materials.find((m) => m.key === key)?.unitHint ?? '';
    if (hint.includes('bag')) setQuotedUnit('bag');
    else if (hint.includes('kg')) setQuotedUnit('kg');
    else if (hint.includes('m³') || hint.includes('m3')) setQuotedUnit('m3');
    else if (hint.includes('m²') || hint.includes('m2')) setQuotedUnit('m2');
    else if (hint.includes('litre')) setQuotedUnit('litre');
    else if (hint.includes('piece')) setQuotedUnit('piece');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const price = Number(quotedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a positive quoted unit price.');
      return;
    }
    const qtyRaw = quantity.trim();
    const qty = qtyRaw ? Number(qtyRaw) : null;
    if (qtyRaw && (!Number.isFinite(qty) || (qty as number) <= 0)) {
      setError('Quantity must be a positive number when provided.');
      return;
    }

    setLoading(true);
    try {
      const res = await checkFairPrice({
        materialKey,
        locationSlug,
        quotedUnit,
        quotedPrice: price,
        quantity: qty,
        currency: 'INR',
      });
      if (!res) {
        setError('Could not reach the comparison service. Try again shortly.');
        return;
      }
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  const formNode = (
    <>
      <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:col-span-2">
        {meta?.qualification ?? FAIR_PRICE_CHECKER_QUALIFICATION}
      </p>
      <CalculatorForm
        onSubmit={onSubmit}
        loading={loading}
        submitLabel="Compare quote"
        calculatorType="fair_price_checker"
        className="sm:col-span-2"
      >
        <CalculatorSelect
          id="fpc-material"
          label="Material"
          value={materialKey}
          onChange={(e) => applyMaterialUnitHint(e.target.value)}
          options={materials.map((m) => ({ value: m.key, label: m.label }))}
        />
        <CalculatorSelect
          id="fpc-location"
          label="Location"
          value={locationSlug}
          onChange={(e) => setLocationSlug(e.target.value)}
          options={cities.map((c) => ({ value: c.slug, label: c.name }))}
        />
        <CalculatorSelect
          id="fpc-unit"
          label="Quoted unit"
          value={quotedUnit}
          onChange={(e) => setQuotedUnit(e.target.value)}
          options={units.map((u) => ({ value: u.key, label: u.label }))}
          hint={selectedMaterial ? `Common reference: ${selectedMaterial.unitHint}` : undefined}
        />
        <CalculatorInput
          id="fpc-price"
          label="Quoted unit price (₹)"
          type="number"
          min={0.01}
          step="any"
          required
          value={quotedPrice}
          onChange={(e) => setQuotedPrice(e.target.value)}
          placeholder="e.g. 420"
        />
        <CalculatorInput
          id="fpc-qty"
          label="Required quantity (optional)"
          type="number"
          min={0.001}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="For project cost impact"
          hint="Same unit as quoted unit"
          className="sm:col-span-2"
        />
      </CalculatorForm>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
          {error}
        </p>
      ) : null}
    </>
  );

  const classificationTone =
    result?.ok === true
      ? result.classification === 'within_range'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : result.classification === 'below_range'
          ? 'border-sky-200 bg-sky-50 text-sky-900'
          : 'border-amber-200 bg-amber-50 text-amber-950'
      : '';

  const resultNode = result ? (
    !result.ok ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-[#0b1f3a]">Insufficient data</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{result.reason}</p>
        <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-800">Data count</dt>
            <dd>{result.dataCount}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Methodology</dt>
            <dd className="text-xs leading-relaxed">{result.methodology}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">{result.disclaimer}</p>
        <Link
          href="/construction/prices"
          className="mt-4 inline-block text-sm font-semibold text-[#f97316]"
        >
          Browse construction prices →
        </Link>
      </div>
    ) : (
      <div className="space-y-6">
        <div
          className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', classificationTone)}
        >
          {result.classificationLabel}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Quoted price"
            value={`${money(result.quotedPrice)} / ${result.quotedUnit}`}
          />
          <Stat
            label="Observed range"
            value={`${money(result.observedRange.low)} – ${money(result.observedRange.high)}`}
            hint={`Mid ${money(result.observedRange.mid)}`}
          />
          <Stat
            label="Difference vs mid"
            value={signedMoney(result.differenceFromMid)}
            hint={signedPct(result.percentDifferenceFromMid)}
          />
          <Stat
            label="vs nearest bound"
            value={signedMoney(result.differenceFromNearestBound)}
            hint={
              result.classification === 'within_range'
                ? 'Within range (vs mid)'
                : signedPct(result.percentDifferenceFromNearestBound)
            }
          />
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Data count" value={String(result.dataCount)} />
          <MetaItem label="Data freshness" value={result.dataFreshness.label} />
          <MetaItem label="Location granularity" value={result.locationGranularityLabel} />
          <MetaItem label="Methodology version" value={result.methodologyVersion} />
        </div>

        {result.quantityImpact ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-[#0b1f3a]">Project cost impact</h3>
            <p className="mt-1 text-sm text-slate-600">
              Scaled by quantity {result.quantityImpact.quantity} ({result.quotedUnit}).
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetaItem label="Quoted total" value={money(result.quantityImpact.quotedTotal)} />
              <MetaItem
                label="Observed range total"
                value={`${money(result.quantityImpact.observedLowTotal)} – ${money(result.quantityImpact.observedHighTotal)}`}
              />
              <MetaItem
                label="Difference vs mid total"
                value={signedMoney(result.quantityImpact.differenceFromMidTotal)}
              />
            </dl>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-slate-500">{result.disclaimer}</p>
      </div>
    )
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Fair Price Checker' },
        ]}
        title="Fair Price Checker"
        description="Compare a supplier quote with Varnarc’s recent observed range for the same material, location and unit. We never label a quote as unfair or fraudulent."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        methodology={
          <MethodologyPanel
            title="How the comparison works"
            formula={meta?.methodology ?? FAIR_PRICE_METHODOLOGY}
            steps={[
              'Match material, location and quoted unit to recent LIVE/VERIFIED observations.',
              'Build an observed low–high range from those prices (and min/max bands when present).',
              'Classify the quote as within, below or above that range — never as unfair or fraudulent.',
              'If fewer than two fresh matching observations exist, return insufficient data instead of inventing a range.',
            ]}
          />
        }
        faqs={FAIR_PRICE_FAQS.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }))}
        relatedTools={FAIR_PRICE_RELATED}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={FAIR_PRICE_RELATED} />
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#0b1f3a]">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
