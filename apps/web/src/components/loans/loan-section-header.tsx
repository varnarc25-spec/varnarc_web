import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Consistent section header for the loans hub.
 * Eyebrow is optional and used sparingly.
 */
export function LoanSectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={`mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f97316]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id}
          className={`text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl ${
            eyebrow ? 'mt-1' : ''
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-[#0b1f3a] underline-offset-2 transition hover:text-[#f97316] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function LoanSectionActions({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-2">{children}</div>;
}
