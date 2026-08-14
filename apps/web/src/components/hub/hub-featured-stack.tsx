import Link from 'next/link';
import { Landmark } from 'lucide-react';

export type HubFeaturedItem = {
  id: string;
  name: string;
  description?: string | null;
  href: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  bullets?: string[];
};

export function HubFeaturedStack({
  title,
  items,
  viewAllHref,
  compact = false,
  layout = 'stack',
  variant = 'default',
}: {
  title: string;
  items: HubFeaturedItem[];
  viewAllHref?: string;
  compact?: boolean;
  layout?: 'stack' | 'row';
  variant?: 'default' | 'panel';
}) {
  const isRow = layout === 'row';
  const isPanel = variant === 'panel';

  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-white h-full min-h-0 ${
        isPanel || compact ? 'p-4 shadow-sm' : 'p-5 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-[#0b1f3a]">{title}</h3>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
          >
            View all →
          </Link>
        ) : null}
      </div>

      <ul className={isRow ? 'mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'mt-3 space-y-3'}>
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
            <div className="flex items-center gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className={`shrink-0 rounded-md object-cover ${
                    isRow ? 'h-16 w-full' : 'h-12 w-12'
                  }`}
                />
              ) : (
                <div
                  className={`flex shrink-0 items-center justify-center rounded-md bg-white text-[var(--varnarc-brand)] ${
                    isRow ? 'h-16 w-full' : 'h-12 w-12'
                  }`}
                >
                  <Landmark className="h-5 w-5" aria-hidden />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#0b1f3a] line-clamp-2">{item.name}</div>
                {item.bullets?.length ? (
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {item.bullets.slice(0, 2).map((line) => (
                      <li key={line} className="line-clamp-1">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : item.description ? (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                ) : null}
              </div>

              {!isRow ? (
                <Link
                  href={item.href}
                  className="inline-flex shrink-0 min-h-9 items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {item.ctaLabel ?? 'View Details'}
                </Link>
              ) : null}
            </div>

            {isRow ? (
              <Link
                href={item.href}
                className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {item.ctaLabel ?? 'View Details'}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
