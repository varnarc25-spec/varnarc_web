import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/components/construction/styles';

export function ConstructionHouseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 140"
      className={cn('h-28 w-44 text-[#0b1f3a] sm:h-36 sm:w-56', className)}
      fill="none"
      aria-hidden
    >
      <path d="M20 78 L110 22 L200 78" stroke="currentColor" strokeWidth="3" />
      <path d="M38 76 V122 H182 V76" stroke="currentColor" strokeWidth="3" />
      <rect x="92" y="88" width="36" height="34" stroke="currentColor" strokeWidth="3" />
      <rect x="52" y="88" width="24" height="18" stroke="currentColor" strokeWidth="2.5" />
      <rect x="144" y="88" width="24" height="18" stroke="currentColor" strokeWidth="2.5" />
      <path d="M110 22 V8" stroke="currentColor" strokeWidth="3" />
      <circle cx="110" cy="4" r="3" fill="#f97316" />
    </svg>
  );
}

export function ConstructionHeroActions({
  primaryHref = '/construction/projects',
  primaryLabel = 'Create project',
  secondaryHref = '/construction/boq-generator',
  secondaryLabel = 'Open BOQ',
}: {
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href={primaryHref}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f97316] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c]"
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-[#0b1f3a] transition hover:border-[#f97316] hover:text-[#f97316]"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}

export function ConstructionSplitDonut({
  material,
  labour,
  other,
}: {
  material: number;
  labour: number;
  other: number;
}) {
  const total = material + labour + other || 1;
  const m = (material / total) * 100;
  const l = (labour / total) * 100;
  return (
    <div
      className="relative mx-auto h-36 w-36"
      role="img"
      aria-label={`Materials ${material}%, labour ${labour}%, other ${other}%`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#0b1f3a 0 ${m}%, #f97316 ${m}% ${m + l}%, #cbd5e1 ${m + l}% 100%)`,
        }}
      />
      <div className="absolute inset-8 rounded-full bg-white" />
    </div>
  );
}

export function ConstructionDashboardHero({
  title,
  description,
  points,
  headingAs: Heading = 'h2',
  children,
}: {
  title?: string;
  description?: string;
  points?: string[];
  headingAs?: 'h1' | 'h2';
  children?: ReactNode;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div>
        {title ? (
          <Heading className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">
            {title}
          </Heading>
        ) : null}
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
        {points?.length ? (
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        ) : null}
        {children}
      </div>
      <div className="flex justify-center lg:justify-end">
        <ConstructionHouseIllustration />
      </div>
    </section>
  );
}
