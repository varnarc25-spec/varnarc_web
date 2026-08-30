'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  logConstructionSearchOpportunity,
  queryLengthBucket,
  resolveConstructionPageKey,
  trackConstructionSearchNoResult,
  trackSearchPerformed,
} from '@/lib/construction/analytics';

/** Listing pages pass resultCount so search funnels can emit no-result safely. */
export function ConstructionSearchAnalytics({ resultCount }: { resultCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const q = searchParams?.get('search') || searchParams?.get('q');
    if (q == null || q === '') return;

    const key = `${pathname}|${q.length}|${resultCount}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const surface = resolveConstructionPageKey(pathname);
    const bucket = queryLengthBucket(q);
    trackSearchPerformed({
      surface,
      query_length_bucket: bucket,
      result_count_bucket: resultCount <= 0 ? 'none' : resultCount <= 5 ? 'few' : 'many',
      path: pathname,
    });
    logConstructionSearchOpportunity({
      query: q,
      surface,
      resultCount,
      path: pathname,
    });
    if (resultCount === 0) {
      trackConstructionSearchNoResult({
        surface,
        query_length_bucket: bucket,
        path: pathname,
      });
    }
  }, [pathname, searchParams, resultCount]);

  return null;
}
