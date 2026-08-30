import Link from 'next/link';
import type { ConstructionLinkItem } from '@/components/construction/types';
import { ConstructionSection } from '@/components/construction/construction-section';
import { MaterialCard } from '@/components/construction/material-card';
import { cn, cx } from '@/components/construction/styles';

export type RelatedMaterialItem = ConstructionLinkItem & {
  meta?: string | null;
  price?: number | string | null;
  unit?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  materialKey?: string;
};

export function RelatedMaterials({
  items,
  title = 'Related materials',
  description,
  viewAllHref = '/construction/materials',
  viewAllLabel = 'Browse materials →',
  variant = 'cards',
}: {
  items: RelatedMaterialItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  variant?: 'cards' | 'chips';
}) {
  if (!items.length) return null;

  return (
    <ConstructionSection
      id="related-materials"
      title={title}
      description={description}
      action={viewAllHref ? { href: viewAllHref, label: viewAllLabel } : undefined}
    >
      {variant === 'chips' ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0b1f3a]',
                'hover:border-[#f97316] hover:text-[#f97316]',
                cx.focus,
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MaterialCard
              key={item.href}
              href={item.href}
              name={item.label}
              description={item.description}
              meta={item.meta}
              price={item.price}
              unit={item.unit}
              featured={item.featured}
              sponsored={item.sponsored}
              materialKey={item.materialKey}
            />
          ))}
        </div>
      )}
    </ConstructionSection>
  );
}
