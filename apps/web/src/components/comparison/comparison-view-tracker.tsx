'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export function ComparisonViewTracker({ comparisonId }: { comparisonId: string }) {
  useEffect(() => {
    trackAnalyticsEvent({
      eventType: 'custom',
      entityType: 'comparison',
      entityId: comparisonId,
      metadata: { eventName: 'comparison_viewed' },
    });
    void fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/comparisons/${comparisonId}/view`,
      { method: 'POST' },
    ).catch(() => undefined);
  }, [comparisonId]);

  return null;
}
