import Link from 'next/link';
import type { ConstructionLinkItem } from '@/components/construction/types';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ComparisonCard } from '@/components/construction/comparison-card';
import { cn, cx } from '@/components/construction/styles';

export type RelatedComparisonItem = ConstructionLinkItem & {
  leftLabel?: string;
  rightLabel?: string;
  summary?: string;
};

function vsParts(title: string): [string, string] {
  const parts = title.split(/\s+vs\.?\s+/i);
  return [parts[0]?.trim() || title, parts[1]?.trim() || 'Compare'];
}

export function RelatedComparisons({
  items,
  title = 'Related comparisons',
  description,
  viewAllHref = '/construction/compare',
  viewAllLabel = 'All comparisons →',
  variant = 'cards',
}: {
  items: RelatedComparisonItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  variant?: 'cards' | 'list';
}) {
  if (!items.length) return null;

  return (
    <ConstructionSection
      id="related-comparisons"
      title={title}
      description={description}
      action={viewAllHref ? { href: viewAllHref, label: viewAllLabel } : undefined}
    >
      {variant === 'list' ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0b1f3a]',
                  'hover:border-[#f97316] hover:text-[#f97316]',
                  cx.focus,
                )}
              >
                {item.label}
                {item.description ? (
                  <span className="mt-0.5 block text-xs font-normal text-slate-600">
                    {item.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const [leftName, rightName] = vsParts(item.label);
            return (
              <ComparisonCard
                key={item.href}
                href={item.href}
                title={item.label}
                summary={item.summary ?? item.description ?? undefined}
                leftLabel={item.leftLabel ?? leftName}
                rightLabel={item.rightLabel ?? rightName}
              />
            );
          })}
        </div>
      )}
    </ConstructionSection>
  );
}
