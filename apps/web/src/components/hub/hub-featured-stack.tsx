import Link from 'next/link';
import { Landmark } from 'lucide-react';

export type HubFeaturedItem = {
  id: string;
  name: string;
  description?: string | null;
  href: string;
  ctaLabel?: string;
};

export function HubFeaturedStack({
  title,
  items,
  viewAllHref,
}: {
  title: string;
  items: HubFeaturedItem[];
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
      <h3 className="text-base font-extrabold text-[#0b1f3a]">{title}</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--varnarc-brand)] shadow-sm">
                <Landmark className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#0b1f3a]">{item.name}</div>
                {item.description ? (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                ) : null}
                <Link
                  href={item.href}
                  className="mt-2 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {item.ctaLabel ?? 'View details'}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
        >
          View all →
        </Link>
      ) : null}
    </div>
  );
}
