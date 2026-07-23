import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export function PageShell({
  title,
  description,
  breadcrumbs,
  children,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
}) {
  return (
    <main className="w-full bg-white">
      <div className="site-container py-8 sm:py-10">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
