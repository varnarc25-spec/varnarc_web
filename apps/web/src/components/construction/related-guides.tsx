import type { ConstructionLinkItem } from '@/components/construction/types';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ConstructionTrackLink } from '@/components/construction/construction-track-link';
import { cn, cx } from '@/components/construction/styles';

export function RelatedGuides({
  items,
  title = 'Related guides',
  description,
  viewAllHref,
  viewAllLabel = 'View all guides →',
}: {
  items: Array<ConstructionLinkItem & { category?: string | null; readMinutes?: number }>;
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (!items.length) return null;

  return (
    <ConstructionSection
      id="related-guides"
      title={title}
      description={description}
      action={viewAllHref ? { href: viewAllHref, label: viewAllLabel } : undefined}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const guideKey = item.href.split('/').filter(Boolean).pop();
          return (
            <li key={item.href}>
              <ConstructionTrackLink
                href={item.href}
                kind="guide"
                itemKey={guideKey}
                className={cn(
                  cx.card,
                  'block h-full p-4 transition hover:ring-[#f97316]/40',
                  cx.focus,
                )}
              >
                {item.category ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f97316]">
                    {item.category}
                  </p>
                ) : null}
                <h3 className="mt-1 text-sm font-bold text-[#0b1f3a]">{item.label}</h3>
                {item.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                ) : null}
                {item.readMinutes != null ? (
                  <p className="mt-2 text-xs text-slate-500">{item.readMinutes} min read</p>
                ) : null}
              </ConstructionTrackLink>
            </li>
          );
        })}
      </ul>
    </ConstructionSection>
  );
}
