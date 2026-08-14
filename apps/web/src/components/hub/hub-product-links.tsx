import Link from 'next/link';
import { HUB_ICON_ACCENTS } from '@/lib/module-hub-configs';
import { HubIcon } from '@/components/hub/hub-icons';

export type HubProductLink = {
  label: string;
  description?: string;
  href: string;
  icon?: string;
};

export function HubProductLinks({
  items,
  layout = 'preview',
  scrollOnMobile = false,
}: {
  items: HubProductLink[];
  layout?: 'preview' | 'expanded';
  scrollOnMobile?: boolean;
}) {
  const isPreview = layout === 'preview';
  const useScroll = scrollOnMobile && isPreview;

  const colClass = isPreview
    ? useScroll
      ? 'flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4 xl:grid-cols-7'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4';

  const itemClass = useScroll
    ? 'group flex min-h-11 shrink-0 snap-start flex-col gap-2 rounded-xl px-3 py-3 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-[42%] min-w-[8.75rem] sm:w-auto sm:shrink sm:px-4'
    : 'group flex min-h-11 flex-col gap-2 rounded-xl px-3 py-3 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-4';

  return (
    <div className={`${useScroll ? '' : 'grid gap-2'} ${colClass}`}>
      {items.map((item, index) => {
        const accent = HUB_ICON_ACCENTS[index % HUB_ICON_ACCENTS.length];
        const iconColor = accent?.iconColor ?? 'text-blue-600';

        return (
          <Link key={item.href + item.label} href={item.href} className={itemClass}>
            <HubIcon
              name={item.icon ?? 'grid'}
              className={`h-5 w-5 shrink-0 ${iconColor} transition group-hover:scale-105`}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0b1f3a] group-hover:text-blue-700">
                {item.label}
              </div>
              {item.description ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-2">
                  {item.description}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
