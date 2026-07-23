import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { Landmark } from 'lucide-react';

export function FinanceProductCard({
  name,
  href,
  description,
  meta,
  featured,
}: {
  name: string;
  href: string;
  description?: string | null;
  meta?: string | null;
  featured?: boolean;
}) {
  return (
    <Link href={href} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[var(--varnarc-brand)]">
              <Landmark className="h-4 w-4" aria-hidden />
            </div>
            {featured ? (
              <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Featured
              </span>
            ) : null}
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          ) : null}
          {meta ? <p className="mt-2 text-xs font-medium text-slate-600">{meta}</p> : null}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function AffiliateCta({ url, label = 'Apply now' }: { url: string; label?: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm text-emerald-900">Ready to take the next step?</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        {label}
      </a>
    </div>
  );
}

export function RelatedCalculators({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  if (!links.length) return null;
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Related calculators</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FinanceDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold text-[#0b1f3a]">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export function FinanceProsCons({ pros, cons }: { pros?: string | null; cons?: string | null }) {
  if (!pros && !cons) return null;
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {pros ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-bold text-emerald-900">Pros</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-emerald-900/90">{pros}</p>
        </div>
      ) : null}
      {cons ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
          <h3 className="text-sm font-bold text-rose-900">Cons</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-rose-900/90">{cons}</p>
        </div>
      ) : null}
    </div>
  );
}
