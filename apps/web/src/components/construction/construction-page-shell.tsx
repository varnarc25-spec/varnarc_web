import type { ReactNode } from 'react';
import { ConstructionBreadcrumbs } from '@/components/construction/construction-breadcrumbs';
import type { ConstructionCrumb } from '@/components/construction/types';
import { cn } from '@/components/construction/styles';

/**
 * Standard page wrapper for Construction subpages (not the module hub).
 * Reuses site-container spacing and optional breadcrumbs.
 */
export function ConstructionPageShell({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: ConstructionCrumb[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn('w-full bg-white', className)}>
      <div className="site-container py-8 sm:py-10">
        {breadcrumbs?.length ? <ConstructionBreadcrumbs items={breadcrumbs} /> : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="mt-8 space-y-10 sm:space-y-12">{children}</div>
      </div>
    </main>
  );
}
