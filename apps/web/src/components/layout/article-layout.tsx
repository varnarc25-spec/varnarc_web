import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AdBanner } from '@/components/business/ad-banner';

export function ArticleLayout({
  title,
  excerpt,
  publishedLabel,
  breadcrumbs,
  badges,
  children,
  sidebar,
}: {
  title: string;
  excerpt?: string | null;
  publishedLabel?: string | null;
  breadcrumbs: Array<{ label: string; href?: string }>;
  badges?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  return (
    <main className="w-full bg-white">
      <div className="site-container py-8 sm:py-10">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0b1f3a]">{title}</h1>
              {badges}
            </div>
            {publishedLabel ? <p className="mt-2 text-sm text-slate-500">{publishedLabel}</p> : null}
            {excerpt ? <p className="mt-4 text-lg text-slate-600">{excerpt}</p> : null}
            <div className="mt-8">{children}</div>
          </article>
          <aside className="space-y-4">
            <AdBanner slot="article-sidebar" />
            {sidebar}
          </aside>
        </div>
      </div>
    </main>
  );
}
