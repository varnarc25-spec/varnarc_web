'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  isConstructionAnalyticsPath,
  resolveConstructionPageKey,
  trackConstructionCategoryView,
  trackConstructionPageView,
} from '@/lib/construction/analytics';

/**
 * Construction-scoped beacons (in addition to the global page_view beacon).
 * Mount under `/construction` layout.
 * Search result counts: use `ConstructionSearchAnalytics` on listing pages.
 */
export function ConstructionAnalyticsBeacon({ loggedIn = false }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !isConstructionAnalyticsPath(pathname)) return;

    const search = searchParams?.toString() ?? '';
    const key = `${pathname}?${search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const pageKey = resolveConstructionPageKey(pathname);
    trackConstructionPageView({
      page_key: pageKey,
      path: pathname,
      logged_in: loggedIn,
    });

    const categoryId = searchParams?.get('categoryId') || searchParams?.get('category');
    if (categoryId) {
      trackConstructionCategoryView({
        category_key: categoryId.slice(0, 80),
        path: pathname,
      });
    }
  }, [pathname, searchParams, loggedIn]);

  return null;
}
