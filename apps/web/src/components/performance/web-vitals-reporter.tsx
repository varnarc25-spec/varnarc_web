'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { getAnalyticsSessionId } from '@/lib/analytics-client';

function sendVitals(path: string, metrics: Metric[]) {
  if (!metrics.length) return;

  const body = {
    path,
    sessionId: getAnalyticsSessionId(),
    connectionType:
      typeof navigator !== 'undefined' && 'connection' in navigator
        ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
            ?.effectiveType
        : undefined,
    metrics: metrics.map((m) => ({
      name: m.name,
      value: m.value,
      rating: m.rating,
      navigationType: m.navigationType,
    })),
  };

  void fetch('/api/analytics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to the analytics API for RUM.
 */
export function WebVitalsReporter() {
  const pathname = usePathname();
  const buffer = useRef<Metric[]>([]);
  const sentForPath = useRef<string | null>(null);

  useEffect(() => {
    buffer.current = [];
    sentForPath.current = null;

    function capture(metric: Metric) {
      buffer.current.push(metric);
    }

    onLCP(capture);
    onINP(capture);
    onCLS(capture);
    onFCP(capture);
    onTTFB(capture);

    const flush = () => {
      if (sentForPath.current === pathname) return;
      sentForPath.current = pathname;
      sendVitals(pathname, [...buffer.current]);
    };

    const timer = window.setTimeout(flush, 4000);
    const onHide = () => flush();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });

    return () => {
      window.clearTimeout(timer);
      flush();
    };
  }, [pathname]);

  return null;
}
