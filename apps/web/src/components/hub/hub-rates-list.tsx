import Link from 'next/link';
import { HubIcon } from '@/components/hub/hub-icons';

export type HubListItem = {
  label: string;
  value: string;
  href?: string;
  icon?: string;
  rateLabel?: string;
};

export function HubRatesList({
  title,
  items,
  footer,
  viewAllHref,
  compact = false,
  variant = 'default',
}: {
  title: string;
  items: HubListItem[];
  footer?: string;
  viewAllHref?: string;
  compact?: boolean;
  variant?: 'default' | 'panel';
}) {
  const isPanel = variant === 'panel';

  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-white h-full min-h-0 ${
        isPanel || compact ? 'p-4 shadow-sm' : 'p-5 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-[#0b1f3a]">{title}</h3>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
          >
            View all rates →
          </Link>
        ) : null}
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex min-h-11 items-center justify-between gap-2 py-2.5 text-sm first:pt-0"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <HubIcon name={item.icon ?? 'percent'} className="h-4 w-4 text-blue-600" />
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="truncate text-sm font-medium text-[#0b1f3a] hover:text-blue-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate text-sm font-medium text-[#0b1f3a]">{item.label}</span>
              )}
            </div>
            <div className="shrink-0 text-right">
              {item.rateLabel ? (
                <span className="text-xs text-slate-500">{item.rateLabel} </span>
              ) : null}
              <span className="text-sm font-bold tabular-nums text-[#0b1f3a]">{item.value}</span>
            </div>
          </li>
        ))}
      </ul>

      {footer ? <p className="mt-3 text-center text-sm text-slate-500">{footer}</p> : null}
    </div>
  );
}
