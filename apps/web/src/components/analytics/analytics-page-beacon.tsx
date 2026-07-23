'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalyticsSessionId, trackAnalyticsEvent } from '@/lib/analytics-client';

function utmParam(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const v = new URLSearchParams(window.location.search).get(name);
  return v || undefined;
}

const SCROLL_MILESTONES = [25, 50, 75, 100];

/**
 * Site-wide page_view + scroll depth beacons for the Analytics module.
 */
export function AnalyticsPageBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const scrollSent = useRef<Set<number>>(new Set());

  useEffect(() => {
    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    if (lastPath.current === path) return;
    lastPath.current = path;
    scrollSent.current.clear();

    trackAnalyticsEvent({
      eventType: 'page_view',
      path: pathname,
      source: utmParam('utm_source'),
      medium: utmParam('utm_medium'),
      campaign: utmParam('utm_campaign'),
      metadata: {
        search: searchParams?.toString() || undefined,
        title: typeof document !== 'undefined' ? document.title : undefined,
        sessionId: getAnalyticsSessionId(),
      },
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const height = doc.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / height) * 100));
      for (const milestone of SCROLL_MILESTONES) {
        if (pct >= milestone && !scrollSent.current.has(milestone)) {
          scrollSent.current.add(milestone);
          trackAnalyticsEvent({
            eventType: 'scroll',
            path: pathname,
            metadata: { depthPercent: milestone },
          });
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
