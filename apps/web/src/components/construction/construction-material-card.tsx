import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { HardHat } from 'lucide-react';

export function ConstructionMaterialCard({
  name,
  href,
  description,
  meta,
  featured,
  sponsored,
  price,
  unit,
}: {
  name: string;
  href: string;
  description?: string | null;
  meta?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  price?: number | string | null;
  unit?: string | null;
}) {
  return (
    <Link href={href} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[#f97316]">
              <HardHat className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {sponsored ? (
                <span className="rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Sponsored
                </span>
              ) : null}
              {featured ? (
                <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
            </div>
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          ) : null}
          {meta ? <p className="mt-2 text-xs font-medium text-slate-600">{meta}</p> : null}
          {price != null ? (
            <p className="mt-2 text-sm font-semibold text-[#0b1f3a]">
              ₹{price}
              {unit ? <span className="font-normal text-slate-500"> / {unit}</span> : null}
            </p>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function AffiliateCta({ url, label = 'Buy now' }: { url: string; label?: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm text-emerald-900">Ready to purchase this material?</p>
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

export function ConstructionDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold text-[#0b1f3a]">{title}</h2>
      <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
