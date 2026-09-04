'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Info, ShieldCheck } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

const helpLinks = [
  { href: '/about', label: 'About Varnarc', icon: Info },
  { href: '/editorial-policy', label: 'Editorial Policy', icon: BookOpenCheck },
  { href: '/corrections', label: 'Corrections Policy', icon: BookOpenCheck },
  { href: '/methodology', label: 'Methodology', icon: BookOpenCheck },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/disclaimer', label: 'Disclaimer', icon: Info },
];

export function ContactHelpLinks() {
  return (
    <section className="mt-8 border-t border-slate-100 pt-8">
      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
        You may find your answer here
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {helpLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() =>
                trackAnalyticsEvent({
                  eventType: 'contact_form',
                  metadata: {
                    action: 'contact_help_link_clicked',
                    destination: item.href,
                  },
                })
              }
              className="group flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                {item.label}
              </span>
              <ArrowRight
                className="h-4 w-4 text-slate-400 transition motion-safe:group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
