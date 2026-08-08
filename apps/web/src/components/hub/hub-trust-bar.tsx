import type { HubTrustItem } from '@/lib/module-hub-configs';
import { HubIcon } from '@/components/hub/hub-icons';

export function HubTrustBar({ title, items }: { title: string; items: HubTrustItem[] }) {
  return (
    <section className="full-bleed border-t border-slate-200 bg-slate-50">
      <div className="site-container px-4 py-10 sm:py-12">
        <h2 className="text-center text-lg font-extrabold text-[#0b1f3a] sm:text-xl">{title}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-blue-600">
                <HubIcon name={item.icon} className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-bold text-[#0b1f3a]">{item.title}</div>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
