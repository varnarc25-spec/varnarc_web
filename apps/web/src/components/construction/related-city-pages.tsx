import Link from 'next/link';
import type { ConstructionLinkItem } from '@/components/construction/types';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';

export type RelatedCityPageItem = ConstructionLinkItem & {
  city?: string;
  state?: string | null;
};

/**
 * Internal links to city/region construction landing pages (prices, suppliers, guides).
 * Only pass published city routes — do not invent geo pages.
 */
export function RelatedCityPages({
  items,
  title = 'Related city pages',
  description,
  viewAllHref,
  viewAllLabel = 'Browse locations →',
}: {
  items: RelatedCityPageItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (!items.length) return null;

  return (
    <ConstructionSection
      id="related-city-pages"
      title={title}
      description={description}
      action={viewAllHref ? { href: viewAllHref, label: viewAllLabel } : undefined}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex flex-col rounded-lg border border-slate-200 bg-white px-4 py-3',
                'hover:border-[#f97316]',
                cx.focus,
              )}
            >
              <span className="text-sm font-semibold text-[#0b1f3a]">{item.label}</span>
              {item.city || item.state ? (
                <span className="mt-0.5 text-xs text-slate-500">
                  {[item.city, item.state].filter(Boolean).join(', ')}
                </span>
              ) : null}
              {item.description ? (
                <span className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </ConstructionSection>
  );
}
