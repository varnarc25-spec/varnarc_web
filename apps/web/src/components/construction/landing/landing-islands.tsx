'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/construction/loading-state';

const cardsFallback = (label: string) => <LoadingState label={label} variant="cards" />;

/** Below-fold hub islands — split from the initial Construction JS bundle. */
export const CurrentConstructionProjectSummary = dynamic(
  () =>
    import('@/components/construction/landing/current-construction-project').then(
      (m) => m.CurrentConstructionProjectSummary,
    ),
  { loading: () => cardsFallback('Loading current project') },
);

export const ConstructionRecentlyUsedTools = dynamic(
  () =>
    import('@/components/construction/landing/recently-used-tools').then(
      (m) => m.ConstructionRecentlyUsedTools,
    ),
  { loading: () => cardsFallback('Loading recent tools') },
);

export const ConstructionMaterialQuantityCompact = dynamic(
  () =>
    import('@/components/construction/landing/material-quantity-compact').then(
      (m) => m.ConstructionMaterialQuantityCompact,
    ),
  { loading: () => cardsFallback('Loading material calculator') },
);

export const ConstructionRenovationCostCompact = dynamic(
  () =>
    import('@/components/construction/landing/renovation-cost-compact').then(
      (m) => m.ConstructionRenovationCostCompact,
    ),
  { loading: () => cardsFallback('Loading renovation calculator') },
);

export const ConstructionLandingCompare = dynamic(
  () =>
    import('@/components/construction/landing/landing-compare').then(
      (m) => m.ConstructionLandingCompare,
    ),
  { loading: () => cardsFallback('Loading comparisons') },
);

export const ConstructionPlanJourney = dynamic(
  () =>
    import('@/components/construction/landing/plan-journey').then((m) => m.ConstructionPlanJourney),
  { loading: () => cardsFallback('Loading plan journey') },
);

export const ConstructionNextBestActions = dynamic(
  () =>
    import('@/components/construction/landing/next-best-actions').then(
      (m) => m.ConstructionNextBestActions,
    ),
  { loading: () => cardsFallback('Loading next actions') },
);
