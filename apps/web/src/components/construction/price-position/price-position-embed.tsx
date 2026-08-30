'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
  calculateMaterialPricePosition,
  type MaterialPricePositionResult,
  type PriceFreshness,
} from '@varnarc/validation';
import type { PriceObservation } from '@/lib/construction/prices-hub/api';
import { cx } from '@/components/construction/styles';
import { PricePositionResultCard } from './price-position-result-card';

function toClaimed(obs: PriceObservation): PriceFreshness {
  const c = (obs.claimedFreshness || obs.freshness || 'ESTIMATED').toUpperCase();
  if (c === 'LIVE' || c === 'VERIFIED' || c === 'ESTIMATED' || c === 'STALE') return c;
  return 'ESTIMATED';
}

/**
 * Compact embed for material×city price landings — historical position only.
 */
export function PricePositionEmbed({
  materialKey,
  citySlug,
  materialLabel,
  cityName,
  history,
}: {
  materialKey: string;
  citySlug: string;
  materialLabel: string;
  cityName: string;
  history: PriceObservation[];
}) {
  const [result, setResult] = useState<MaterialPricePositionResult | null>(null);

  useEffect(() => {
    const observations = history.map((o) => ({
      id: o.id,
      price: o.price,
      unit: o.unit,
      currency: o.currency,
      claimed: toClaimed(o),
      verifiedAt: o.verifiedAt,
      effectiveFrom: o.effectiveFrom,
    }));
    setResult(
      calculateMaterialPricePosition(
        {
          materialKey,
          locationSlug: citySlug,
          windowDays: MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
        },
        observations,
      ),
    );
  }, [materialKey, citySlug, history]);

  if (!result) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Price position (last 90 days)</h2>
        <Link
          href={`/construction/price-position?material=${materialKey}&location=${citySlug}`}
          className={cx.secondaryBtn}
        >
          Open full tool
        </Link>
      </div>
      <PricePositionResultCard result={result} materialLabel={materialLabel} cityName={cityName} />
    </div>
  );
}
