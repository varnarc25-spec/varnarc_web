import Link from 'next/link';
import { HUB_ICON_ACCENTS } from '@/lib/module-hub-configs';
import { HubIcon } from '@/components/hub/hub-icons';

export type HubGridItem = {
  label: string;
  description?: string;
  href: string;
  icon?: string;
};

export function HubIconGrid({
  items,
  columns = 4,
  variant = 'default',
  scrollOnMobile = false,
  calculatorColumns = 8,
}: {
  items: HubGridItem[];
  columns?: 3 | 4 | 7 | 8;
  variant?: 'default' | 'calculator' | 'product';
  scrollOnMobile?: boolean;
  calculatorColumns?: 4 | 8;
}) {
  const isCalculator = variant === 'calculator';

  const calculatorColClass =
    calculatorColumns === 4
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4'
      : scrollOnMobile
        ? 'flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-4 xl:grid-cols-8'
        : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8';

  const colClass = isCalculator
    ? calculatorColClass
    : columns === 7
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  if (isCalculator) {
    const useScrollRow = scrollOnMobile && calculatorColumns === 8;
    const itemClass = useScrollRow
      ? 'group flex min-h-11 shrink-0 snap-start flex-col items-center rounded-xl px-3 py-3 text-center transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-[42%] min-w-[8.75rem] sm:w-auto sm:shrink sm:px-3 sm:py-4'
      : 'group flex min-h-11 flex-col items-center rounded-xl px-2 py-3 text-center transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-3 sm:py-4';

    return (
      <div className={`${useScrollRow ? '' : 'grid gap-2 sm:gap-3'} ${colClass}`}>
        {items.map((item, index) => {
          const accent = HUB_ICON_ACCENTS[index % HUB_ICON_ACCENTS.length];
          const iconColor = accent?.iconColor ?? 'text-blue-600';

          return (
            <Link key={item.href + item.label} href={item.href} className={itemClass}>
              <HubIcon
                name={item.icon ?? 'calculator'}
                className={`h-5 w-5 ${iconColor} transition group-hover:scale-105`}
              />
              <h3 className="mt-2 text-xs font-semibold text-[#0b1f3a] group-hover:text-blue-700 sm:text-sm">
                {item.label}
              </h3>
              {item.description ? (
                <p className="mt-1 text-xs leading-snug text-slate-600 line-clamp-2 sm:text-sm">
                  {item.description}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    );
  }

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
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
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
