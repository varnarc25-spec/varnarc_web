'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getApiBaseUrl } from '@/services/api-client';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { QUICK_ESTIMATOR_LOCATIONS } from '@/lib/construction/landing';
import {
  categorizeConstructionResultRange,
  resolveConstructionLocationLevel,
  trackCalculatorCompleted,
  trackCalculatorError,
  trackCalculatorStarted,
  trackLandingCtaClicked,
} from '@/lib/construction/analytics';

type EstimateResult = {
  totalCost?: number | string | null;
  materialCost?: number | string | null;
  laborCost?: number | string | null;
};

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Lightweight landing estimator — no full estimate form bundle.
 * Uses the public estimate API and shows an approximate range only.
 */
export function ConstructionQuickEstimator() {
  const [location, setLocation] = useState<string>(QUICK_ESTIMATOR_LOCATIONS[0]);
  const [area, setArea] = useState('1500');
  const [floors, setFloors] = useState('1');
  const [quality, setQuality] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const range = useMemo(() => {
    if (total == null || !Number.isFinite(total)) return null;
    return {
      low: Math.round(total * 0.88),
      mid: Math.round(total),
      high: Math.round(total * 1.12),
    };
  }, [total]);

  async function onEstimate() {
    setLoading(true);
    setError(null);
    trackCalculatorStarted({
      calculator_type: 'landing_quick_estimator',
      logged_in: false,
    });
    try {
      const areaSqft = Number(area);
      const floorCount = Math.max(1, Number(floors) || 1);
      if (!areaSqft || areaSqft < 100) {
        throw new Error('Enter a built-up area of at least 100 sqft');
      }
      // Built-up is total area; floors slightly adjust structural load factor in the request via area.
      const effectiveArea = Math.round(areaSqft * (1 + Math.max(0, floorCount - 1) * 0.04));
      const region =
        location === 'Other / India average' ? undefined : location.replace(' NCR', '');

      const res = await fetch(`${getApiBaseUrl()}/construction/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaSqft: effectiveArea,
          quality,
          region,
        }),
      });
      const json = (await res.json()) as { data?: EstimateResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Estimate failed');
      const value = json.data?.totalCost != null ? Number(json.data.totalCost) : null;
      if (value == null || !Number.isFinite(value)) throw new Error('No estimate returned');
      setTotal(value);
      trackCalculatorCompleted({
        calculator_type: 'landing_quick_estimator',
        unit: 'sqft',
        location_level: resolveConstructionLocationLevel({
          hasCity: Boolean(region),
          hasNational: !region,
        }),
        result_range_category: categorizeConstructionResultRange(value),
        logged_in: false,
      });
    } catch (err) {
      setTotal(null);
      setError(err instanceof Error ? err.message : 'Estimate failed');
      trackCalculatorError({
        calculator_type: 'landing_quick_estimator',
        error_code: 'quick_estimate_failed',
        logged_in: false,
      });
    } finally {
      setLoading(false);
    }
  }

  const fullHref = `/construction/estimate?areaSqft=${encodeURIComponent(area)}&quality=${quality}${
    location !== 'Other / India average'
      ? `&region=${encodeURIComponent(location.replace(' NCR', ''))}`
      : ''
  }`;

  return (
    <ConstructionSection
      id="quick-estimator"
      title="Quick estimator"
      description="Get an approximate cost range in seconds — then open the full calculator for rooms and line items."
    >
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="qe-location" className={cx.label}>
              Location
            </label>
            <select
              id="qe-location"
              className={cx.input}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {QUICK_ESTIMATOR_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qe-area" className={cx.label}>
              Built-up area (sqft)
            </label>
            <input
              id="qe-area"
              inputMode="numeric"
              className={cx.input}
              value={area}
              onChange={(e) => setArea(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <div>
            <label htmlFor="qe-floors" className={cx.label}>
              Number of floors
            </label>
            <select
              id="qe-floors"
              className={cx.input}
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            >
              {['1', '2', '3', '4'].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qe-quality" className={cx.label}>
              Construction quality
            </label>
            <select
              id="qe-quality"
              className={cx.input}
              value={quality}
              onChange={(e) => setQuality(e.target.value as typeof quality)}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            className={cx.primaryBtn}
            disabled={loading}
            onClick={() => void onEstimate()}
          >
            {loading ? 'Estimating…' : 'Estimate range'}
          </button>
          <Link
            href={fullHref}
            className={cx.secondaryBtn}
            onClick={() =>
              trackLandingCtaClicked({
                cta_key: 'quick_estimator_full',
                surface: 'quick_estimator',
                path: '/construction/estimate',
              })
            }
          >
            Open full calculator
          </Link>
        </div>

        {error ? <p className={cn(cx.error, 'mt-3')}>{error}</p> : null}

        {range ? (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approximate range
            </p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(range.low)} – {formatInr(range.high)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Mid estimate ~{formatInr(range.mid)}. Indicative only — verify local rates before
              budgeting.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Enter location, built-up area, floors and quality to see a planning range. No personal
            data is required.
          </p>
        )}
      </div>
    </ConstructionSection>
  );
}
