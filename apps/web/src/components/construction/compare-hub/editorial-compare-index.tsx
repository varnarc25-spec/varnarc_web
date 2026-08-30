import Link from 'next/link';
import {
  COMPARE_CATEGORIES,
  COMPARE_HUB_QUALIFICATION,
  listEditorialComparisons,
  type CompareHubCategoryId,
} from '@/lib/construction/compare-hub/catalog';
import { cn, cx } from '@/components/construction/styles';

export function EditorialCompareIndex({
  activeCategory = 'all',
}: {
  activeCategory?: CompareHubCategoryId | 'all';
}) {
  const items = listEditorialComparisons(activeCategory);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0b1f3a]">Editorial comparisons</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{COMPARE_HUB_QUALIFICATION}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/construction/compare"
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm font-medium',
            activeCategory === 'all'
              ? 'border-[#f97316] text-[#f97316]'
              : 'border-slate-200 text-[#0b1f3a]',
          )}
        >
          All
        </Link>
        {COMPARE_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/construction/compare?category=${cat.id}`}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium',
              activeCategory === cat.id
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-slate-200 text-[#0b1f3a]',
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((cmp) => (
          <li key={cmp.slug} className={cn(cx.card, 'flex flex-col p-4 sm:p-5')}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {COMPARE_CATEGORIES.find((c) => c.id === cmp.category)?.label}
            </p>
            <h3 className="mt-1 text-base font-bold text-[#0b1f3a]">
              <Link href={`/construction/compare/${cmp.slug}`} className="hover:text-[#f97316]">
                {cmp.title}
              </Link>
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{cmp.shortSummary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-md bg-slate-100 px-2 py-1">{cmp.leftName}</span>
              <span className="self-center text-slate-400">vs</span>
              <span className="rounded-md bg-slate-100 px-2 py-1">{cmp.rightName}</span>
            </div>
            <Link
              href={`/construction/compare/${cmp.slug}`}
              className={cn(cx.primaryBtn, 'mt-4 inline-flex self-start')}
            >
              Open comparison
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
