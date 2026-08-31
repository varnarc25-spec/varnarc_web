'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/construction/loading-state';

/** Client wrapper — next/dynamic `ssr: false` is not allowed in Server Components. */
export const ConstructionQuickEstimator = dynamic(
  () =>
    import('@/components/construction/landing/quick-estimator').then(
      (m) => m.ConstructionQuickEstimator,
    ),
  {
    loading: () => <LoadingState label="Loading estimator" variant="form" />,
    ssr: false,
  },
);
