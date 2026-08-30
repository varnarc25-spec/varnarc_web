import Link from 'next/link';
import type { SupplierCard } from '@/lib/construction/supplier-directory/api';
import { cn } from '@/components/construction/styles';

export function SupplierCardView({
  supplier,
  className,
}: {
  supplier: SupplierCard;
  className?: string;
}) {
  return (
    <Link
      href={supplier.href}
      className={cn(
        'block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-extrabold text-[#0b1f3a]">{supplier.name}</h2>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {supplier.sponsored ? (
            <span className="rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          ) : null}
          {supplier.verified ? (
            <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Verified
            </span>
          ) : null}
        </div>
      </div>
      {supplier.categoryLabels.length ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {supplier.categoryLabels.join(' · ')}
        </p>
      ) : null}
      {supplier.location.city ? (
        <p className="mt-2 text-sm text-slate-600">{supplier.location.city}</p>
      ) : null}
      {supplier.brands.length ? (
        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
          Brands: {supplier.brands.slice(0, 4).join(', ')}
          {supplier.brands.length > 4 ? '…' : ''}
        </p>
      ) : null}
      {supplier.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{supplier.description}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-400">
        Updated {new Date(supplier.lastUpdated).toLocaleDateString('en-IN')}
      </p>
      <span className="mt-3 inline-block text-sm font-medium text-[#f97316]">View profile →</span>
    </Link>
  );
}
