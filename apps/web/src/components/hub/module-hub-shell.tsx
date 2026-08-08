import type { ReactNode } from 'react';
import { AdBanner } from '@/components/business/ad-banner';
import { HubHero, type HubCrumb } from '@/components/hub/hub-hero';
import { HubTrustBar } from '@/components/hub/hub-trust-bar';
import { HubDisclaimer } from '@/components/hub/hub-disclaimer';
import { getModuleHubMeta } from '@/lib/module-hub-configs';

export function ModuleHubShell({
  moduleKey,
  title,
  description,
  breadcrumbs,
  popularLinks,
  overviewTitle,
  searchPath,
  showAd = true,
  children,
}: {
  moduleKey: string;
  title: string;
  description: string;
  breadcrumbs?: HubCrumb[];
  popularLinks?: Array<{ label: string; href: string }>;
  overviewTitle?: string;
  searchPath?: string;
  showAd?: boolean;
  children: ReactNode;
}) {
  const meta = getModuleHubMeta(moduleKey);

  return (
    <main className="w-full bg-white">
      <HubHero
        badge={meta.badge}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        searchPlaceholder={meta.searchPlaceholder}
        popularLinks={popularLinks}
        heroSteps={meta.heroSteps}
        overviewTitle={overviewTitle}
        searchPath={searchPath}
      />
      <div className="site-container space-y-12 px-4 py-10 sm:py-12">
        {showAd ? (
          <div>
            <AdBanner slot="content-top" />
          </div>
        ) : null}
        {children}
      </div>
      <HubTrustBar title={meta.trustTitle} items={meta.trustItems} />
      <HubDisclaimer text={meta.disclaimer} />
    </main>
  );
}
