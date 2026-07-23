'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
] as const;

function AnalyticsDateFilterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const period = params.get('period') || 'month';

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            period === p.value
              ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]'
              : 'border-[var(--varnarc-border)]'
          }`}
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.set('period', p.value);
            router.push(`?${next.toString()}`);
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsDateFilter() {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <AnalyticsDateFilterInner />
    </Suspense>
  );
}
