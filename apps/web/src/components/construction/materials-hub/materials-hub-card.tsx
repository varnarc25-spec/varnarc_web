import Link from 'next/link';
import { HardHat } from 'lucide-react';
import type { MaterialHubCard } from '@/lib/construction/materials-hub/catalog';
import { cn, cx } from '@/components/construction/styles';

export function MaterialsHubCard({ material }: { material: MaterialHubCard }) {
  const href = `/construction/materials/${material.slug}`;
  return (
    <article className={cn(cx.card, 'flex h-full flex-col p-4 sm:p-5')}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[#f97316]">
          <HardHat className="h-4 w-4" aria-hidden />
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {material.primaryCategory}
        </span>
      </div>
      <h3 className="text-lg font-bold text-[#0b1f3a]">
        <Link href={href} className={cn(cx.focus, 'hover:text-[#f97316]')}>
          {material.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {material.shortDescription}
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-sm">
        <li>
          <Link href={href} className={cx.link}>
            Overview
          </Link>
        </li>
        {material.calculator ? (
          <li>
            <Link href={material.calculator.href} className={cx.link}>
              Calculator
            </Link>
          </li>
        ) : null}
        {material.priceLink ? (
          <li>
            <Link href={material.priceLink.href} className={cx.link}>
              Prices
            </Link>
          </li>
        ) : null}
        {material.comparisonLinks[0] ? (
          <li>
            <Link href={material.comparisonLinks[0].href} className={cx.link}>
              Compare
            </Link>
          </li>
        ) : null}
        {material.guideLinks[0] ? (
          <li>
            <Link href={material.guideLinks[0].href} className={cx.link}>
              Guides
            </Link>
          </li>
        ) : null}
      </ul>
    </article>
  );
}
