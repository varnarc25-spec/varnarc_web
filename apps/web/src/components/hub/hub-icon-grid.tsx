import Link from 'next/link';
import { HUB_ICON_ACCENTS } from '@/lib/module-hub-configs';
import { HubIcon } from '@/components/hub/hub-icons';

export type HubGridItem = {
  label: string;
  description?: string;
  href: string;
  icon?: string;
};

export function HubIconGrid({ items, columns = 4 }: { items: HubGridItem[]; columns?: 3 | 4 }) {
  const colClass =
    columns === 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {items.map((item, index) => {
        const accent = HUB_ICON_ACCENTS[index % HUB_ICON_ACCENTS.length];
        const iconBg = accent?.iconBg ?? 'bg-blue-100';
        const iconColor = accent?.iconColor ?? 'text-blue-600';
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <HubIcon name={item.icon ?? 'calculator'} className={`h-5 w-5 ${iconColor}`} />
            </div>
            <h3 className="text-sm font-extrabold text-[#0b1f3a] group-hover:text-blue-700">
              {item.label}
            </h3>
            {item.description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
