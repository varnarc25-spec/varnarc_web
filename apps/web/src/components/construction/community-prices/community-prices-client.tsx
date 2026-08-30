'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { COMMUNITY_PRICE_QUALIFICATION, FAIR_PRICE_UNITS } from '@varnarc/validation';
import {
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn } from '@/components/construction/styles';
import { COMMUNITY_PRICE_FAQS, COMMUNITY_PRICE_RELATED } from './content';

type Meta = {
  version: string;
  qualification: string;
  methodology: string;
  sourceLabel: string;
  statuses: Array<{ key: string; label: string }>;
  limits: {
    maxPerDay: number;
    maxPending: number;
    minTrustForAggregate: number;
    lookbackDays: number;
  };
  cities: Array<{ slug: string; name: string; id: string | null }>;
  materials: Array<{
    id: string;
    name: string;
    slug: string;
    unit: string;
    hubKey: string | null;
  }>;
  neverPromotesToPrimaryMarket: boolean;
};

type ReportRow = {
  id: string;
  price: number;
  unit: string;
  purchaseDate: string;
  status: string;
  statusLabel: string;
  trustScore: number;
  isOutlier: boolean;
  isDuplicate: boolean;
  hasInvoice: boolean;
  brandName: string | null;
  material: { name: string; slug: string } | null;
  location: { name: string; slug: string } | null;
  invoice?: { downloadAvailable: boolean } | null;
};

type AggregateOk = {
  ok: true;
  observedRange: { low: number; high: number; mid: number };
  sampleSize: number;
  freshness: { label: string };
  sourceComposition: Array<{ key: string; label: string; count: number; percent: number }>;
  sourceLabel: string;
  disclaimer: string;
  isPrimaryMarketPrice: false;
  material?: { name: string } | null;
  location?: { name: string } | null;
};

type AggregateFail = {
  ok: false;
  reason: string;
  sampleSize: number;
  disclaimer: string;
  isPrimaryMarketPrice: false;
};

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T; error?: { message?: string } };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

