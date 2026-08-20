import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Car,
  Droplets,
  Hammer,
  Home,
  Paintbrush,
  Sun,
  Wrench,
  Zap,
} from 'lucide-react';
import type { PopularService } from '@/lib/directory-hub';

const ICONS = {
  home: Home,
  paint: Paintbrush,
  hammer: Hammer,
  sun: Sun,
  zap: Zap,
  droplet: Droplets,
  car: Car,
  wrench: Wrench,
  building: Building2,
} as const;

const TONES = [
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-sky-50 text-sky-700',
  'bg-amber-50 text-amber-700',
  'bg-slate-100 text-slate-700',
  'bg-teal-50 text-teal-700',
] as const;

export function DirectoryPopularServices({ services }: { services: PopularService[] }) {
  if (!services.length) return null;

  return (
    <section aria-labelledby="directory-popular-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="directory-popular-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Popular services
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            High-value categories with real listings on Varnarc.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {services.map((service, index) => {
          const Icon = ICONS[service.icon];
          const tone = TONES[index % TONES.length];
          return (
            <li key={service.slug}>
              <Link
                href={`/directory/${service.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-950">{service.name}</p>
                <p className="mt-1 flex-1 text-[13px] leading-5 text-slate-600">
                  {service.description}
                </p>
                <p className="mt-3 flex items-center justify-between text-[13px] font-semibold text-blue-700">
                  <span>
                    {service.count} listing{service.count === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Explore
                    <ArrowRight
                      className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
