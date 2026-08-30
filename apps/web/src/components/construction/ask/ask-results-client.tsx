'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { cn, cx } from '@/components/construction/styles';
import type { AskCatalogItem, AskExtractedValues, AskIntentKind } from '@/lib/construction/ask';
import {
  queryLengthBucket,
  resultCountBucket,
  trackAskResultClicked,
  trackAskSearchPerformed,
  trackConstructionSearchNoResult,
} from '@/lib/construction/analytics';

export function AskResultsClient({
  query,
  intent,
  category,
  confidence,
  values,
  correctedTokens,
  results,
}: {
  query: string;
  intent: AskIntentKind;
  category: string;
  confidence: number;
  values: AskExtractedValues;
  correctedTokens: string[];
  results: AskCatalogItem[];
}) {
  useEffect(() => {
    trackAskSearchPerformed({
      intent,
      category,
      result_count_bucket: resultCountBucket(results.length),
      auto_routed: false,
      query_length_bucket: queryLengthBucket(query),
      path: '/construction/ask',
    });
    if (!results.length) {
      trackConstructionSearchNoResult({
        surface: 'ask_construction',
        query_length_bucket: queryLengthBucket(query),
        path: '/construction/ask',
      });
    }
  }, [query, intent, category, results.length]);

  const valueChips = [
    values.area != null ? `${values.area} sqft` : null,
    values.length != null && values.width != null
      ? `${values.length}×${values.width}${values.height != null ? `×${values.height}` : ''}`
      : null,
    values.location,
    values.material,
    values.bedrooms != null ? `${values.bedrooms} rooms` : null,
    values.floorCount != null ? `${values.floorCount} floors` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mt-8 max-w-3xl">
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Interpreted as
        </p>
        <p className="mt-1 text-sm font-bold text-[#0b1f3a]">
          {intent} · {category}{' '}
          <span className="font-normal text-slate-500">
            (confidence {Math.round(confidence * 100)}%)
          </span>
        </p>
        {valueChips.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {valueChips.map((chip) => (
              <li
                key={chip}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
        {correctedTokens.length ? (
          <p className="mt-2 text-xs text-slate-500">
            Typo tolerance applied: {correctedTokens.slice(0, 3).join(', ')}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-slate-600">
          We are not fully sure about a single destination — pick a result below, or browse
          crawlable Construction pages.
        </p>
      </div>

      {results.length ? (
        <ul className="mt-4 space-y-2">
          {results.map((item) => (
            <li key={`${item.id}-${item.href}`}>
              <Link
                href={item.href}
                onClick={() =>
                  trackAskResultClicked({
                    intent,
                    result_type: item.kind,
                    path: item.href,
                  })
                }
                className={cn(
                  cx.card,
                  'flex items-start justify-between gap-3 p-4 transition hover:ring-[#f97316]/40',
                  cx.focus,
                )}
              >
                <span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.kind}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-[#0b1f3a]">{item.label}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-[#f97316]">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          No strong matches. Try{' '}
          <Link href="/construction/estimate" className={cx.link}>
            cost estimator
          </Link>
          ,{' '}
          <Link href="/construction/materials" className={cx.link}>
            materials
          </Link>
          , or{' '}
          <Link href="/construction/guides" className={cx.link}>
            guides
          </Link>
          .
        </p>
      )}
    </div>
  );
}
