import type { ReactNode } from 'react';
import { cn } from '@/components/construction/styles';

/**
 * Compact page hero for Construction tools and category pages.
 * Prefer one H1 (usually on ConstructionPageShell or CalculatorShell).
 */
export function ConstructionHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  as = 'header',
  titleAs = 'h1',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  as?: 'header' | 'div' | 'section';
  /** Use h2 when the page already has an H1 elsewhere. */
  titleAs?: 'h1' | 'h2';
  className?: string;
}) {
  const Root = as;
  const TitleTag = titleAs;

  return (
    <Root
      className={cn(
        'overflow-hidden rounded-2xl bg-[#0b1f3a] px-5 py-6 text-white sm:px-8 sm:py-8',
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f97316]">
              {eyebrow}
            </p>
          ) : null}
          <TitleTag
            className={cn(
              'text-2xl font-extrabold tracking-tight sm:text-3xl',
              eyebrow ? 'mt-2' : '',
            )}
          >
            {title}
          </TitleTag>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </Root>
  );
}
