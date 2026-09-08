'use client';

import Link from 'next/link';
import { trackCityPageCalculator } from '@/lib/construction/analytics';
import { cx } from '@/components/construction/styles';

export function ConstructionCostCityCtas({
  calculatorHref,
  cityName,
}: {
  calculatorHref: string;
  cityName: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={calculatorHref}
        className={cx.primaryBtn}
        onClick={() => trackCityPageCalculator({ path: calculatorHref })}
      >
        Open calculator prefilled for {cityName}
      </Link>
      <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
        Full cost calculator
      </Link>
    </div>
  );
}
