'use client';

import { useEffect } from 'react';

export function ComparisonViewTracker({ comparisonId }: { comparisonId: string }) {
  useEffect(() => {
    void fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/comparisons/${comparisonId}/view`,
      { method: 'POST' },
    ).catch(() => undefined);
  }, [comparisonId]);

  return null;
}
