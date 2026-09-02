'use client';

import Link from 'next/link';
import { Button } from '@varnarc/ui';

export function AutomobileCompareTray({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  if (ids.length === 0) return null;
  const href = `/automobile/compare?ids=${ids.join(',')}`;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(11,31,58,0.12)] backdrop-blur"
      role="region"
      aria-label="Vehicle comparison"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#0b1f3a]">
          {ids.length} vehicle{ids.length === 1 ? '' : 's'} selected
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClear}>
            Clear
          </Button>
          <Link
            href={href}
            className="inline-flex h-10 items-center rounded-md bg-[#ea580c] px-4 text-sm font-semibold text-white"
          >
            Compare now
          </Link>
        </div>
      </div>
    </div>
  );
}
