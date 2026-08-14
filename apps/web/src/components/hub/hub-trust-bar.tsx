import type { HubTrustItem } from '@/lib/module-hub-configs';
import { Check } from 'lucide-react';

export function HubTrustBar({ title, items }: { title: string; items: HubTrustItem[] }) {
  return (
    <section className="full-bleed border-t border-slate-200 bg-slate-50">
      <div className="site-container px-4 py-7 sm:py-8">
        <h2 className="text-center text-base font-extrabold text-[#0b1f3a] sm:text-lg">{title}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {items.map((item, index) => (
            <div
              key={item.title}
              className={`text-center lg:px-2 ${
                index > 0 ? 'lg:border-l lg:border-slate-200' : ''
              }`}
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0b1f3a]">{item.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-2">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
