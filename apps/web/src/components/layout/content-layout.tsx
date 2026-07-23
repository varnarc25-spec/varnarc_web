import type { ReactNode } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';

export function ContentLayout({
  title,
  description,
  breadcrumbs,
  children,
  showAd = true,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
  showAd?: boolean;
}) {
  return (
    <PageShell title={title} description={description} breadcrumbs={breadcrumbs}>
      {showAd ? (
        <div className="mb-6">
          <AdBanner slot="content-top" />
        </div>
      ) : null}
      {children}
    </PageShell>
  );
}
