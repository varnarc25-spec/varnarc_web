import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { HomeIcon } from '@/features/home/home-icons';

export type HubLink = {
  label: string;
  href: string;
  description?: string;
  icon?: string;
};

export function VerticalHubPage({
  title,
  description,
  breadcrumbs,
  links,
  accent = '#f97316',
}: {
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  links: HubLink[];
  accent?: string;
}) {
  return (
    <PageShell title={title} description={description} breadcrumbs={breadcrumbs}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: accent }}
              >
                <HomeIcon name={link.icon ?? 'grid'} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h2>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#f97316]" />
                </div>
                {link.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
