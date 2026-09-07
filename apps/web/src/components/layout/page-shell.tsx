import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export function PageShell({
  title,
  description,
  breadcrumbs,
  illustration,
  children,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  illustration?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="w-full bg-white">
      <div className="site-container py-8 sm:py-10">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p>
            ) : null}
          </div>
          {illustration ? <div className="shrink-0 sm:pt-1">{illustration}</div> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
