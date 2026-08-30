'use client';

import Link from 'next/link';
import type { ConstructionLinkItem } from '@/components/construction/types';
import { RelatedTools } from '@/components/construction/related-tools';
import { RelatedGuides } from '@/components/construction/related-guides';
import { RelatedMaterials } from '@/components/construction/related-materials';
import {
  RelatedComparisons,
  type RelatedComparisonItem,
} from '@/components/construction/related-comparisons';
import {
  RelatedCityPages,
  type RelatedCityPageItem,
} from '@/components/construction/related-city-pages';
import type { RelatedMaterialItem } from '@/components/construction/related-materials';
import { cn, cx } from '@/components/construction/styles';

/**
 * Related calculator links (SEO internal linking). Prefer over the chip-only compat export.
 * Pages that still pass `links={...}` should use `related-calculators-compat`.
 */
export function RelatedCalculatorLinks(props: {
  items: ConstructionLinkItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  variant?: 'cards' | 'chips';
  onItemClick?: (href: string) => void;
}) {
  return (
    <RelatedTools
      {...props}
      title={props.title ?? 'Related calculators'}
      viewAllHref={props.viewAllHref ?? '/construction'}
      viewAllLabel={props.viewAllLabel ?? 'All construction tools →'}
    />
  );
}

type ConstructionRelatedLinksProps = {
  calculators?: ConstructionLinkItem[];
  materials?: RelatedMaterialItem[];
  comparisons?: RelatedComparisonItem[];
  cityPages?: RelatedCityPageItem[];
  guides?: Array<ConstructionLinkItem & { category?: string | null; readMinutes?: number }>;
  className?: string;
  /** Fired when a related link is activated (CTR). */
  onLinkClick?: (href: string) => void;
};

/**
 * Composes reusable Construction internal-link blocks for SEO & navigation.
 * Omit empty sections — nothing is rendered for missing lists.
 */
export function ConstructionRelatedLinks({
  calculators,
  materials,
  comparisons,
  cityPages,
  guides,
  className,
  onLinkClick,
}: ConstructionRelatedLinksProps) {
  const hasAny =
    (calculators?.length ?? 0) +
      (materials?.length ?? 0) +
      (comparisons?.length ?? 0) +
      (cityPages?.length ?? 0) +
      (guides?.length ?? 0) >
    0;
  if (!hasAny) return null;

  const wrapClick = (href: string) => {
    onLinkClick?.(href);
  };

  return (
    <div
      className={cn('space-y-10', className)}
      onClickCapture={(e) => {
        if (!onLinkClick) return;
        const target = e.target as HTMLElement | null;
        const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor?.href) return;
        try {
          const path = new URL(anchor.href, window.location.origin).pathname;
          wrapClick(path);
        } catch {
          /* ignore */
        }
      }}
    >
      {calculators?.length ? <RelatedCalculatorLinks items={calculators} /> : null}
      {materials?.length ? <RelatedMaterials items={materials} /> : null}
      {comparisons?.length ? <RelatedComparisons items={comparisons} /> : null}
      {cityPages?.length ? <RelatedCityPages items={cityPages} /> : null}
      {guides?.length ? <RelatedGuides items={guides} /> : null}
    </div>
  );
}

/** Compact chip row for in-content SEO links without full section chrome. */
export function ConstructionInlineRelatedLinks({
  items,
  label = 'Related',
}: {
  items: ConstructionLinkItem[];
  label?: string;
}) {
  if (!items.length) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0b1f3a]',
            'hover:border-[#f97316] hover:text-[#f97316]',
            cx.focus,
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
