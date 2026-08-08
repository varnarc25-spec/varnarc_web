import Link from 'next/link';
import { hubCategoryLabel } from '@/lib/hub-category-label';

export type HubGuideItem = {
  slug: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  readMinutes?: number | null;
  imageUrl?: string | null;
  href: string;
};

const PLACEHOLDER_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-indigo-500 to-blue-400',
];

export function HubGuideGrid({
  items,
  viewAllHref,
}: {
  items: HubGuideItem[];
  viewAllHref?: string;
}) {
  if (!items.length) return null;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[#0b1f3a] sm:text-2xl">
          Guides &amp; resources
        </h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm font-semibold text-blue-600 hover:underline">
            View all guides →
          </Link>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((item, index) => (
          <Link
            key={item.slug}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}`}
                />
              )}
            </div>
            <div className="p-4">
              {item.category ? (
                <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                  {hubCategoryLabel(item.category)}
                </span>
              ) : null}
              <h3 className="mt-1 text-sm font-extrabold text-[#0b1f3a] group-hover:text-blue-700 line-clamp-2">
                {item.title}
              </h3>
              {item.readMinutes != null ? (
                <p className="mt-2 text-xs text-slate-500">{item.readMinutes} min read</p>
              ) : item.summary ? (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{item.summary}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
