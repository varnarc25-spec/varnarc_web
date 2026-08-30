'use client';

import { useEffect, useRef } from 'react';
import { trackComparisonCompleted, trackComparisonStarted } from '@/lib/construction/analytics';

/** Fires comparison funnel events once per ids set on the compare page. */
export function ConstructionCompareAnalytics({
  itemCount,
  hasResults,
  loggedIn = false,
}: {
  itemCount: number;
  hasResults: boolean;
  loggedIn?: boolean;
}) {
  const startedKey = useRef<string | null>(null);
  const completedKey = useRef<string | null>(null);

  useEffect(() => {
    if (itemCount < 2) return;
    const key = String(itemCount);
    if (startedKey.current !== key) {
      startedKey.current = key;
      trackComparisonStarted({
        path: '/construction/compare',
        comparison_item_count: itemCount,
      });
    }
    if (hasResults && completedKey.current !== key) {
      completedKey.current = key;
      trackComparisonCompleted({
        path: '/construction/compare',
        comparison_item_count: itemCount,
        logged_in: loggedIn,
      });
    }
  }, [itemCount, hasResults, loggedIn]);

  return null;
}
