import Link from 'next/link';

export type HubListItem = {
  label: string;
  value: string;
  href?: string;
  icon?: string;
};

export function HubRatesList({
  title,
  items,
  footer,
  viewAllHref,
}: {
  title: string;
  items: HubListItem[];
  footer?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
      <h3 className="text-base font-extrabold text-[#0b1f3a]">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            {item.href ? (
              <Link href={item.href} className="font-medium text-[#0b1f3a] hover:text-blue-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[#0b1f3a]">{item.label}</span>
            )}
            <span className="shrink-0 font-bold text-blue-600">{item.value}</span>
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-4 text-xs text-slate-500">{footer}</p> : null}
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
        >
          View all →
        </Link>
      ) : null}
    </div>
  );
}
