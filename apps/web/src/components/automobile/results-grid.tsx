'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AutomobileModelSummary } from '@/services/automobile';
import { trackAutomobileEvent } from '@/lib/automobile/analytics';
import { AutomobileDiscoveryCard } from './discovery-card';
import { AutomobileCompareTray } from './compare-tray';

export function AutomobileResultsGrid({
  models,
  total,
  page,
  pageSize,
  sort,
  basePath,
  search,
}: {
  models: AutomobileModelSummary[];
  total: number;
  page: number;
  pageSize: number;
  sort?: string;
  basePath: string;
  search?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      trackAutomobileEvent('vehicle_compare_added');
      return [...prev, id];
    });
  }

  const hrefFor = useMemo(() => {
    return (next: { page?: number; sort?: string }) => {
      const url = new URL(basePath, 'https://varnarc.com');
      const sp = new URLSearchParams(search);
      if (next.page && next.page > 1) sp.set('page', String(next.page));
      else sp.delete('page');
      if (next.sort) sp.set('sort', next.sort);
      const q = sp.toString();
      return q ? `${url.pathname}?${q}` : url.pathname;
    };
  }, [basePath, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{total} cars found</p>
        <label className="flex items-center gap-2 text-sm">
          Sort
          <select
            className="h-11 rounded-md border border-slate-200 px-2"
            defaultValue={sort || 'featured'}
            onChange={(e) => {
              trackAutomobileEvent('automobile_filter_used', { sort: e.target.value });
              router.push(hrefFor({ sort: e.target.value, page: 1 }));
            }}
          >
            <option value="featured">Newest updates</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="mileage">Mileage</option>
            <option value="newest">Newest model year</option>
          </select>
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => (
          <AutomobileDiscoveryCard
            key={`${model.manufacturerId}-${model.model}`}
            model={model}
            selected={selected.includes(model.representativeId)}
            onToggleCompare={toggle}
          />
        ))}
      </div>
      {pages > 1 ? (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
          {page > 1 ? (
            <Link
              className="min-h-11 rounded-lg border px-4 py-2 text-sm"
              href={hrefFor({ page: page - 1, sort })}
            >
              Previous
            </Link>
          ) : null}
          <span className="min-h-11 px-3 py-2 text-sm">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              className="min-h-11 rounded-lg border px-4 py-2 text-sm"
              href={hrefFor({ page: page + 1, sort })}
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
      <AutomobileCompareTray ids={selected} onClear={() => setSelected([])} />
    </div>
  );
}