function money(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

type Tab = 'report' | 'mine' | 'aggregate';

export function CommunityPricesClient() {
  const [tab, setTab] = useState<Tab>('report');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mine, setMine] = useState<ReportRow[]>([]);
  const [aggregate, setAggregate] = useState<AggregateOk | AggregateFail | null>(null);

  const [materialId, setMaterialId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('bag');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [invoice, setInvoice] = useState<File | null>(null);

  const [aggMaterialId, setAggMaterialId] = useState('');
  const [aggLocationId, setAggLocationId] = useState('');
  const [aggUnit, setAggUnit] = useState('bag');

  const materials = meta?.materials ?? [];
  const cities = useMemo(() => (meta?.cities ?? []).filter((c) => c.id), [meta]);

  const loadMeta = useCallback(async () => {
    const res = await fetch('/api/construction/community-prices/meta', { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    const data = unwrap<Meta>(json);
    if (!data) return;
    setMeta(data);
    setMaterialId((prev) => prev || data.materials[0]?.id || '');
    setAggMaterialId((prev) => prev || data.materials[0]?.id || '');
    const firstCityId = data.cities.find((c) => c.id)?.id ?? '';
    setLocationId((prev) => prev || firstCityId);
    setAggLocationId((prev) => prev || firstCityId);
    const m = data.materials[0];
    if (m?.unit) {
      const u = m.unit.toLowerCase();
      if (u.includes('bag')) setUnit('bag');
      else if (u.includes('kg')) setUnit('kg');
      else if (u.includes('m3') || u.includes('m³')) setUnit('m3');
      else if (u.includes('m2') || u.includes('m²')) setUnit('m2');
      else if (u.includes('lit')) setUnit('litre');
      else if (u.includes('pc') || u.includes('nos') || u.includes('piece')) setUnit('piece');
    }
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/construction/community-prices', { cache: 'no-store' });
    if (res.status === 401) {
      setAuthRequired(true);
      setMine([]);
      return;
    }
    setAuthRequired(false);
    const json = await res.json().catch(() => null);
    const data = unwrap<{ items: ReportRow[] }>(json);
    setMine(data?.items ?? []);
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (tab === 'mine') void loadMine();
  }, [tab, loadMine]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const priceN = Number(price);
    if (!materialId || !locationId || !unit || !purchaseDate || !(priceN > 0)) {
      setError('Material, location, unit, purchase date and a positive price are required.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('materialId', materialId);
      fd.set('locationId', locationId);
      fd.set('price', String(priceN));
      fd.set('unit', unit);
      fd.set('purchaseDate', purchaseDate);
      fd.set('currency', 'INR');
      if (brandName.trim()) fd.set('brandName', brandName.trim());
      if (supplierName.trim()) fd.set('supplierName', supplierName.trim());
      if (notes.trim()) fd.set('notes', notes.trim());
      if (invoice) fd.set('invoice', invoice);

      const res = await fetch('/api/construction/community-prices', {
        method: 'POST',
        body: fd,
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        setAuthRequired(true);
        setError('Sign in to submit a community price report.');
        return;
      }
      if (!res.ok) {
        const err =
          (json as { error?: { message?: string } })?.error?.message || 'Submission failed.';
        setError(err);
        return;
      }
      const data = unwrap<{ message?: string }>(json);
      setMessage(data?.message ?? 'Report submitted for moderation.');
      setPrice('');
      setInvoice(null);
      setNotes('');
      setTab('mine');
      await loadMine();
    } finally {
      setLoading(false);
    }
  }

  async function loadAggregate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setAggregate(null);
    if (!aggMaterialId || !aggLocationId || !aggUnit) {
      setError('Select material, location and unit for the community aggregate.');
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        materialId: aggMaterialId,
        locationId: aggLocationId,
        unit: aggUnit,
      });
      const res = await fetch(`/api/construction/community-prices/aggregate?${qs}`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      const data = unwrap<AggregateOk | AggregateFail>(json);
      setAggregate(data);
    } finally {
      setLoading(false);
    }
  }

  async function removeReport(id: string) {
    const res = await fetch(`/api/construction/community-prices/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(
        (json as { error?: { message?: string } })?.error?.message || 'Could not delete report.',
      );
      return;
    }
    await loadMine();
  }

  const formNode = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['report', 'Submit report'],
            ['mine', 'My reports'],
            ['aggregate', 'Community range'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold',
              tab === key
                ? 'bg-[#0b1f3a] text-white'
                : 'border border-slate-200 bg-white text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-slate-600">
        {meta?.qualification ?? COMMUNITY_PRICE_QUALIFICATION}
      </p>

      {authRequired && tab !== 'aggregate' ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Sign in required to submit or view your reports.{' '}
          <Link href="/login" className="font-semibold text-[#f97316]">
            Sign in
          </Link>
        </p>
      ) : null}

      {tab === 'report' ? (
        <CalculatorForm
          onSubmit={onSubmit}
          loading={loading}
          submitLabel="Submit for moderation"
          calculatorType="community_price_report"
        >
          <CalculatorSelect
            id="cpr-material"
            label="Material"
            value={materialId}
            onChange={(e) => {
              setMaterialId(e.target.value);
              const m = materials.find((x) => x.id === e.target.value);
              if (m?.unit) {
                const u = m.unit.toLowerCase();
                if (u.includes('bag')) setUnit('bag');
                else if (u.includes('kg')) setUnit('kg');
                else if (u.includes('m3') || u.includes('m³')) setUnit('m3');
                else if (u.includes('m2') || u.includes('m²')) setUnit('m2');
                else if (u.includes('lit')) setUnit('litre');
                else if (u.includes('pc') || u.includes('piece')) setUnit('piece');
              }
            }}
            options={materials.map((m) => ({ value: m.id, label: m.name }))}
            required
          />
          <CalculatorSelect
            id="cpr-location"
            label="Location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            options={cities.map((c) => ({ value: c.id!, label: c.name }))}
            required
          />
          <CalculatorInput
            id="cpr-brand"
            label="Brand (optional)"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. UltraTech"
          />
          <CalculatorSelect
            id="cpr-unit"
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={FAIR_PRICE_UNITS.map((u) => ({ value: u.key, label: u.label }))}
            required
          />
          <CalculatorInput
            id="cpr-price"
            label="Price (₹)"
            type="number"
            min={0.01}
            step="any"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <CalculatorInput
            id="cpr-date"
            label="Purchase date"
            type="date"
            required
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <CalculatorInput
            id="cpr-supplier"
            label="Supplier (optional)"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Dealer / store name"
          />
          <CalculatorInput
            id="cpr-notes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Grade, GST included, etc."
          />
          <div className="sm:col-span-2">
            <label htmlFor="cpr-invoice" className="mb-1 block text-sm font-medium text-slate-700">
              Invoice proof (optional, private)
            </label>
            <input
              id="cpr-invoice"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setInvoice(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-500">
              Invoices are never shown publicly. Only you or a moderator can download them.
            </p>
          </div>
        </CalculatorForm>
      ) : null}

      {tab === 'mine' ? (
        <ul className="space-y-3">
          {mine.length === 0 ? (
            <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No reports yet.
            </li>
          ) : (
            mine.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0b1f3a]">
                      {r.material?.name ?? 'Material'} · {r.location?.name ?? 'Location'}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {money(r.price)} / {r.unit} · purchased {r.purchaseDate}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.statusLabel} · trust {r.trustScore}
                      {r.isOutlier ? ' · outlier signal' : ''}
                      {r.isDuplicate ? ' · duplicate signal' : ''}
                      {r.hasInvoice ? ' · invoice on file' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.hasInvoice ? (
                      <a
                        href={`/api/construction/community-prices/${r.id}/invoice`}
                        className="text-xs font-semibold text-[#f97316]"
                      >
                        Download invoice
                      </a>
                    ) : null}
                    {r.status !== 'VERIFIED' ? (
                      <button
                        type="button"
                        onClick={() => void removeReport(r.id)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === 'aggregate' ? (
        <div className="space-y-4">
          <CalculatorForm
            onSubmit={loadAggregate}
            loading={loading}
            submitLabel="View community range"
            calculatorType="community_price_aggregate"
          >
            <CalculatorSelect
              id="agg-material"
              label="Material"
              value={aggMaterialId}
              onChange={(e) => setAggMaterialId(e.target.value)}
              options={materials.map((m) => ({ value: m.id, label: m.name }))}
            />
            <CalculatorSelect
              id="agg-location"
              label="Location"
              value={aggLocationId}
              onChange={(e) => setAggLocationId(e.target.value)}
              options={cities.map((c) => ({ value: c.id!, label: c.name }))}
            />
            <CalculatorSelect
              id="agg-unit"
              label="Unit"
              value={aggUnit}
              onChange={(e) => setAggUnit(e.target.value)}
              options={FAIR_PRICE_UNITS.map((u) => ({ value: u.key, label: u.label }))}
              className="sm:col-span-2"
            />
          </CalculatorForm>

          {aggregate?.ok === false ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-[#0b1f3a]">Insufficient eligible data</h3>
              <p className="mt-2 text-sm text-slate-700">{aggregate.reason}</p>
              <p className="mt-2 text-xs text-slate-500">Sample size: {aggregate.sampleSize}</p>
            </div>
          ) : null}

          {aggregate?.ok === true ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-950">
                Community aggregate — not Varnarc’s primary market price.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Observed range"
                  value={`${money(aggregate.observedRange.low)} – ${money(aggregate.observedRange.high)}`}
                  hint={`Mid ${money(aggregate.observedRange.mid)}`}
                />
                <Stat label="Sample size" value={String(aggregate.sampleSize)} />
                <Stat label="Freshness" value={aggregate.freshness.label} />
                <Stat label="Source" value={aggregate.sourceLabel} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Source composition
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {aggregate.sourceComposition.map((c) => (
                    <li key={c.key}>
                      {c.label}: {c.count} ({c.percent}%)
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-slate-500">{aggregate.disclaimer}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Community prices' },
        ]}
        title="Community Material Price Reporting"
        description="Submit observed purchase prices for moderation. Unverified reports never enter Varnarc’s primary market prices. Public ranges use eligible verified reports only."
        lastUpdated="Aug 2026"
        form={formNode}
        result={
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-[#0b1f3a]">Moderation & privacy</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Statuses: pending, verified, rejected, flagged</li>
              <li>Rate limits and duplicate / outlier checks on submit</li>
              <li>Trust score from invoice, brand, supplier and history</li>
              <li>Contributor identity never shown publicly</li>
              <li>Invoice proofs are private downloads only</li>
            </ul>
            {meta ? (
              <p className="mt-3 text-xs text-slate-500">
                Limits: {meta.limits.maxPerDay}/day · {meta.limits.maxPending} pending · lookback{' '}
                {meta.limits.lookbackDays}d · min trust {meta.limits.minTrustForAggregate}
              </p>
            ) : null}
          </div>
        }
        methodology={
          <MethodologyPanel
            title="How community aggregates work"
            formula={meta?.methodology}
            steps={[
              'Submissions start as PENDING (or FLAGGED if duplicate/outlier signals).',
              'Only VERIFIED reports that pass trust and outlier gates enter the public aggregate.',
              'Primary market price hub never auto-reads this table.',
              'Source composition distinguishes invoice-backed vs text-only eligible reports.',
            ]}
          />
        }
        faqs={COMMUNITY_PRICE_FAQS}
        relatedTools={COMMUNITY_PRICE_RELATED}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={COMMUNITY_PRICE_RELATED} />
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-[#0b1f3a]">{value}</p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
