import { Suspense, type ReactNode } from 'react';
import { ConstructionAnalyticsBeacon } from '@/components/construction/construction-analytics-beacon';

export default function ConstructionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <ConstructionAnalyticsBeacon />
      </Suspense>
      {children}
    </>
  );
}
