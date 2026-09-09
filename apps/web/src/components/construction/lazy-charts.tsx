'use client';

import dynamic from 'next/dynamic';

const ChartSkeleton = (
  <div
    className="h-60 w-full rounded-xl bg-slate-100 motion-reduce:animate-none"
    role="status"
    aria-label="Loading chart"
  />
);

export const SimpleLineChart = dynamic(
  () => import('@/components/shared/simple-chart').then((m) => m.SimpleLineChart),
  { ssr: false, loading: () => ChartSkeleton },
);

export const GroupedBarChart = dynamic(
  () => import('@/components/shared/simple-chart').then((m) => m.GroupedBarChart),
  { ssr: false, loading: () => ChartSkeleton },
);
