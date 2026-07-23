'use client';

import { Suspense } from 'react';
import { AnalyticsPageBeacon } from './analytics-page-beacon';

export function AnalyticsPageBeaconRoot() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageBeacon />
    </Suspense>
  );
}
