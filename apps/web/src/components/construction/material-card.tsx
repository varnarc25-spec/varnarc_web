'use client';

import Link from 'next/link';
import { HardHat } from 'lucide-react';
import { cn, cx } from '@/components/construction/styles';
import {
  logConstructionSearchOpportunityClick,
  trackPriceViewed,
  trackSearchResultClicked,
} from '@/lib/construction/analytics';

/**
 * Canonical material card for Construction catalogs.
 * Prefer this over one-off card markup.
 */
export function MaterialCard({
  name,
  href,
  description,
  meta,
  featured,
  sponsored,
  price,
  unit,
  className,
  trackAsSearchResult = false,
  trackPrice = false,
  materialKey,
}: {
  name: string;
  href: string;
  description?: string | null;
  meta?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  price?: number | string | null;
  unit?: string | null;
  className?: string;
  trackAsSearchResult?: boolean;
  trackPrice?: boolean;
  /** Opaque slug/id only — never a free-text label. */
  materialKey?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (trackAsSearchResult) {
          trackSearchResultClicked({
            surface: 'materials',
            result_type: 'material',
            path: href,
          });
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const q = params.get('search') || params.get('q');
            if (q) {
              logConstructionSearchOpportunityClick({ query: q, surface: 'materials' });
            }
          }
        }
        if (trackPrice && price != null && price !== '') {
          trackPriceViewed({
            material_key: materialKey,
            location_level: 'unknown',
            path: href,
          });
        }
      }}
      className={cn(
        cx.card,
        'group flex h-full flex-col p-4 transition hover:ring-[#f97316]/40',
        cx.focus,
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[#f97316]">
          <HardHat className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          {sponsored ? (
            <span className="rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          ) : null}
          {featured ? (
            <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          ) : null}
        </div>
      </div>
      <h3 className="text-base font-bold text-[#0b1f3a] group-hover:text-[#f97316]">{name}</h3>
      {description ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {meta ? <p className="mt-2 text-xs font-medium text-slate-600">{meta}</p> : null}
      {price != null && price !== '' ? (
        <p className="mt-auto pt-3 text-sm font-semibold tabular-nums text-[#0b1f3a]">
          ₹{price}
          {unit ? <span className="font-normal text-slate-500"> / {unit}</span> : null}
          <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
            Indicative price — verify locally
          </span>
        </p>
      ) : null}
    </Link>
  );
}
