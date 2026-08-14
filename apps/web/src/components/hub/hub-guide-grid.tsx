import Link from 'next/link';
import { HubGuideCard } from '@/components/hub/hub-guide-card';
import type { HubGuideItem } from '@/components/hub/hub-guide-card-types';

export type { HubGuideItem };

export function HubGuideGrid({
  items,
  viewAllHref,
  title = 'Financial guides & resources',
  maxItems = 4,
}: {
  items: HubGuideItem[];
  viewAllHref?: string;
  title?: string;
  maxItems?: number;
}) {
  if (!items.length) return null;

  const displayItems = items.slice(0, maxItems);

  return (
    <section aria-labelledby="hub-guides-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2
          id="hub-guides-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          {title}
        </h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm font-semibold text-blue-600 hover:underline">
            View all guides →
          </Link>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((item, index) => (
          <HubGuideCard key={`${item.slug}-${index}`} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
